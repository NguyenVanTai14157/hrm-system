import { BadRequestException } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

export function validatePassword(password: string) {
  if (password.length < 10 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new BadRequestException('Mật khẩu cần ít nhất 10 ký tự và tối đa 72 byte UTF-8.');
  }
}
export async function hashPassword(password: string) {
  validatePassword(password);
  return hash(password, 12);
}
export async function verifyPassword(password: string, hashValue: string) {
  if (Buffer.byteLength(password, 'utf8') > 72) return false;
  return compare(password, hashValue);
}
