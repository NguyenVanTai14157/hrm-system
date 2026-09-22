const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { spawn } = require('node:child_process');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const { createPrismaClient } = require('../dist/database/client');
const { hashPassword } = require('../dist/modules/auth/password');

test('MySQL auth lifecycle, dynamic permissions and immediate revocation', { timeout: 90000 }, async () => {
  const db = createPrismaClient(process.env.DATABASE_URL);
  const suffix = randomBytes(5).toString('hex');
  const userId = randomUUID(), workerId = randomUUID(), roleId = randomUUID(), employeeId = randomUUID();
  const password = randomBytes(20).toString('hex');
  const nextPassword = randomBytes(20).toString('hex');
  let server;
  let serverLogs = '';
  const base = 'http://127.0.0.1:3342/api/v1';
  async function request(route, { method = 'GET', body, token, cookie, client = 'admin', origin } = {}) {
    const headers = { 'Content-Type': 'application/json', 'X-HRM-Client': client };
    if (token) headers.Authorization = 'Bearer ' + token;
    if (cookie) headers.Cookie = cookie;
    if (origin) headers.Origin = origin;
    const response = await fetch(base + route, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await response.json();
    return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0], headers: response.headers };
  }
  const login = (username, client = 'admin', rememberMe = false) => request('/auth/login', { method: 'POST', body: { username, password, rememberMe }, client });
  try {
    await db.permission.upsert({ where: { code: 'admin.access' }, update: {}, create: { code: 'admin.access', description: 'Admin portal access' } });
    await db.role.create({ data: { id: roleId, name: 'Auth test ' + suffix, permissions: { create: { permissionCode: 'admin.access' } } } });
    await db.user.create({ data: { id: userId, username: 'test_admin_' + suffix, displayName: 'Integration account', passwordHash: await hashPassword(password), roles: { create: { roleId } } } });
    await db.employee.create({ data: { id: employeeId, code: 'TEST_' + suffix, name: 'Integration employee' } });
    await db.user.create({ data: { id: workerId, username: 'test_worker_' + suffix, displayName: 'Integration employee', employeeId, passwordHash: await hashPassword(password), mustChangePassword: false } });
    server = spawn(process.execPath, ['dist/main.js'], {
      cwd: path.resolve(__dirname, '..'), windowsHide: true,
      env: { ...process.env, PORT: '3342', JWT_ACCESS_SECRET: randomBytes(48).toString('hex') },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stdout.on('data', b => { serverLogs += b; });
    server.stderr.on('data', b => { serverLogs += b; });
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (server.exitCode !== null) throw new Error('Test backend exited during startup');
      try { if ((await fetch(base + '/health')).ok) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    assert.ok(ready, 'test backend starts');
    assert.equal((await request('/auth/me')).status, 401);
    assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'test_admin_' + suffix, password: 'incorrect' } })).status, 401);
    assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'test_admin_' + suffix, password }, origin: 'https://untrusted.example' })).status, 403);
    assert.equal((await request('/auth/login', { method: 'POST', body: { username: 'test_admin_' + suffix, password, rememberMe: 'true' } })).status, 400);
    let account = await login('test_admin_' + suffix, 'admin', true);
    assert.equal(account.status, 200);
    assert.equal(account.data.user.mustChangePassword, true);
    assert.ok(!('passwordHash' in account.data.user));
    assert.match(account.headers.get('set-cookie'), /HttpOnly/i);
    assert.match(account.headers.get('set-cookie'), /SameSite=Lax/i);
    assert.match(account.headers.get('set-cookie'), /Expires=/i);
    assert.equal(account.headers.get('cache-control'), 'no-store');
    assert.equal((await request('/auth/admin-access', { token: account.data.accessToken })).status, 403);
    const firstToken = account.data.accessToken;
    assert.equal((await request('/auth/change-password', { method: 'POST', token: firstToken, body: { currentPassword: password, newPassword: 'short' } })).status, 400);
    account = await request('/auth/change-password', { method: 'POST', token: firstToken, body: { currentPassword: password, newPassword: nextPassword } });
    assert.equal(account.status, 200);
    assert.equal(account.data.user.mustChangePassword, false);
    assert.match(account.headers.get('set-cookie'), /Expires=/i, 'password change preserves remember setting');
    assert.equal((await request('/auth/me', { token: firstToken })).status, 401);
    assert.equal((await request('/auth/admin-access', { token: account.data.accessToken })).status, 200);
    const oldCookie = account.cookie;
    const refreshed = await request('/auth/refresh', { method: 'POST', cookie: oldCookie });
    assert.equal(refreshed.status, 200);
    assert.match(refreshed.headers.get('set-cookie'), /Expires=/i);
    assert.notEqual(refreshed.cookie, oldCookie);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: oldCookie })).status, 401);
    assert.equal((await request('/auth/me', { token: refreshed.data.accessToken })).status, 401, 'replay revokes the entire session');

    assert.equal((await login('test_worker_' + suffix)).status, 403, 'employee cannot enter admin without permission');
    let worker = await login('test_worker_' + suffix, 'client');
    assert.equal(worker.status, 200);
    assert.doesNotMatch(worker.headers.get('set-cookie'), /Expires=|Max-Age=/i, 'unchecked uses a browser-session cookie');
    const workerRefresh = await request('/auth/refresh', { method: 'POST', cookie: worker.cookie, client: 'client' });
    assert.equal(workerRefresh.status, 200);
    assert.doesNotMatch(workerRefresh.headers.get('set-cookie'), /Expires=|Max-Age=/i);
    worker = workerRefresh;
    assert.equal((await request('/auth/admin-access', { token: worker.data.accessToken, client: 'client' })).status, 403);
    assert.equal((await request('/auth/refresh', { method: 'POST', client: 'admin', cookie: worker.cookie.replace('hrm_client_', 'hrm_admin_') })).status, 401);
    await db.userRole.create({ data: { userId: workerId, roleId } });
    assert.equal((await request('/auth/admin-access', { token: worker.data.accessToken, client: 'client' })).status, 200, 'role grants apply on next API call');
    await db.userRole.delete({ where: { userId_roleId: { userId: workerId, roleId } } });
    assert.equal((await request('/auth/admin-access', { token: worker.data.accessToken, client: 'client' })).status, 403, 'role removals apply immediately');
    await db.user.update({ where: { id: workerId }, data: { status: 'LOCKED' } });
    assert.equal((await request('/auth/me', { token: worker.data.accessToken, client: 'client' })).status, 401);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: worker.cookie, client: 'client' })).status, 401);
    await db.user.update({ where: { id: workerId }, data: { status: 'ACTIVE', authVersion: { increment: 1 } } });
    worker = await login('test_worker_' + suffix, 'client');
    assert.equal((await request('/auth/logout', { method: 'POST', cookie: worker.cookie, client: 'client' })).status, 200);
    assert.equal((await request('/auth/me', { token: worker.data.accessToken, client: 'client' })).status, 401);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: worker.cookie, client: 'client' })).status, 401);
  } catch (error) {
    if (server?.exitCode !== null) console.error(serverLogs);
    throw error;
  } finally {
    if (server && server.exitCode === null) {
      const stopped = new Promise(resolve => server.once('exit', resolve));
      server.kill(); await stopped;
    }
    // Only remove fixtures identified by UUIDs generated by this test run.
    await db.user.deleteMany({ where: { id: { in: [userId, workerId] } } });
    await db.employee.deleteMany({ where: { id: employeeId } });
    await db.role.deleteMany({ where: { id: roleId } });
    await db.$disconnect();
  }
});
