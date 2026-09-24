/**
 * Quy chuẩn tính công và xử lý ca làm việc (Unified Attendance Calculation Engine).
 * Tuân thủ 100% đặc tả nghiệp vụ:
 * 1. Cấu hình lấy từ database (giờ vào/ra, qua ngày, nghỉ giữa ca, hệ số công, ngưỡng linh hoạt).
 * 2. Quy tắc linh hoạt kiểu đến muộn và làm bù (sliding window):
 *    - delta <= 0: giữ khung ca gốc.
 *    - 0 < delta <= ngưỡng: dời khung ca cả 2 đầu một khoảng delta; late = 0; early tính theo appliedEnd.
 *    - delta > ngưỡng: giữ khung ca gốc, ghi nhận toàn bộ delta là late; early tính theo originalEnd.
 *    - Giờ nghỉ giữa ca cố định, không dời theo; chỉ trừ phần nghỉ thực sự giao với khoảng làm hợp lệ.
 * 3. Công ca chính:
 *    - validMinutes = phần giao giữa [in, out] và [appliedStart, appliedEnd] trừ overlap nghỉ.
 *    - workday = (validMinutes / standardMinutes) * coefficient.
 *    - Chặn số âm, chia cho 0, cấu hình sai.
 * 4. Độ chính xác:
 *    - workday lưu và tính toán ở dạng số thực đầy đủ (không làm tròn từng ca trước khi tổng hợp).
 *    - workdayRounded làm tròn 2 chữ số thập phân dùng cho hiển thị.
 */

export interface ShiftCalculationConfig {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  overnight?: boolean;
  breakStart?: string | null; // "HH:mm"
  breakEnd?: string | null; // "HH:mm"
  coefficient?: number; // Tổng công cấu hình (default: 1.0)
  flexibleMinutes?: number; // Ngưỡng linh hoạt phút (default: 0 - tắt)
  standardHours?: number; // Tuỳ chọn
  checkInBefore?: string | null;
  checkOutAfter?: string | null;
}

export interface AttendancePunchInput {
  checkIn?: Date | string | null;
  checkOut?: Date | string | null;
  date?: string; // Optional "YYYY-MM-DD"
}

export interface AttendanceCalculationResult {
  validMinutes: number; // Số phút làm việc hợp lệ trong khung ca áp dụng
  effectiveMinutes: number; // Tương đương validMinutes, phục vụ tương thích
  workday: number; // Số công thực tế (chưa làm tròn để bảo toàn tổng hợp)
  workdayRounded: number; // Số công làm tròn 2 chữ số thập phân cho hiển thị
  lateMinutes: number; // Số phút đi muộn
  earlyMinutes: number; // Số phút về sớm
  status: 'PRESENT' | 'ABSENT' | 'MISSING_CHECKOUT' | 'MISSING_CHECKIN' | 'INVALID_DATA' | 'NO_SHIFT';
  appliedStart: string; // "HH:mm" giờ vào áp dụng sau khi dời ca
  appliedEnd: string; // "HH:mm" giờ ra áp dụng sau khi dời ca
  standardMinutes: number; // Thời lượng chuẩn của ca (phút)
  effectiveHours: number; // validMinutes / 60
}

/**
 * Chuyển chuỗi "HH:mm" hoặc "HH:mm:ss" thành số phút từ 00:00 (0..1439).
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Chuyển số phút từ 00:00 thành chuỗi "HH:mm" (tự động modulo 1440 cho ca qua ngày).
 */
export function formatMinutesToTime(totalMin: number): string {
  const norm = ((Math.floor(totalMin) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Chuyển đổi Date / chuỗi giờ thành số phút tương đối trong ngày làm việc.
 */
function extractMinutes(val: Date | string): number | null {
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.getHours() * 60 + val.getMinutes() + val.getSeconds() / 60;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.includes('T') || trimmed.includes('-')) {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
      }
    }
    return parseTimeToMinutes(trimmed);
  }
  return null;
}

/**
 * Tính toán số phút chuẩn của ca làm việc (thời lượng ca trừ đi khoảng nghỉ hợp lệ nằm trong ca).
 */
export function calculateShiftStandardMinutes(shift: ShiftCalculationConfig): number {
  const start = parseTimeToMinutes(shift?.startTime);
  const rawEnd = parseTimeToMinutes(shift?.endTime);
  if (start === null || rawEnd === null) return 0;

  const isOvernight = shift.overnight === true || rawEnd <= start;
  const end = isOvernight ? rawEnd + 1440 : rawEnd;
  const span = end - start;
  if (span <= 0 || span > 1440) return 0;

  let overlapBreak = 0;
  const bsRaw = parseTimeToMinutes(shift.breakStart);
  const beRaw = parseTimeToMinutes(shift.breakEnd);

  if (bsRaw !== null && beRaw !== null) {
    let bs = bsRaw;
    let be = beRaw;
    if (isOvernight || end > 1440) {
      if (bs < start) bs += 1440;
      if (be <= bs) be += 1440;
    }
    if (be > bs) {
      const effBs = Math.max(start, bs);
      const effBe = Math.min(end, be);
      if (effBe > effBs) {
        overlapBreak = effBe - effBs;
      }
    }
  }

  return Math.max(0, span - overlapBreak);
}

/**
 * Tính toán công, thời gian làm hợp lệ, đi muộn, về sớm theo quy chuẩn.
 */
export function calculateAttendanceMetrics(
  shift: ShiftCalculationConfig | null | undefined,
  log: AttendancePunchInput | null | undefined,
): AttendanceCalculationResult {
  // 1. Kiểm tra cấu hình ca
  const start = parseTimeToMinutes(shift?.startTime);
  const rawEnd = parseTimeToMinutes(shift?.endTime);

  if (!shift || start === null || rawEnd === null) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: shift ? 'INVALID_DATA' : 'NO_SHIFT',
      appliedStart: '--:--',
      appliedEnd: '--:--',
      standardMinutes: 0,
      effectiveHours: 0,
    };
  }

  const isOvernight = shift.overnight === true;
  if (!isOvernight && rawEnd <= start) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'INVALID_DATA',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(rawEnd),
      standardMinutes: 0,
      effectiveHours: 0,
    };
  }
  const end = isOvernight ? (rawEnd <= start ? rawEnd + 1440 : rawEnd) : rawEnd;
  const span = end - start;
  if (span <= 0 || span > 1440) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'INVALID_DATA',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(end),
      standardMinutes: 0,
      effectiveHours: 0,
    };
  }

  // 2. Xác định các mốc nghỉ cố định và thời lượng chuẩn
  const bsRaw = parseTimeToMinutes(shift.breakStart);
  const beRaw = parseTimeToMinutes(shift.breakEnd);
  let bs: number | null = null;
  let be: number | null = null;
  let standardOverlapBreak = 0;

  if (bsRaw !== null && beRaw !== null) {
    bs = bsRaw;
    be = beRaw;
    if (isOvernight || end > 1440) {
      if (bs < start) bs += 1440;
      if (be <= bs) be += 1440;
    }
    if (be > bs) {
      const effBs = Math.max(start, bs);
      const effBe = Math.min(end, be);
      if (effBe > effBs) {
        standardOverlapBreak = effBe - effBs;
      }
    }
  }

  const standardMinutes = Math.max(0, span - standardOverlapBreak);
  if (standardMinutes <= 0) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'INVALID_DATA',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(end),
      standardMinutes: 0,
      effectiveHours: 0,
    };
  }

  const shiftCoefficient = typeof shift.coefficient === 'number' && Number.isFinite(shift.coefficient) && shift.coefficient > 0
    ? shift.coefficient
    : 1.0;
  const flexThreshold = typeof shift.flexibleMinutes === 'number' && Number.isFinite(shift.flexibleMinutes) && shift.flexibleMinutes > 0
    ? Math.floor(shift.flexibleMinutes)
    : 0;

  // 3. Kiểm tra dữ liệu chấm công
  const hasIn = log?.checkIn != null;
  const hasOut = log?.checkOut != null;

  if (!hasIn && !hasOut) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'ABSENT',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(end),
      standardMinutes,
      effectiveHours: 0,
    };
  }

  const rawInMin = hasIn ? extractMinutes(log!.checkIn!) : null;
  const rawOutMin = hasOut ? extractMinutes(log!.checkOut!) : null;

  if (hasIn && rawInMin === null) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'INVALID_DATA',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(end),
      standardMinutes,
      effectiveHours: 0,
    };
  }
  if (hasOut && rawOutMin === null) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'INVALID_DATA',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(end),
      standardMinutes,
      effectiveHours: 0,
    };
  }

  // Xử lý ca qua đêm / check-in sau nửa đêm
  let inMin = rawInMin !== null ? rawInMin : 0;
  if (rawInMin !== null && isOvernight && inMin < start - 360) {
    inMin += 1440;
  }

  // Trường hợp thiếu check-out
  if (hasIn && !hasOut) {
    const delta = inMin - start;
    const late = delta > 0 ? delta : 0;
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: late,
      earlyMinutes: 0,
      status: 'MISSING_CHECKOUT',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(end),
      standardMinutes,
      effectiveHours: 0,
    };
  }

  // Trường hợp thiếu check-in
  if (!hasIn && hasOut) {
    return {
      validMinutes: 0,
      effectiveMinutes: 0,
      workday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'MISSING_CHECKIN',
      appliedStart: formatMinutesToTime(start),
      appliedEnd: formatMinutesToTime(end),
      standardMinutes,
      effectiveHours: 0,
    };
  }

  // Chuẩn hóa outMin cho ca qua đêm
  let outMin = rawOutMin!;
  if (log?.checkIn instanceof Date && log?.checkOut instanceof Date) {
    const dIn = new Date(log.checkIn.getFullYear(), log.checkIn.getMonth(), log.checkIn.getDate()).getTime();
    const dOut = new Date(log.checkOut.getFullYear(), log.checkOut.getMonth(), log.checkOut.getDate()).getTime();
    const dayDiff = Math.round((dOut - dIn) / 86400000);
    if (dayDiff > 0) {
      outMin += dayDiff * 1440;
    }
  } else if (outMin < inMin || (isOvernight && outMin < start - 360)) {
    outMin += 1440;
  }

  // 4. Áp dụng quy tắc linh hoạt (sliding window)
  const delta = inMin - start;
  let appliedStart = start;
  let appliedEnd = end;
  let lateMinutes = 0;
  let earlyMinutes = 0;

  if (delta <= 0) {
    // Đến sớm hoặc đúng giờ: giữ nguyên khung ca gốc
    appliedStart = start;
    appliedEnd = end;
    lateMinutes = 0;
    earlyMinutes = Math.max(0, appliedEnd - outMin);
  } else if (flexThreshold > 0 && delta <= flexThreshold) {
    // 0 < delta <= ngưỡng linh hoạt: dời khung ca một khoảng delta, không tính muộn
    appliedStart = start + delta;
    appliedEnd = end + delta;
    lateMinutes = 0;
    earlyMinutes = Math.max(0, appliedEnd - outMin);
  } else {
    // delta > ngưỡng linh hoạt (hoặc linh hoạt tắt): giữ khung gốc, ghi nhận toàn bộ delta
    appliedStart = start;
    appliedEnd = end;
    lateMinutes = delta;
    earlyMinutes = Math.max(0, appliedEnd - outMin);
  }

  // 5. Tính thời gian làm việc hợp lệ trong khung ca áp dụng
  const validStart = Math.max(inMin, appliedStart);
  const validEnd = Math.min(outMin, appliedEnd);

  let validMinutes = 0;
  if (validEnd > validStart) {
    let overlapBreak = 0;
    if (bs !== null && be !== null && be > bs) {
      // Các mốc nghỉ cố định, không dời theo
      const effBs = Math.max(validStart, bs);
      const effBe = Math.min(validEnd, be);
      if (effBe > effBs) {
        overlapBreak = effBe - effBs;
      }
    }
    validMinutes = Math.max(0, (validEnd - validStart) - overlapBreak);
  }

  // 6. Tính công chính
  const workday = standardMinutes > 0 ? (validMinutes / standardMinutes) * shiftCoefficient : 0;
  const workdayRounded = Math.round(workday * 100) / 100;
  const effectiveHours = Math.round((validMinutes / 60) * 1000) / 1000;

  return {
    validMinutes,
    effectiveMinutes: validMinutes,
    workday,
    workdayRounded,
    lateMinutes,
    earlyMinutes,
    status: 'PRESENT',
    appliedStart: formatMinutesToTime(appliedStart),
    appliedEnd: formatMinutesToTime(appliedEnd),
    standardMinutes,
    effectiveHours,
  };
}

/**
 * Kiểm tra ca làm việc đã kết thúc (bao gồm cả khung giờ cho phép check-out muộn) hay chưa.
 * Tránh kết luận "Nghỉ không lý do" khi ca vẫn đang diễn ra hoặc ngày chưa tới.
 */
export function isShiftEnded(
  shift: ShiftCalculationConfig | null | undefined,
  dateStr: string, // "YYYY-MM-DD"
  now?: Date,
): boolean {
  if (!shift || !shift.endTime) return true;
  const current = now || new Date();

  // Chuyển sang giờ Việt Nam (UTC+7)
  const vnOffset = 7 * 60;
  const utc = current.getTime() + current.getTimezoneOffset() * 60000;
  const vnDate = new Date(utc + vnOffset * 60000);
  const todayStr = vnDate.toISOString().slice(0, 10);

  if (dateStr > todayStr) {
    // Ngày tương lai -> Chưa kết thúc
    return false;
  }
  if (dateStr < todayStr) {
    // Ngày trong quá khứ -> Đã kết thúc
    return true;
  }

  // Ngày hôm nay (dateStr === todayStr): kiểm tra giờ hiện tại so với endTime + checkOutBuffer
  const currentMinutes = vnDate.getHours() * 60 + vnDate.getMinutes();
  const start = parseTimeToMinutes(shift.startTime) ?? 480;
  const rawEnd = parseTimeToMinutes(shift.endTime) ?? 1020;
  const isOvernight = shift.overnight === true || rawEnd <= start;

  if (isOvernight) {
    // Ca qua đêm bắt đầu hôm nay sẽ kết thúc vào ngày hôm sau -> hôm nay chưa kết thúc
    return false;
  }

  // Khung đệm sau ca (checkOutAfter hoặc 60 phút)
  const bufferMinutes = shift.checkOutAfter ? (parseTimeToMinutes(shift.checkOutAfter) ?? 60) : 60;
  const shiftEndWithBuffer = rawEnd + bufferMinutes;

  return currentMinutes >= shiftEndWithBuffer;
}

export interface LeaveSegmentInput {
  id?: string;
  type: string;
  fromTime?: string | null;
  toTime?: string | null;
  durationHours?: number | null;
  workdayRatio?: number | null;
  isPaid?: boolean;
}

export interface AttendanceWithLeaveResult {
  validWorkedMinutes: number;
  validLeaveMinutes: number;
  effectiveWorkedHours: number;
  leaveHours: number;
  workedWorkday: number;
  leaveWorkday: number;
  totalDayWorkday: number;
  workdayRounded: number;
  lateMinutes: number;
  earlyMinutes: number;
  status: 'PRESENT' | 'LEAVE' | 'PARTIAL_LEAVE' | 'ABSENT' | 'MISSING_CHECKOUT' | 'MISSING_CHECKIN' | 'PENDING' | 'INVALID_DATA' | 'NO_SHIFT';
  appliedStart: string;
  appliedEnd: string;
  standardMinutes: number;
}

/**
 * Tính toán công kết hợp: vừa làm vừa nghỉ một phần ca (tránh cộng trùng thời gian giao nhau).
 * Tách biệt giờ làm thực tế khỏi thời gian nghỉ phép được hưởng công.
 */
export function calculateShiftAttendanceWithLeave(
  shift: ShiftCalculationConfig | null | undefined,
  log: AttendancePunchInput | null | undefined,
  leaveApp: LeaveSegmentInput | null | undefined,
  isEnded: boolean = true,
): AttendanceWithLeaveResult {
  // 1. Nếu không có ca
  if (!shift) {
    return {
      validWorkedMinutes: 0,
      validLeaveMinutes: 0,
      effectiveWorkedHours: 0,
      leaveHours: 0,
      workedWorkday: 0,
      leaveWorkday: 0,
      totalDayWorkday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'NO_SHIFT',
      appliedStart: '--:--',
      appliedEnd: '--:--',
      standardMinutes: 0,
    };
  }

  // 2. Tính toán công chấm công thực tế
  const baseResult = calculateAttendanceMetrics(shift, log);
  const standardMinutes = baseResult.standardMinutes;
  const shiftCoeff = typeof shift.coefficient === 'number' && Number.isFinite(shift.coefficient) && shift.coefficient > 0
    ? shift.coefficient
    : 1.0;

  if (standardMinutes <= 0) {
    return {
      validWorkedMinutes: 0,
      validLeaveMinutes: 0,
      effectiveWorkedHours: 0,
      leaveHours: 0,
      workedWorkday: 0,
      leaveWorkday: 0,
      totalDayWorkday: 0,
      workdayRounded: 0,
      lateMinutes: 0,
      earlyMinutes: 0,
      status: 'INVALID_DATA',
      appliedStart: baseResult.appliedStart,
      appliedEnd: baseResult.appliedEnd,
      standardMinutes: 0,
    };
  }

  // 3. Xử lý khi có đơn nghỉ phép hưởng lương
  let validLeaveMinutes = 0;
  if (leaveApp && leaveApp.isPaid !== false) {
    const shiftStart = parseTimeToMinutes(shift.startTime) ?? 0;
    const rawEnd = parseTimeToMinutes(shift.endTime) ?? 0;
    const isOvernight = shift.overnight === true || rawEnd <= shiftStart;
    const shiftEnd = isOvernight ? rawEnd + 1440 : rawEnd;

    // Khoảng nghỉ giữa ca
    const bsRaw = parseTimeToMinutes(shift.breakStart);
    const beRaw = parseTimeToMinutes(shift.breakEnd);

    if (leaveApp.fromTime && leaveApp.toTime) {
      let lStart = parseTimeToMinutes(leaveApp.fromTime) ?? shiftStart;
      let lEnd = parseTimeToMinutes(leaveApp.toTime) ?? shiftEnd;
      if (isOvernight && lEnd <= lStart) lEnd += 1440;

      // Cắt theo khung ca chuẩn
      const effLStart = Math.max(shiftStart, lStart);
      const effLEnd = Math.min(shiftEnd, lEnd);

      if (effLEnd > effLStart) {
        let leaveOverlapBreak = 0;
        if (bsRaw !== null && beRaw !== null && beRaw > bsRaw) {
          const effBs = Math.max(effLStart, bsRaw);
          const effBe = Math.min(effLEnd, beRaw);
          if (effBe > effBs) leaveOverlapBreak = effBe - effBs;
        }
        validLeaveMinutes = Math.max(0, effLEnd - effLStart - leaveOverlapBreak);

        // Tránh cộng trùng nếu log thực tế cũng làm trong khoảng này (overlap deduction)
        if (baseResult.validMinutes > 0 && log?.checkIn && log?.checkOut) {
          const inMin = parseTimeToMinutes(typeof log.checkIn === 'string' ? log.checkIn.slice(11, 16) || log.checkIn : formatMinutesToTime(extractMinutes(log.checkIn) ?? shiftStart)) ?? shiftStart;
          let outMin = parseTimeToMinutes(typeof log.checkOut === 'string' ? log.checkOut.slice(11, 16) || log.checkOut : formatMinutesToTime(extractMinutes(log.checkOut) ?? shiftEnd)) ?? shiftEnd;
          if (outMin < inMin) outMin += 1440;

          const workStart = Math.max(shiftStart, inMin);
          const workEnd = Math.min(shiftEnd, outMin);

          // Giao nhau giữa khoảng làm và khoảng nghỉ phép
          const overStart = Math.max(effLStart, workStart);
          const overEnd = Math.min(effLEnd, workEnd);
          if (overEnd > overStart) {
            let doubleOverlap = overEnd - overStart;
            // Trừ phần giao nhau khỏi phút nghỉ phép để giữ nguyên giờ làm thực tế
            validLeaveMinutes = Math.max(0, validLeaveMinutes - doubleOverlap);
          }
        }
      }
    } else if (typeof leaveApp.durationHours === 'number' && leaveApp.durationHours > 0) {
      const requestedLeaveMinutes = leaveApp.durationHours * 60;
      // Số phút nghỉ hợp lệ không vượt quá phần ca chưa làm
      validLeaveMinutes = Math.max(0, Math.min(requestedLeaveMinutes, standardMinutes - baseResult.validMinutes));
    } else if (typeof leaveApp.workdayRatio === 'number' && leaveApp.workdayRatio > 0) {
      const requestedLeaveMinutes = leaveApp.workdayRatio * standardMinutes;
      validLeaveMinutes = Math.max(0, Math.min(requestedLeaveMinutes, standardMinutes - baseResult.validMinutes));
    } else {
      // Đơn nghỉ cả ngày
      validLeaveMinutes = Math.max(0, standardMinutes - baseResult.validMinutes);
    }
  }

  // 4. Tổng hợp và phân tách công
  validLeaveMinutes = Math.max(0, Math.min(validLeaveMinutes, standardMinutes - baseResult.validMinutes));

  const workedWorkday = standardMinutes > 0 ? (baseResult.validMinutes / standardMinutes) * shiftCoeff : 0;
  const leaveWorkday = standardMinutes > 0 ? (validLeaveMinutes / standardMinutes) * shiftCoeff : 0;
  const totalDayWorkday = workedWorkday + leaveWorkday;
  const workdayRounded = Math.round(totalDayWorkday * 100) / 100;

  const effectiveWorkedHours = Math.round((baseResult.validMinutes / 60) * 100) / 100;
  const leaveHours = Math.round((validLeaveMinutes / 60) * 100) / 100;

  // Xác định trạng thái chuẩn xác
  let status: AttendanceWithLeaveResult['status'] = baseResult.status;
  if (baseResult.validMinutes > 0 && validLeaveMinutes > 0) {
    status = 'PARTIAL_LEAVE';
  } else if (validLeaveMinutes > 0 && baseResult.validMinutes === 0) {
    status = 'LEAVE';
  } else if (baseResult.status === 'ABSENT') {
    if (!isEnded) {
      status = 'PENDING';
    } else {
      status = 'ABSENT';
    }
  }

  return {
    validWorkedMinutes: baseResult.validMinutes,
    validLeaveMinutes,
    effectiveWorkedHours,
    leaveHours,
    workedWorkday,
    leaveWorkday,
    totalDayWorkday,
    workdayRounded,
    lateMinutes: baseResult.lateMinutes,
    earlyMinutes: baseResult.earlyMinutes,
    status,
    appliedStart: baseResult.appliedStart,
    appliedEnd: baseResult.appliedEnd,
    standardMinutes,
  };
}
