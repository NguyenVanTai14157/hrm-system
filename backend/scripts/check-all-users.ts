import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || '');
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      employeeId: true,
      employee: {
        select: {
          id: true,
          code: true,
          name: true,
          email: true,
          phone: true,
          department: true,
          position: true,
        },
      },
    },
  });
  console.log('ALL USERS IN DB:', JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
