import { PrismaClient } from '../src/generated/prisma/client';

process.env.DATABASE_URL = 'mysql://root:@localhost:3306/hrm_db';
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employee.findMany({ take: 3 });
  if (employees.length === 0) {
    console.log('No employees found to create applications for.');
    return;
  }

  const app1 = await prisma.application.create({
    data: {
      employeeId: employees[0].id,
      type: 'Đơn làm thêm giờ',
      reason: 'Làm thêm hỗ trợ dự án mới',
      status: 'WAITING',
      currentStep: 1,
      payload: { from: '18:00', to: '21:00' },
      approvals: {
        create: [
          { step: 1, status: 'PENDING', approverId: employees[0].managerId }
        ]
      }
    }
  });

  const app2 = await prisma.application.create({
    data: {
      employeeId: employees[1 % employees.length].id,
      type: 'Đơn xin nghỉ',
      reason: 'Nghỉ ốm',
      status: 'APPROVING',
      currentStep: 2,
      payload: { days: 2 },
      approvals: {
        create: [
          { step: 1, status: 'APPROVED', approverId: employees[1 % employees.length].managerId },
          { step: 2, status: 'PENDING', approverId: null }
        ]
      }
    }
  });

  const app3 = await prisma.application.create({
    data: {
      employeeId: employees[2 % employees.length].id,
      type: 'Đơn giải trình chấm công',
      reason: 'Quên chốt vân tay',
      status: 'APPROVED',
      currentStep: 1,
      payload: { date: '2026-09-17' },
      approvals: {
        create: [
          { step: 1, status: 'APPROVED', approverId: employees[2 % employees.length].managerId }
        ]
      }
    }
  });

  console.log('Seeded 3 applications!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
