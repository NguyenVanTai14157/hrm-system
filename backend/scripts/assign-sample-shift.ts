import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm');
  
  const user = await prisma.user.findUnique({ where: { username: 'nhanvien' } });
  if (!user?.employeeId) {
    console.log('No employeeId for nhanvien');
    return;
  }

  const shifts = await prisma.shift.findMany();
  if (shifts.length === 0) {
    console.log('No shifts exist');
    return;
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const startOfDay = new Date(todayStr + 'T00:00:00.000Z');

  // Assign today's shift
  await prisma.shiftAssignment.deleteMany({
    where: { employeeId: user.employeeId, date: startOfDay },
  });

  const assigned = await prisma.shiftAssignment.create({
    data: {
      employeeId: user.employeeId,
      shiftId: shifts[0].id,
      date: startOfDay,
      status: 'ACTIVE',
      title: 'Phân ca chuẩn 1Office',
    },
    include: { shift: true },
  });

  console.log(`✅ Đã phân ca "${assigned.shift.name}" (${assigned.shift.startTime} - ${assigned.shift.endTime}) cho nhân viên vào ngày ${todayStr}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
