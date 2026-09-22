import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword } from '../src/modules/auth/password';

test('rejects bcrypt truncation, weak passwords and verifies UTF-8 passwords', async () => {
  await assert.rejects(hashPassword('short'));
  await assert.rejects(hashPassword('ắ'.repeat(25)));
  const password = 'Mật-khẩu-đủ-dài-123';
  const hash = await hashPassword(password);
  assert.notEqual(hash, password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong-password', hash), false);
  assert.equal(await verifyPassword('a'.repeat(73), hash), false);
});
