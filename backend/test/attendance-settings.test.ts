import assert from 'node:assert/strict';
import test from 'node:test';
import { gpsInput, shiftInput } from '../src/modules/attendance/settings-validation';
import { AttendanceService } from '../src/modules/attendance/attendance.service';

const shift = { code: 'TEST', name: 'Ca TEST', startTime: '08:00', endTime: '17:00', overnight: false, coefficient: 1 };
test('Ca ngày trừ giờ nghỉ và giữ số công cấu hình', () => {
  const result = shiftInput({ ...shift, breakStart: '12:00', breakEnd: '13:00', coefficient: 0.5 });
  assert.equal(result.standardHours, 8);
  assert.equal(result.coefficient, 0.5);
});
test('Ca 08:00 đến 20:30 không qua ngày, không nghỉ có thời lượng 12.5 giờ', () => {
  const result = shiftInput({ ...shift, startTime: '08:00', endTime: '20:30', overnight: false, coefficient: 1.0 });
  assert.equal(result.standardHours, 12.5);
  assert.equal(result.coefficient, 1.0);

  const service = new AttendanceService({} as any, {} as any);
  const hours = service.calculateShiftStandardHours('08:00', '20:30', false, null, null);
  assert.equal(hours, 12.5);
});
test('Ca 16:00 đến 20:30 không qua ngày, không nghỉ có thời lượng 4.5 giờ', () => {
  const result = shiftInput({ ...shift, startTime: '16:00', endTime: '20:30', overnight: false, coefficient: 1.0 });
  assert.equal(result.standardHours, 4.5);
  assert.equal(result.coefficient, 1.0);

  const service = new AttendanceService({} as any, {} as any);
  const hours = service.calculateShiftStandardHours('16:00', '20:30', false, null, null);
  assert.equal(hours, 4.5);
});
test('Ca 08:00 đến 20:30 có nghỉ 12:00 - 13:30 có thời lượng 11.0 giờ', () => {
  const result = shiftInput({ ...shift, startTime: '08:00', endTime: '20:30', overnight: false, breakStart: '12:00', breakEnd: '13:30', coefficient: 1.0 });
  assert.equal(result.standardHours, 11.0);

  const service = new AttendanceService({} as any, {} as any);
  const hours = service.calculateShiftStandardHours('08:00', '20:30', false, '12:00', '13:30');
  assert.equal(hours, 11.0);
});
test('Ca qua đêm và nghỉ sau nửa đêm', () => {
  const result = shiftInput({ ...shift, startTime: '22:00', endTime: '06:00', overnight: true, breakStart: '02:00', breakEnd: '02:30' });
  assert.equal(result.standardHours, 7.5);

  const service = new AttendanceService({} as any, {} as any);
  const hours = service.calculateShiftStandardHours('22:00', '06:00', true, '02:00', '02:30');
  assert.equal(hours, 7.5);
});
test('Chặn khoảng nghỉ ngoài ca và giờ sai', () => {
  assert.throws(() => shiftInput({ ...shift, breakStart: '07:00', breakEnd: '08:00' }));
  assert.throws(() => shiftInput({ ...shift, startTime: '25:00' }));
  assert.throws(() => shiftInput({ ...shift, breakStart: '12:00' }));
  assert.throws(() => shiftInput({ ...shift, coefficient: -1 }));
  assert.throws(() => shiftInput({ ...shift, endTime: '07:00' }));
  assert.throws(() => shiftInput({ ...shift, flexibleMinutes: -5 }));
  assert.throws(() => shiftInput({ ...shift, flexibleMinutes: 301 }));
  assert.throws(() => shiftInput({ ...shift, flexibleMinutes: 10.5 }));
});
test('Hỗ trợ flexibleMinutes hợp lệ và mặc định là 0', () => {
  const def = shiftInput(shift);
  assert.equal(def.flexibleMinutes, 0);
  const flex = shiftInput({ ...shift, flexibleMinutes: 15 });
  assert.equal(flex.flexibleMinutes, 15);
});
const gps = { code: 'TEST_GPS', name: 'Điểm TEST', latitude: 16, longitude: 108, radius: 100 };
test('GPS kiểm tra tọa độ, bán kính và trạng thái, không ép chuỗi thành số', () => {
  assert.equal(gpsInput(gps).radius, 100);
  for (const change of [{ latitude: 91 }, { longitude: -181 }, { radius: 0 }, { radius: 1.5 }, { latitude: '16' }, { isActive: 'true' }, { code: '' }]) {
    assert.throws(() => gpsInput({ ...gps, ...change }));
  }
});
