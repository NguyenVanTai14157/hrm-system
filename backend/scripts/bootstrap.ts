import 'dotenv/config';
import { config } from 'dotenv';
import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { createPrismaClient } from '../src/database/client';
import { hashPassword } from '../src/modules/auth/password';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL in backend/.env first.');
  const db = createPrismaClient(process.env.DATABASE_URL);
  try {
    if (await db.user.count()) {
      console.log('Bootstrap skipped: users already exist. No credentials or roles were changed.');
      return;
    }
    if (!existsSync('.env.bootstrap')) {
      writeFileSync('.env.bootstrap', 'BOOTSTRAP_USERNAME=admin\nBOOTSTRAP_PASSWORD=' + randomBytes(18).toString('base64url') + '\n', { flag: 'wx' });
    }
    config({ path: '.env.bootstrap', quiet: true });
    const username = process.env.BOOTSTRAP_USERNAME ?? 'admin';
    const password = process.env.BOOTSTRAP_PASSWORD;
    if (!/^[a-z0-9._-]{3,50}$/.test(username) || !password) throw new Error('Invalid bootstrap credentials.');
    const passwordHash = await hashPassword(password);
    await db.$transaction(async (tx) => {
      for (const [code, description] of [
        ['admin.access', 'Truy cập cổng quản trị'],
        ['system.manage', 'Quản trị tài khoản và phân quyền'],
      ]) {
        await tx.permission.upsert({ where: { code }, update: {}, create: { code, description } });
      }
      const role = await tx.role.create({ data: {
        name: 'Quản trị hệ thống',
        permissions: { create: [{ permissionCode: 'admin.access' }, { permissionCode: 'system.manage' }] },
      } });
      await tx.user.create({ data: {
        username, displayName: 'Admin', passwordHash, mustChangePassword: true,
        roles: { create: { roleId: role.id } },
      } });
    });
    console.log('Created initial administrator. Read backend/.env.bootstrap locally for credentials. First login requires a new password.');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Bootstrap failed. Check database/migrations and local credentials; existing accounts are not overwritten.'); process.exitCode = 1; });
