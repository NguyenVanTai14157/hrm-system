import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm');
  
  // 1. Find or ensure a sample role "Nhân viên"
  let role = await prisma.role.findFirst({ where: { name: 'Nhân viên bán hàng - Nhân viên' } });
  if (!role) {
    role = await prisma.role.create({ data: { name: 'Nhân viên' } });
  }

  // 2. Find an employee to link
  const emp = await prisma.employee.findFirst({ where: { status: 'WORKING' } });

  const passwordHash = await bcrypt.hash('123456aA@', 10);

  // 3. Upsert user "nhanvien"
  const user = await prisma.user.upsert({
    where: { username: 'nhanvien' },
    update: {
      passwordHash,
      displayName: 'Nguyễn Văn Nhân Viên',
      status: 'ACTIVE',
      mustChangePassword: false,
    },
    create: {
      username: 'nhanvien',
      displayName: 'Nguyễn Văn Nhân Viên',
      passwordHash,
      employeeId: emp ? emp.id : null,
      status: 'ACTIVE',
      mustChangePassword: false,
    },
  });

  // 4. Assign role
  await prisma.userRole.deleteMany({ where: { userId: user.id } });
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: role.id,
    },
  });

  console.log('✅ Created/Updated test employee account:');
  console.log('Username: nhanvien');
  console.log('Password: 123456aA@');
  console.log('DisplayName:', user.displayName);
  console.log('Role:', role.name);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
