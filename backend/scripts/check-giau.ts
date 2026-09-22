import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';
import { publicUser, userInclude } from '../src/modules/auth/auth.types';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm');
  const emp = await prisma.employee.findFirst({
    where: { code: 'NV065' },
    include: { user: true },
  });
  console.log('EMPLOYEE NV065:', JSON.stringify(emp, null, 2));
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
