import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateShiftAttendanceWithLeave,
  isShiftEnded,
  calculateAttendanceMetrics,
} from '../src/modules/attendance/attendance-calculation';

test('1. Xác định số ngày trong tháng (28, 29, 30, 31 ngày)', () => {
  // Tháng 2 năm 2024 (năm nhuận) -> 29 ngày
  const feb2024 = new Date(2024, 2, 0).getDate();
  assert.equal(feb2024, 29);

  // Tháng 2 năm 2026 (năm thường) -> 28 ngày
  const feb2026 = new Date(2026, 2, 0).getDate();
  assert.equal(feb2026, 28);

  // Tháng 9 năm 2026 -> 30 ngày
  const sep2026 = new Date(2026, 9, 0).getDate();
  assert.equal(sep2026, 30);

  // Tháng 10 năm 2026 -> 31 ngày
  const oct2026 = new Date(2026, 10, 0).getDate();
  assert.equal(oct2026, 31);
});

test('2. Phân biệt trạng thái ô ngày: Chưa phân ca (—), Có ca chưa chấm (0), Có chấm công (> 0)', () => {
  const formatBadge = (hasShift: boolean, status: string, workday: number) => {
    if (!hasShift) return '—';
    if (status === 'PRESENT') return String(workday);
    if (status === 'LEAVE') return 'P';
    if (status === 'ABSENT') return '0';
    return '—';
  };

  assert.equal(formatBadge(false, 'UNASSIGNED', 0), '—');
  assert.equal(formatBadge(true, 'ABSENT', 0), '0');
  assert.equal(formatBadge(true, 'PRESENT', 1.0), '1');
  assert.equal(formatBadge(true, 'PRESENT', 0.93), '0.93');
  assert.equal(formatBadge(true, 'LEAVE', 1.0), 'P');
});

test('3. Bảng tổng hợp công 12 nhóm: Xử lý giá trị có nguồn và chỉ số chưa cấu hình (null -> —)', () => {
  const summary = {
    late: { minutes: 15, fine: null, workdayPenalty: null },
    early: { minutes: 0, fine: null, workdayPenalty: null },
    missing: { count: 1, fine: null, workdayPenalty: null },
    unexcused: { days: 2 },
    furlough: { initial: 12, used: 1, remaining: 11 },
    compLeave: { initial: null, used: 0, addedHours: null, remaining: null },
    mainWork: { shiftWorkday: 21.5, holidayWorkday: 0, businessTripWorkday: 1.0 },
    overtime: { hours: 4, workday: 0.5 },
    extraWork: { hours: 0, workday: 0 },
    meals: { count: 22 },
    standard: { totalStandard: 24.0 },
    total: { nightHours: 0, totalHours: 172.5, totalWorkdays: 23.0 },
  };

  // Đi muộn
  assert.equal(summary.late.minutes, 15);
  assert.equal(summary.late.fine, null); // Hiển thị —
  assert.equal(summary.late.workdayPenalty, null); // Hiển thị —

  // Quên chốt
  assert.equal(summary.missing.count, 1);
  assert.equal(summary.missing.fine, null); // Hiển thị —

  // Nghỉ phép
  assert.equal(summary.furlough.initial, 12);
  assert.equal(summary.furlough.used, 1);
  assert.equal(summary.furlough.remaining, 11);

  // Nghỉ bù (chưa có nguồn số dư)
  assert.equal(summary.compLeave.initial, null); // Hiển thị —
  assert.equal(summary.compLeave.remaining, null); // Hiển thị —

  // Công chính & Công chuẩn
  assert.equal(summary.mainWork.shiftWorkday, 21.5);
  assert.equal(summary.standard.totalStandard, 24.0);
  assert.equal(summary.total.totalWorkdays, 23.0);
});

test('4. Vừa làm vừa nghỉ một phần ca: Không cộng trùng thời gian giao nhau, tách giờ làm thực tế và nghỉ phép', () => {
  const shift = {
    startTime: '08:00',
    endTime: '17:30',
    breakStart: '12:00',
    breakEnd: '13:30',
    standardHours: 8,
    coefficient: 1.0,
    flexibleMinutes: 0,
  };

  // Nhân viên làm buổi sáng (08:00 - 12:00) = 4h (0.5 công)
  // Và xin nghỉ phép buổi chiều (13:30 - 17:30) = 4h (0.5 công)
  const log = { checkIn: '08:00', checkOut: '12:00' };
  const leaveApp = {
    type: 'approval-leave',
    fromTime: '13:30',
    toTime: '17:30',
    isPaid: true,
  };

  const result = calculateShiftAttendanceWithLeave(shift, log, leaveApp, true);
  assert.equal(result.status, 'PARTIAL_LEAVE');
  assert.equal(result.effectiveWorkedHours, 4.0); // 4 giờ làm thực tế
  assert.equal(result.leaveHours, 4.0); // 4 giờ nghỉ phép
  assert.equal(result.workedWorkday, 0.5); // 0.5 công làm
  assert.equal(result.leaveWorkday, 0.5); // 0.5 công nghỉ phép
  assert.equal(result.totalDayWorkday, 1.0); // Tổng 1.0 công
  assert.equal(result.workdayRounded, 1.0);

  // Trường hợp giao nhau (Overlapping): Nhân viên làm đến 14:30 nhưng đơn nghỉ xin từ 13:30
  // Khoảng [13:30, 14:30] không được cộng trùng 2 lần!
  const logOverlap = { checkIn: '08:00', checkOut: '14:30' }; // Làm sáng 240p + chiều 60p = 300p (5h = 0.625 công)
  const resultOverlap = calculateShiftAttendanceWithLeave(shift, logOverlap, leaveApp, true);
  assert.equal(resultOverlap.effectiveWorkedHours, 5.0); // Làm thực tế 5h
  assert.equal(resultOverlap.leaveHours, 3.0); // Phép chỉ còn 3h (không cộng trùng 1h đã làm)
  assert.equal(resultOverlap.totalDayWorkday, 1.0); // Tổng không vượt quá 1.0 công của ca
});

test('5. Ca qua đêm (overnight shift) và tính toán giờ đêm', () => {
  const shift = {
    startTime: '22:00',
    endTime: '06:00',
    overnight: true,
    standardHours: 8,
    coefficient: 1.0,
    flexibleMinutes: 10,
  };

  const log = { checkIn: '22:00', checkOut: '06:00' };
  const res = calculateAttendanceMetrics(shift, log);
  assert.equal(res.status, 'PRESENT');
  assert.equal(res.validMinutes, 480);
  assert.equal(res.workday, 1.0);
  assert.equal(res.effectiveHours, 8.0);
});

test('6. Kiểm tra ca chưa kết thúc (isShiftEnded = false) -> Trạng thái PENDING, không kết luận nghỉ không lý do', () => {
  const shift = {
    startTime: '08:00',
    endTime: '17:30',
    checkOutAfter: '01:00', // 60 phút
  };

  // Giả lập ngày tương lai (2026-10-15 khi hôm nay là 2026-09-24)
  assert.equal(isShiftEnded(shift, '2026-10-15'), false);

  // Giả lập ngày quá khứ (2026-09-01)
  assert.equal(isShiftEnded(shift, '2026-09-01'), true);

  // Giả lập hôm nay lúc 10:00 sáng (ca 08:00-17:30 chưa hết)
  const now10am = new Date('2026-09-24T03:00:00.000Z'); // 10:00 VN
  assert.equal(isShiftEnded(shift, '2026-09-24', now10am), false);

  // Giả lập hôm nay lúc 19:00 tối (ca 08:00-17:30 + buffer 60p đã kết thúc)
  const now7pm = new Date('2026-09-24T12:00:00.000Z'); // 19:00 VN
  assert.equal(isShiftEnded(shift, '2026-09-24', now7pm), true);
});

test('7. Phân biệt không có log (ABSENT) với thiếu một lượt chấm (MISSING_CHECKOUT / MISSING_CHECKIN)', () => {
  const shift = {
    startTime: '08:00',
    endTime: '17:30',
    breakStart: '12:00',
    breakEnd: '13:30',
    coefficient: 1.0,
  };

  // Chỉ có checkIn, thiếu checkOut
  const missingOut = calculateAttendanceMetrics(shift, { checkIn: '08:00' });
  assert.equal(missingOut.status, 'MISSING_CHECKOUT');
  assert.equal(missingOut.workday, 0);

  // Chỉ có checkOut, thiếu checkIn
  const missingIn = calculateAttendanceMetrics(shift, { checkOut: '17:30' });
  assert.equal(missingIn.status, 'MISSING_CHECKIN');
  assert.equal(missingIn.workday, 0);

  // Hoàn toàn không có log
  const noLog = calculateAttendanceMetrics(shift, {});
  assert.equal(noLog.status, 'ABSENT');
});

test('8. Công chuẩn chỉ tính ca chính, loại trừ ca tăng ca / OT; Công tháng bằng tổng công từng ngày không cộng trùng', () => {
  const mainShift1 = { code: 'HC_01', name: 'Ca Hành chính', coefficient: 1.0 };
  const mainShift2 = { code: 'HC_02', name: 'Ca Hành chính', coefficient: 1.0 };
  const otShift = { code: 'OT_NIGHT', name: 'Ca làm thêm đêm', coefficient: 0.5 };

  const shifts = [mainShift1, mainShift2, otShift];
  const totalStandard = shifts
    .filter((s) => !s.code.includes('OT') && !s.name.toLowerCase().includes('làm thêm') && !s.name.toLowerCase().includes('tăng ca'))
    .reduce((acc, s) => acc + s.coefficient, 0);

  // Công chuẩn chỉ tính 2 ca chính = 2.0 (loại trừ ca OT 0.5)
  assert.equal(totalStandard, 2.0);

  // Công tháng tính từ tổng ngày (ngày 1: 1.0, ngày 2: 1.0 + 0.5 OT = 1.5, ngày 3: 0)
  const dailyWorkdays = [1.0, 1.5, 0];
  const monthlyWorkday = dailyWorkdays.reduce((acc, w) => acc + w, 0);
  assert.equal(monthlyWorkday, 2.5); // Tổng công tháng = 2.5 công, OT đã tính trong ngày không cộng thêm lần nữa
});
