import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm');
  
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: {
        include: {
          roles: {
            include: { role: true }
          }
        }
      }
    }
  });

  console.log('--- RECENT SESSIONS ---');
  for (const s of sessions) {
    console.log({
      sessionId: s.id,
      userId: s.userId,
      username: s.user.username,
      displayName: s.user.displayName,
      roles: s.user.roles.map(r => r.role.name),
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
    });
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
