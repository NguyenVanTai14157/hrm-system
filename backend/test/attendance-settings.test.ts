import assert from 'node:assert/strict';
import test from 'node:test';
import { gpsInput, shiftInput } from '../src/modules/attendance/settings-validation';

const shift = { code: 'TEST', name: 'Ca TEST', startTime: '08:00', endTime: '17:00', overnight: false, coefficient: 1 };
test('Ca ngày trừ giờ nghỉ và giữ số công cấu hình', () => {
  const result = shiftInput({ ...shift, breakStart: '12:00', breakEnd: '13:00', coefficient: 0.5 });
  assert.equal(result.standardHours, 8);
  assert.equal(result.coefficient, 0.5);
});
test('Ca qua đêm và nghỉ sau nửa đêm', () => {
  const result = shiftInput({ ...shift, startTime: '22:00', endTime: '06:00', overnight: true, breakStart: '02:00', breakEnd: '02:30' });
  assert.equal(result.standardHours, 7.5);
});
test('Chặn khoảng nghỉ ngoài ca và giờ sai', () => {
  assert.throws(() => shiftInput({ ...shift, breakStart: '07:00', breakEnd: '08:00' }));
  assert.throws(() => shiftInput({ ...shift, startTime: '25:00' }));
  assert.throws(() => shiftInput({ ...shift, breakStart: '12:00' }));
  assert.throws(() => shiftInput({ ...shift, coefficient: -1 }));
  assert.throws(() => shiftInput({ ...shift, endTime: '07:00' }));
});
const gps = { code: 'TEST_GPS', name: 'Điểm TEST', latitude: 16, longitude: 108, radius: 100 };
test('GPS kiểm tra tọa độ, bán kính và trạng thái, không ép chuỗi thành số', () => {
  assert.equal(gpsInput(gps).radius, 100);
  for (const change of [{ latitude: 91 }, { longitude: -181 }, { radius: 0 }, { radius: 1.5 }, { latitude: '16' }, { isActive: 'true' }, { code: '' }]) {
    assert.throws(() => gpsInput({ ...gps, ...change }));
  }
});
