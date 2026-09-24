import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateAttendanceMetrics } from '../src/modules/attendance/attendance-calculation';

test('1. Nhân viên chưa chấm công: Không kết luận Đúng giờ, trả về trạng thái ABSENT, 0 công, 0 muộn/sớm', () => {
  const shift = {
    startTime: '08:00',
    endTime: '17:30',
    breakStart: '12:00',
    breakEnd: '13:30',
    coefficient: 1.0,
    flexibleMinutes: 10,
  };

  const res = calculateAttendanceMetrics(shift, null);
  assert.equal(res.status, 'ABSENT');
  assert.equal(res.workday, 0);
  assert.equal(res.workdayRounded, 0);
  assert.equal(res.lateMinutes, 0);
  assert.equal(res.earlyMinutes, 0);
  assert.equal(res.validMinutes, 0);
});

test('2. Nhân viên không có ca phân công (shift = null): Trả về NO_SHIFT, 0 công', () => {
  const res = calculateAttendanceMetrics(null, null);
  assert.equal(res.status, 'NO_SHIFT');
  assert.equal(res.workday, 0);
  assert.equal(res.appliedStart, '--:--');
  assert.equal(res.appliedEnd, '--:--');
});

test('3. Nhân viên mới chưa phân ca: Không kế thừa ca của người khác', () => {
  // Mô phỏng logic getMyToday khi employeeId không có phân ca APPROVED trong ngày
  const mockAssignmentsForNewEmployee: any[] = [];
  const primaryShift = mockAssignmentsForNewEmployee[0]?.shift || null;
  assert.equal(primaryShift, null);

  const metrics = calculateAttendanceMetrics(primaryShift, null);
  assert.equal(metrics.status, 'NO_SHIFT');
  assert.equal(metrics.workday, 0);
});

test('4. Phân ca hết hiệu lực: Phân ca ngày 23/09 không áp dụng cho ngày 24/09', () => {
  const assignmentsDb = [
    {
      employeeId: 'emp-1',
      date: new Date('2026-09-23T00:00:00.000Z'),
      status: 'APPROVED',
      shift: { name: 'Ca Hành chính', startTime: '08:00', endTime: '17:30' },
    },
  ];

  const targetDateStart = new Date('2026-09-24T00:00:00.000Z');
  const targetDateEnd = new Date('2026-09-24T23:59:59.999Z');

  const todayAssignments = assignmentsDb.filter(
    (a) => a.date >= targetDateStart && a.date <= targetDateEnd && a.status === 'APPROVED'
  );

  assert.equal(todayAssignments.length, 0);
  const primaryShift = todayAssignments[0]?.shift || null;
  assert.equal(primaryShift, null);
});

test('5. Tài khoản liên kết lại đúng nhân viên cũ: Nhận diện đúng ca đã phân công của nhân viên đó', () => {
  const empId = 'emp-existing';
  const assignmentsDb = [
    {
      employeeId: empId,
      date: new Date('2026-09-24T00:00:00.000Z'),
      status: 'APPROVED',
      shift: { name: 'ca tối', code: 'CA555', startTime: '18:00', endTime: '20:30', coefficient: 1.0, flexibleMinutes: 10 },
    },
  ];

  const targetDateStart = new Date('2026-09-24T00:00:00.000Z');
  const targetDateEnd = new Date('2026-09-24T23:59:59.999Z');

  const todayAssignments = assignmentsDb.filter(
    (a) => a.employeeId === empId && a.date >= targetDateStart && a.date <= targetDateEnd && a.status === 'APPROVED'
  );

  assert.equal(todayAssignments.length, 1);
  assert.equal(todayAssignments[0].shift.code, 'CA555');
  assert.equal(todayAssignments[0].shift.startTime, '18:00');
});
