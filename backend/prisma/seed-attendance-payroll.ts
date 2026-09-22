import { createPrismaClient } from '../src/database/client';

process.env.DATABASE_URL = 'mysql://root:@localhost:3306/hrm_db';
const prisma = createPrismaClient(process.env.DATABASE_URL);

async function main() {
  console.log('Seeding attendance and payroll demo data...');

  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Get employees
  const employees = await prisma.employee.findMany({ where: { status: 'WORKING' } });
  if (employees.length === 0) {
    console.log('No employees found, skipping seed.');
    return;
  }

  // Get or create shifts
  let shiftMorning = await prisma.shift.findFirst({ where: { code: 'CA_SANG' } });
  if (!shiftMorning) {
    shiftMorning = await prisma.shift.create({
      data: { code: 'CA_SANG', name: 'Ca Sáng', startTime: '08:00', endTime: '12:00' }
    });
  }

  let shiftAfternoon = await prisma.shift.findFirst({ where: { code: 'CA_CHIEU' } });
  if (!shiftAfternoon) {
    shiftAfternoon = await prisma.shift.create({
      data: { code: 'CA_CHIEU', name: 'Ca Chiều', startTime: '13:00', endTime: '17:00' }
    });
  }

  // Assign shifts and create logs
  console.log('Creating shifts and logs...');
  for (const emp of employees) {
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dow = date.getDay();
      
      // Skip weekends randomly or assign OT? Just skip weekends
      if (dow === 0 || dow === 6) continue;

      // Assign shift
      const shiftId = Math.random() > 0.5 ? shiftMorning.id : shiftAfternoon.id;
      
      await prisma.shiftAssignment.upsert({
        where: { employeeId_date: { employeeId: emp.id, date } },
        create: { employeeId: emp.id, shiftId, date },
        update: { shiftId },
      });

      // 90% present
      if (Math.random() > 0.1) {
        await prisma.attendanceLog.create({
          data: {
            employeeId: emp.id,
            date,
            status: 'PRESENT',
            checkIn: new Date(year, month, day, 7, 50, 0),
            checkOut: new Date(year, month, day, 17, 10, 0),
          },
        });
      }
    }
  }

  // Payroll Templates
  console.log('Creating payroll templates...');
  let template = await prisma.payrollTemplate.findFirst({ where: { name: 'Mẫu chuẩn 2026' } });
  if (!template) {
    template = await prisma.payrollTemplate.create({
      data: {
        name: 'Mẫu chuẩn 2026',
        columns: [
          { type: 'BASE_SALARY', name: 'Lương cơ bản', code: 'BASE' },
          { type: 'ALLOWANCE', name: 'Phụ cấp ăn trưa', code: 'PC_AN', defaultValue: 500000 },
          { type: 'OT', name: 'Tăng ca', code: 'OT' },
          { type: 'INSURANCE', name: 'BHXH (8%)', code: 'BHXH', rate: 8 },
        ]
      }
    });
  }

  // Create Draft Payroll
  const pr = await prisma.payroll.create({
    data: {
      name: `Bảng lương tháng ${month + 1}/${year}`,
      month: monthStr,
      templateId: template.id,
      status: 'DRAFT'
    }
  });

  console.log('Done seeding!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
