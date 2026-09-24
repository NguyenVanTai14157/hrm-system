import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAttendanceMetrics,
  calculateShiftStandardMinutes,
  ShiftCalculationConfig,
} from '../src/modules/attendance/attendance-calculation';

// ── BỘ KIỂM THỬ BẮT BUỘC THEO ĐẶC TẢ NGHIỆP VỤ ──────────────────────────────
// Ca 18:00–20:30, không nghỉ, 1 công, linh hoạt 10 phút (Standard duration = 150 phút)
const shift18_2030: ShiftCalculationConfig = {
  startTime: '18:00',
  endTime: '20:30',
  overnight: false,
  breakStart: null,
  breakEnd: null,
  coefficient: 1.0,
  flexibleMinutes: 10,
};

test('Ca kiểm thử 1: 18:00–20:30 -> Phút hợp lệ 150, Công 1, Muộn 0, Sớm 0', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '18:00', checkOut: '20:30' });
  assert.equal(res.validMinutes, 150);
  assert.equal(res.workday, 1);
  assert.equal(res.workdayRounded, 1);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.appliedStart, '18:00');
  assert.equal(res.appliedEnd, '20:30');
});

test('Ca kiểm thử 2: 18:05–20:30 -> Phút hợp lệ 145, Công 145/150 (~0.97), Muộn 0, Sớm 5', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '18:05', checkOut: '20:30' });
  assert.equal(res.validMinutes, 145);
  assert.equal(res.workday, 145 / 150);
  assert.equal(res.workdayRounded, 0.97);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 5);
  assert.equal(res.appliedStart, '18:05');
  assert.equal(res.appliedEnd, '20:35');
});

test('Ca kiểm thử 3: 18:05–20:35 -> Phút hợp lệ 150, Công 1, Muộn 0, Sớm 0', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '18:05', checkOut: '20:35' });
  assert.equal(res.validMinutes, 150);
  assert.equal(res.workday, 1);
  assert.equal(res.workdayRounded, 1);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.appliedStart, '18:05');
  assert.equal(res.appliedEnd, '20:35');
});

test('Ca kiểm thử 4: 18:10–20:40 -> Phút hợp lệ 150, Công 1, Muộn 0, Sớm 0', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '18:10', checkOut: '20:40' });
  assert.equal(res.validMinutes, 150);
  assert.equal(res.workday, 1);
  assert.equal(res.workdayRounded, 1);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.appliedStart, '18:10');
  assert.equal(res.appliedEnd, '20:40');
});

test('Ca kiểm thử 5: 18:11–20:30 -> Phút hợp lệ 139, Công 139/150 (~0.93), Muộn 11, Sớm 0', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '18:11', checkOut: '20:30' });
  assert.equal(res.validMinutes, 139);
  assert.equal(res.workday, 139 / 150);
  assert.equal(res.workdayRounded, 0.93);
  assert.equal(res.lateMinutes, 11);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.appliedStart, '18:00');
  assert.equal(res.appliedEnd, '20:30');
});

test('Ca kiểm thử 6: 18:15–20:45 -> Phút hợp lệ 135, Công 0.9, Muộn 15, Sớm 0', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '18:15', checkOut: '20:45' });
  assert.equal(res.validMinutes, 135);
  assert.equal(res.workday, 0.9);
  assert.equal(res.workdayRounded, 0.9);
  assert.equal(res.lateMinutes, 15);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.appliedStart, '18:00');
  assert.equal(res.appliedEnd, '20:30');
});

test('Ca kiểm thử 7: 19:28–19:40 -> Phút hợp lệ 12, Công 0.08, Muộn 88, Sớm 50', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '19:28', checkOut: '19:40' });
  assert.equal(res.validMinutes, 12);
  assert.equal(res.workday, 12 / 150);
  assert.equal(res.workdayRounded, 0.08);
  assert.equal(res.lateMinutes, 88);
  assert.equal(res.earlyMinutes, 50);
  assert.equal(res.appliedStart, '18:00');
  assert.equal(res.appliedEnd, '20:30');
});

test('Ca kiểm thử 8: 17:50–20:40 -> Phút hợp lệ 150, Công 1, Muộn 0, Sớm 0', () => {
  const res = calculateAttendanceMetrics(shift18_2030, { checkIn: '17:50', checkOut: '20:40' });
  assert.equal(res.validMinutes, 150);
  assert.equal(res.workday, 1);
  assert.equal(res.workdayRounded, 1);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.appliedStart, '18:00');
  assert.equal(res.appliedEnd, '20:30');
});

// ── CÁC CA MỞ RỘNG (EXTENDED TEST SUITE) ───────────────────────────────────

test('Linh hoạt tắt (flexibleMinutes = 0): Không dời khung ca, ghi nhận đúng muộn/sớm', () => {
  const nonFlexShift: ShiftCalculationConfig = {
    ...shift18_2030,
    flexibleMinutes: 0,
  };
  const res = calculateAttendanceMetrics(nonFlexShift, { checkIn: '18:05', checkOut: '20:35' });
  assert.equal(res.lateMinutes, 5);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.validMinutes, 145);
  assert.equal(res.workday, 145 / 150);
  assert.equal(res.appliedStart, '18:00');
  assert.equal(res.appliedEnd, '20:30');
});

test('Ca có giờ nghỉ cố định 12:00-13:00 (chuẩn 480 phút): Chỉ trừ phần nghỉ giao với giờ làm thực tế', () => {
  const dayShift: ShiftCalculationConfig = {
    startTime: '08:00',
    endTime: '17:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    coefficient: 1.0,
    flexibleMinutes: 15,
  };
  assert.equal(calculateShiftStandardMinutes(dayShift), 480);

  // 1. Làm nửa ngày buổi sáng 08:00 - 12:00: Không giao với giờ nghỉ -> Không bị trừ giờ nghỉ!
  const resMorning = calculateAttendanceMetrics(dayShift, { checkIn: '08:00', checkOut: '12:00' });
  assert.equal(resMorning.validMinutes, 240); // 4 giờ
  assert.equal(resMorning.workday, 0.5); // 240 / 480 = 0.5

  // 2. Làm 08:00 - 13:00: Giao với nghỉ 60 phút -> Trừ 60 phút nghỉ -> Thực làm 240 phút = 0.5 công
  const resWithBreak = calculateAttendanceMetrics(dayShift, { checkIn: '08:00', checkOut: '13:00' });
  assert.equal(resWithBreak.validMinutes, 240);
  assert.equal(resWithBreak.workday, 0.5);

  // 3. Làm đủ cả ngày 08:00 - 17:00: Trừ 60 phút nghỉ -> Thực làm 480 phút = 1 công
  const resFull = calculateAttendanceMetrics(dayShift, { checkIn: '08:00', checkOut: '17:00' });
  assert.equal(resFull.validMinutes, 480);
  assert.equal(resFull.workday, 1.0);

  // 4. Dời ca linh hoạt 15 phút: 08:15 - 17:15, giờ nghỉ 12:00-13:00 giữ cố định
  const resShifted = calculateAttendanceMetrics(dayShift, { checkIn: '08:15', checkOut: '17:15' });
  assert.equal(resShifted.appliedStart, '08:15');
  assert.equal(resShifted.appliedEnd, '17:15');
  assert.equal(resShifted.validMinutes, 480);
  assert.equal(resShifted.workday, 1.0);
  assert.equal(resShifted.lateMinutes, 0);
  assert.equal(resShifted.earlyMinutes, 0);
});

test('Ca qua đêm 22:00–06:00 (480 phút), linh hoạt 10 phút', () => {
  const overnightShift: ShiftCalculationConfig = {
    startTime: '22:00',
    endTime: '06:00',
    overnight: true,
    coefficient: 1.0,
    flexibleMinutes: 10,
  };
  assert.equal(calculateShiftStandardMinutes(overnightShift), 480);

  const res = calculateAttendanceMetrics(overnightShift, { checkIn: '22:05', checkOut: '06:05' });
  assert.equal(res.appliedStart, '22:05');
  assert.equal(res.appliedEnd, '06:05');
  assert.equal(res.validMinutes, 480);
  assert.equal(res.workday, 1.0);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 0);
});

test('Thiếu lượt chấm công: Đúng trạng thái, công = 0', () => {
  // Không có chấm công
  const resAbsent = calculateAttendanceMetrics(shift18_2030, null);
  assert.equal(resAbsent.workday, 0);
  assert.equal(resAbsent.status, 'ABSENT');

  // Chỉ check-in, thiếu check-out
  const resInOnly = calculateAttendanceMetrics(shift18_2030, { checkIn: '18:15', checkOut: null });
  assert.equal(resInOnly.workday, 0);
  assert.equal(resInOnly.lateMinutes, 15);
  assert.equal(resInOnly.status, 'MISSING_CHECKOUT');

  // Chỉ check-out, thiếu check-in
  const resOutOnly = calculateAttendanceMetrics(shift18_2030, { checkIn: null, checkOut: '20:30' });
  assert.equal(resOutOnly.workday, 0);
  assert.equal(resOutOnly.status, 'MISSING_CHECKIN');
});

test('Dữ liệu cấu hình không hợp lệ: Chặn mẫu số 0 và thời lượng âm an toàn', () => {
  const invalidShift1: ShiftCalculationConfig = {
    startTime: '20:30',
    endTime: '18:00', // end < start nhưng không bật qua ngày
    overnight: false,
  };
  const res1 = calculateAttendanceMetrics(invalidShift1, { checkIn: '18:00', checkOut: '20:30' });
  assert.equal(res1.workday, 0);
  assert.equal(res1.status, 'INVALID_DATA');

  const invalidShift2: ShiftCalculationConfig = {
    startTime: 'invalid',
    endTime: '20:30',
  };
  const res2 = calculateAttendanceMetrics(invalidShift2, { checkIn: '18:00', checkOut: '20:30' });
  assert.equal(res2.workday, 0);
  assert.equal(res2.status, 'INVALID_DATA');
});
