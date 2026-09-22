import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      employeeId: true,
      status: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  console.log('--- ALL USERS IN DB ---');
  for (const u of users) {
    console.log({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      employeeId: u.employeeId,
      roles: u.roles.map(r => r.role.name),
    });
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
