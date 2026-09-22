import assert from 'node:assert/strict';
import test from 'node:test';
import { validateEnvironment } from '../src/config/environment';

const valid = { JWT_ACCESS_SECRET: 'x'.repeat(64), DATABASE_URL: 'mysql://test:test@localhost:3306/test' };
test('defaults support both local web applications', () => {
  const env = validateEnvironment(valid);
  assert.equal(env.PORT, 3002);
  assert.deepEqual(env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3001']);
});
test('rejects invalid ports and ambiguous CORS origins', () => {
  for (const PORT of ['abc', '0', '65536', '1.5']) assert.throws(() => validateEnvironment({ ...valid, PORT }));
  for (const CORS_ORIGINS of ['*', '', 'https://example.com/path', 'file:///tmp']) {
    assert.throws(() => validateEnvironment({ ...valid, CORS_ORIGINS }));
  }
});
test('requires database and strong signing configuration', () => {
  assert.throws(() => validateEnvironment({}));
  assert.throws(() => validateEnvironment({ ...valid, JWT_ACCESS_SECRET: 'weak' }));
  assert.throws(() => validateEnvironment({ ...valid, DATABASE_URL: 'mysql://localhost' }));
});
