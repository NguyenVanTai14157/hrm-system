import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';
import * as bcrypt from 'bcrypt';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm');
  
  const passwordHash = await bcrypt.hash('123456aA@', 10);
  const user = await prisma.user.update({
    where: { username: 'giau' },
    data: {
      passwordHash,
      mustChangePassword: false,
      status: 'ACTIVE',
    }
  });

  // Assign today's shift to giau's employee
  if (user.employeeId) {
    const shifts = await prisma.shift.findMany();
    if (shifts.length > 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);

      await prisma.shiftAssignment.deleteMany({
        where: { employeeId: user.employeeId, date: startOfDay }
      });

      await prisma.shiftAssignment.create({
        data: {
          employeeId: user.employeeId,
          shiftId: shifts[0].id,
          date: startOfDay,
          status: 'ACTIVE',
          title: 'Phân ca nhân viên',
        }
      });
      console.log('✅ Đã gán ca hôm nay cho Nguyễn Văn Giàu (giau)');
    }
  }

  console.log('✅ Đã cập nhật mật khẩu tài khoản giau: 123456aA@');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
