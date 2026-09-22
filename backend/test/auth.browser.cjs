// Optional browser check: supply PLAYWRIGHT_MODULE pointing to an installed playwright package.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
const { spawn } = require('node:child_process');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const { createPrismaClient } = require('../dist/database/client');
const { hashPassword } = require('../dist/modules/auth/password');

(async () => {
  const db = createPrismaClient(process.env.DATABASE_URL);
  const userId = randomUUID(), roleId = randomUUID();
  const username = 'browser_' + randomBytes(4).toString('hex');
  const password = randomBytes(20).toString('hex'), next = randomBytes(20).toString('hex');
  const children = [];
  let browser;
  function launch(cwd, args, env = {}) {
    const child = spawn(process.execPath, args, { cwd, env: { ...process.env, ...env }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let logs = '';
    child.stdout.on('data', b => { logs += b; });
    child.stderr.on('data', b => { logs += b; });
    children.push({ child, logs: () => logs });
  }
  async function ready(url) {
    for (let i = 0; i < 120; i++) {
      if (children.some(({ child }) => child.exitCode !== null)) throw new Error('A test server could not start.');
      try { if ((await fetch(url)).ok) return; } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    throw new Error('Server startup timed out');
  }
  try {
    await db.role.create({ data: { id: roleId, name: 'Browser test ' + username, permissions: { create: { permissionCode: 'admin.access' } } } });
    await db.user.create({ data: { id: userId, username, displayName: 'Kiểm tra đăng nhập', passwordHash: await hashPassword(password), roles: { create: { roleId } } } });
    const root = path.resolve(__dirname, '../..');
    launch(path.join(root, 'backend'), ['dist/main.js'], { PORT: '3343', CORS_ORIGINS: 'http://localhost:3300,http://localhost:3301' });
    launch(path.join(root, 'admin-web'), ['../node_modules/next/dist/bin/next', 'start', '-p', '3300']);
    launch(path.join(root, 'client-web'), ['../node_modules/next/dist/bin/next', 'start', '-p', '3301']);
    await Promise.all([ready('http://localhost:3343/api/v1/health'), ready('http://localhost:3300'), ready('http://localhost:3301')]);
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const context = await browser.newContext();
    // Route to the real isolated test backend; no API responses are mocked.
    await context.route('http://localhost:3002/**', route => route.continue({ url: route.request().url().replace(':3002/', ':3343/') }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://localhost:3300/hrm/employees');
    await page.waitForURL('**/login');
    await page.locator('input#username').fill(username);
    await page.locator('input#password').fill('wrong-password');
    await page.locator('button[type=submit]').click();
    await page.locator('.auth-alert').waitFor();
    await page.locator('input#password').fill(password);
    await page.getByRole('checkbox', { name: 'Keep me logged in' }).check();
    await page.locator('button[type=submit]').click();
    await page.waitForURL('**/change-password');
    await page.locator('input#currentPassword').fill(password);
    await page.locator('input#newPassword').fill(next);
    await page.locator('input#confirm').fill(next);
    await page.locator('button[type=submit]').click();
    await page.waitForURL('http://localhost:3300/');
    await page.locator('.portal-topbar').waitFor();
    await page.reload();
    await page.locator('.portal-topbar').waitFor();
    assert.ok((await context.cookies()).some(c => c.name === 'hrm_admin_refresh' && c.httpOnly));
    assert.ok((await context.cookies()).find(c => c.name === 'hrm_admin_refresh').expires > Date.now() / 1000);
    assert.equal(await page.evaluate(() => Object.keys(localStorage).some(k => /token/i.test(k))), false);
    // Separate tabs serialize refresh cookie rotation using Web Locks.
    const second = await context.newPage();
    await Promise.all([page.reload(), second.goto('http://localhost:3300/')]);
    await page.locator('.portal-topbar').waitFor();
    await second.locator('.portal-topbar').waitFor();
    await second.close();

    const client = await context.newPage();
    client.on('pageerror', e => errors.push(e.message));
    await client.setViewportSize({ width: 390, height: 844 });
    await client.goto('http://localhost:3301/');
    await client.waitForURL('**/login');
    await client.locator('input#username').fill(username);
    await client.locator('input#password').fill(next);
    await client.locator('button[type=submit]').click();
    await client.waitForURL('http://localhost:3301/');
    await client.getByRole('button', { name: 'Đăng xuất', exact: true }).waitFor();
    assert.equal((await context.cookies()).find(c => c.name === 'hrm_client_refresh').expires, -1);
    assert.equal(await client.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('.account-trigger').click();
    await page.locator('.account-action-logout').click();
    await page.waitForURL('**/login');
    await page.locator('input#username').waitFor();
    assert.equal(await page.locator('input#username').inputValue(), username);
    assert.equal(await page.locator('input#password').inputValue(), '');
    assert.equal(await page.getByRole('checkbox', { name: 'Keep me logged in' }).isChecked(), true);
    await page.reload();
    await page.locator('input#username').waitFor();
    assert.equal(await page.locator('input#username').inputValue(), username);
    await page.getByRole('checkbox', { name: 'Keep me logged in' }).uncheck();
    await page.reload();
    await page.locator('input#username').waitFor();
    assert.equal(await page.locator('input#username').inputValue(), '');
    await client.reload();
    await client.getByRole('button', { name: 'Đăng xuất', exact: true }).waitFor();
    await client.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
    await client.waitForURL('**/login');
    await client.reload();
    await client.locator('input#username').waitFor();
    assert.equal(await client.locator('input#username').inputValue(), '');
    assert.equal(await client.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await client.screenshot({ path: path.join(root, '.npm-cache/login-mobile.png') });
    assert.deepEqual(errors, []);
    console.log('PASS: protected routes, incorrect password, first password change, reload, parallel tabs, independent portal cookies, real logout, mobile layout, no browser exceptions.');
  } catch (error) {
    for (const item of children) if (item.child.exitCode !== null) console.error(item.logs());
    throw error;
  } finally {
    if (browser) await browser.close();
    await Promise.all(children.map(({ child }) => {
      if (child.exitCode !== null) return;
      return new Promise(resolve => { child.once('exit', resolve); child.kill(); });
    }));
    await db.user.deleteMany({ where: { id: userId } });
    await db.role.deleteMany({ where: { id: roleId } });
    await db.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
