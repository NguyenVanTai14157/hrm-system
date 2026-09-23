import { BadRequestException } from '@nestjs/common';

export function gpsInput(input: Record<string, unknown>) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Địa điểm không hợp lệ');
  const text = (key: string, max: number) => {
    const value = input[key];
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
      throw new BadRequestException(`Trường ${key} không hợp lệ`);
    return value.trim();
  };
  const number = (key: string, min: number, max: number) => {
    const value = input[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
      throw new BadRequestException(`Trường ${key} không hợp lệ`);
    return value;
  };
  const radius = number('radius', 1, 2147483647);
  if (!Number.isInteger(radius)) throw new BadRequestException('Bán kính phải là số nguyên mét');
  if (input.isActive !== undefined && typeof input.isActive !== 'boolean')
    throw new BadRequestException('Trạng thái không hợp lệ');
  if (input.address != null && (typeof input.address !== 'string' || input.address.length > 255))
    throw new BadRequestException('Địa chỉ tối đa 255 ký tự');
  return { code: text('code', 50), name: text('name', 150),
    latitude: number('latitude', -90, 90), longitude: number('longitude', -180, 180),
    radius, isActive: input.isActive === undefined ? true : input.isActive as boolean,
    address: typeof input.address === 'string' ? input.address.trim() : null };
}

export function shiftInput(input: Record<string, unknown>) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('Ca không hợp lệ');
  if (typeof input.overnight !== 'boolean') throw new BadRequestException('Chọn ca cùng ngày hoặc qua ngày');
  const time = (key: string, optional = false) => {
    const value = input[key];
    if (optional && (value == null || value === '')) return null;
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
      throw new BadRequestException(`Trường ${key} phải có định dạng HH:mm`);
    return value;
  };
  const startTime = time('startTime')!;
  const endTime = time('endTime')!;
  const breakStart = time('breakStart', true);
  const breakEnd = time('breakEnd', true);
  const mins = (v: string) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
  const start = mins(startTime);
  const end = mins(endTime) + (input.overnight === true ? 1440 : 0);
  if (end <= start || end - start > 1440) throw new BadRequestException('Giờ ra và lựa chọn qua ngày không hợp lệ');
  let workMinutes = end - start;
  if (!!breakStart !== !!breakEnd) throw new BadRequestException('Nhập đủ giờ bắt đầu và kết thúc nghỉ');
  if (breakStart && breakEnd) {
    let a = mins(breakStart); let b = mins(breakEnd);
    if (a < start) a += 1440;
    if (b <= a) b += 1440;
    if (a < start || b > end || b <= a) throw new BadRequestException('Khoảng nghỉ phải nằm trong ca');
    workMinutes -= b - a;
  }
  if (workMinutes <= 0) throw new BadRequestException('Tổng giờ phải lớn hơn 0');
  for (const [key, max] of [['code', 50], ['name', 100]] as const) {
    if (typeof input[key] !== 'string' || !input[key].trim() || input[key].trim().length > max)
      throw new BadRequestException(`Trường ${key} không hợp lệ`);
  }
  if (typeof input.coefficient !== 'number' || !Number.isFinite(input.coefficient) || input.coefficient <= 0)
    throw new BadRequestException('Tổng công phải lớn hơn 0');
  if (input.description != null && (typeof input.description !== 'string' || input.description.length > 255))
    throw new BadRequestException('Ghi chú tối đa 255 ký tự');
  const duration = (key: string) => {
    const value = input[key];
    if (value == null || value === '') return null;
    if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))
      throw new BadRequestException(`Trường ${key} phải có định dạng HH:mm hoặc HH:mm:ss`);
    return value.length === 5 ? `${value}:00` : value;
  };
  return { code: (input.code as string).trim(), name: (input.name as string).trim(), startTime, endTime,
    overnight: input.overnight === true, checkInBefore: duration('checkInBefore'), checkOutAfter: duration('checkOutAfter'),
    breakStart, breakEnd, standardHours: workMinutes / 60, coefficient: input.coefficient,
    description: typeof input.description === 'string' ? input.description.trim() : null };
}
