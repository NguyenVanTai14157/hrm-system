import 'dotenv/config';
import { config } from 'dotenv';
import { createPrismaClient } from '../src/database/client';
import { hashPassword } from '../src/modules/auth/password';

// Local operator tool. Never exposes an unauthenticated HTTP password reset.
async function main() {
  config({ path: '.env.reset', quiet: true });
  const username = process.env.RESET_USERNAME;
  const password = process.env.RESET_PASSWORD;
  if (!process.env.DATABASE_URL || !username || !password) throw new Error('Configure DATABASE_URL and backend/.env.reset with RESET_USERNAME, RESET_PASSWORD.');
  const db = createPrismaClient(process.env.DATABASE_URL);
  try {
    const passwordHash = await hashPassword(password);
    await db.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { username: username.toLowerCase() },
        data: { passwordHash, mustChangePassword: true, authVersion: { increment: 1 } } });
      await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    });
    console.log('Password reset; existing sessions revoked. Account lock status unchanged.');
  } finally { await db.$disconnect(); }
}
main().catch(() => { console.error('Reset failed. Check backend/.env.reset, username and database connection.'); process.exitCode = 1; });
