const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const { PrismaClient } = require('./dist/generated/prisma/client');

async function main() {
  const adapter = new PrismaMariaDb({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password' in process.env ? process.env.password : '123456',
    database: 'hrm_db',
    connectionLimit: 2,
    allowPublicKeyRetrieval: true,
  });
  const p = new PrismaClient({ adapter });

  const shifts = await p.shift.findMany({ orderBy: { createdAt: 'desc' } });
  console.log('=== ALL SHIFTS (CA LÀM VIỆC) IN DB ===');
  console.log(shifts);

  const assignments = await p.shiftAssignment.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: { shift: true }
  });
  console.log('=== RECENT 10 SHIFT ASSIGNMENTS (PHÂN CA) IN DB ===');
  console.log(assignments.map(a => ({
    id: a.id,
    date: a.date,
    shiftName: a.shift?.name,
    shiftCode: a.shift?.code,
    employeeId: a.employeeId,
    createdAt: a.createdAt
  })));

  await p.$disconnect();
}

main().catch(console.error);
