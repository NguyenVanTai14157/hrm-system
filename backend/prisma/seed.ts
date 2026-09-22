import { createPrismaClient } from '../src/database/client';
import * as bcrypt from 'bcrypt';

const dbUrl = process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm_db';
const prisma = createPrismaClient(dbUrl);

const SAMPLE_EMPLOYEES = [
  { code: 'NV0001', name: 'Trần Văn Mạnh', dept: 'BAN GIÁM ĐỐC', pos: 'Tổng Giám đốc', status: 'WORKING' },
  { code: 'NV0002', name: 'Phạm Hồng Nhung', dept: 'BAN GIÁM ĐỐC', pos: 'Phó Tổng Giám đốc', status: 'WORKING' },
  { code: 'NV0003', name: 'Nguyễn Văn An', dept: 'BAN GIÁM ĐỐC', pos: 'Trợ lý Giám đốc', status: 'WORKING' },
  { code: 'NV0016', name: 'Nguyễn Thị Kim Nhi', dept: 'KIỂM SOÁT NỘI BỘ', pos: 'Chuyên viên KSNB', status: 'WORKING' },
  { code: 'NV0017', name: 'Hoàng Trọng Tùng', dept: 'KIỂM SOÁT NỘI BỘ', pos: 'Trưởng phòng KSNB', status: 'WORKING' },
  { code: 'NV0018', name: 'Bùi Phương Thảo', dept: 'KIỂM SOÁT NỘI BỘ', pos: 'Chuyên viên KSNB', status: 'WORKING' },
  { code: 'NV0019', name: 'Võ Quốc Huy', dept: 'KIỂM SOÁT NỘI BỘ', pos: 'Chuyên viên KSNB', status: 'WORKING' },
  { code: 'NV0099', name: 'Nguyễn Trần Nam Anh', dept: 'KHO HÀNG', pos: 'Nhân viên Kho', status: 'WORKING' },
  { code: 'NV0100', name: 'Nguyễn Văn Phương', dept: 'KHO HÀNG', pos: 'Nhân viên Kho', status: 'WORKING' },
  { code: 'NV0101', name: 'Trần Thanh Tùng', dept: 'KHO HÀNG', pos: 'Giám sát Kho', status: 'WORKING' },
  { code: 'NV0102', name: 'Nguyễn Thị Phúc Thảo', dept: 'KHO HÀNG', pos: 'Thủ kho', status: 'TEMPORARY' },
  { code: 'NV0104', name: 'Lê Hoàng Nam', dept: 'KHO HÀNG', pos: 'Nhân viên Kho', status: 'WORKING' },
  { code: 'NV0105', name: 'Đặng Văn Long', dept: 'KHO HÀNG', pos: 'Nhân viên Kho', status: 'WORKING' },
  { code: 'NV0106', name: 'Phạm Minh Khoa', dept: 'KHO HÀNG', pos: 'Nhân viên Bốc xếp', status: 'WORKING' },
  { code: 'NV0107', name: 'Trịnh Quốc Hùng', dept: 'KHO HÀNG', pos: 'Nhân viên Bốc xếp', status: 'WORKING' },
  { code: 'NV0108', name: 'Dương Nhật Minh', dept: 'KHO HÀNG', pos: 'Nhân viên Kho', status: 'TEMPORARY' },
  { code: 'NV0054', name: 'Ngô Minh Đức', dept: 'MARKETING', pos: 'Trưởng phòng MKT', status: 'WORKING' },
  { code: 'NV0090', name: 'Đặng Thị Mai', dept: 'MARKETING', pos: 'Chuyên viên Content', status: 'WORKING' },
  { code: 'NV0091', name: 'Nguyễn Khánh Linh', dept: 'MARKETING', pos: 'Chuyên viên Designer', status: 'WORKING' },
  { code: 'NV0092', name: 'Trần Quang Hải', dept: 'MARKETING', pos: 'Chuyên viên Media', status: 'WORKING' },
  { code: 'NV0093', name: 'Vũ Hoàng Anh', dept: 'MARKETING', pos: 'Chuyên viên MKT', status: 'TEMPORARY' },
  { code: 'NV0094', name: 'Hồ Ngọc Hà', dept: 'MARKETING', pos: 'Chuyên viên MKT', status: 'TEMPORARY' },
  { code: 'NV0103', name: 'Lưu Thị Thảo Vy', dept: 'CỬA HÀNG 126', pos: 'Cửa hàng trưởng', status: 'WORKING' },
  { code: 'NV0067', name: 'Phan Thị Hoàng Ngoan', dept: 'CỬA HÀNG 126', pos: 'Thu ngân', status: 'WORKING' },
  { code: 'NV0115', name: 'Nguyễn Thị Khánh Ly', dept: 'CỬA HÀNG 126', pos: 'Nhân viên Bán hàng', status: 'WORKING' },
  { code: 'NV0116', name: 'Trương Công Vinh', dept: 'CỬA HÀNG 126', pos: 'Nhân viên Bán hàng', status: 'WORKING' },
  { code: 'NV0117', name: 'Đỗ Thanh Hằng', dept: 'CỬA HÀNG 126', pos: 'Thu ngân', status: 'WORKING' },
  { code: 'NV0000', name: 'Admin Quản trị', dept: 'BAN GIÁM ĐỐC', pos: 'Quản trị viên', status: 'WORKING' },
];

async function main() {
  console.log('🌱 Seeding 28 Employees & Users into MariaDB...');

  // 1. Seed Catalogs
  const depts = Array.from(new Set(SAMPLE_EMPLOYEES.map(e => e.dept)));
  for (const deptName of depts) {
    const code = deptName.replace(/[^A-Z0-9]/gi, '_').toUpperCase();
    await prisma.employeeCatalog.upsert({
      where: { kind_code: { kind: 'DEPARTMENT', code } },
      create: { kind: 'DEPARTMENT', code, name: deptName, active: true },
      update: { name: deptName },
    });
  }

  // 2. Password hash for users
  const passwordHash = await bcrypt.hash('123456aA@', 10);

  // 3. Upsert 28 Employees & Users
  for (const empData of SAMPLE_EMPLOYEES) {
    const deptCatalog = await prisma.employeeCatalog.findFirst({
      where: { kind: 'DEPARTMENT', name: empData.dept },
    });

    const emp = await prisma.employee.upsert({
      where: { code: empData.code },
      create: {
        code: empData.code,
        name: empData.name,
        status: empData.status as any,
        departmentId: deptCatalog?.id,
        joinDate: new Date('2024-01-15'),
      },
      update: {
        name: empData.name,
        departmentId: deptCatalog?.id,
      },
    });

    // Create user account for every employee
    await prisma.user.upsert({
      where: { username: empData.code },
      create: {
        username: empData.code,
        displayName: empData.name,
        passwordHash,
        mustChangePassword: false,
        status: 'ACTIVE',
        employeeId: emp.id,
      },
      update: {
        displayName: empData.name,
        status: 'ACTIVE',
      },
    });
  }

  console.log('✅ 28 Employees & 28 Users created in database!');

  // 4. Seed Sub-functions (Devices, Raw logs, Furlough, Holidays, Meals, Auto-rules)
  const allEmps = await prisma.employee.findMany();

  // Biometric Devices
  await prisma.biometricDevice.deleteMany();
  await prisma.biometricDevice.createMany({
    data: [
      {
        title: 'Máy FaceID Vân Tay - Tầng 1 (Cổng chính)',
        machineType: 'Hanet AI Camera',
        ipMachine: '192.168.1.201:8080',
        serialNumber: 'HN-2026-X88',
        location: 'Trụ sở 14 Lê Duy Đình - Đà Nẵng',
        directionType: 'ALL',
        status: 'UPDATED',
      },
      {
        title: 'Máy Quẹt Thẻ / Vân Tay - Kho Hàng',
        machineType: 'Ronald Jack K40',
        ipMachine: '192.168.2.105:4370',
        serialNumber: 'RJ-K40-994',
        location: 'Kho Tổng Hòa Cầm - Đà Nẵng',
        directionType: 'IN',
        status: 'UPDATED',
      },
      {
        title: 'Máy Cửa Hàng 126 Nguyễn Thị Minh Khai',
        machineType: 'Hikvision FaceID',
        ipMachine: '115.79.42.18:8000',
        serialNumber: 'HK-DS-K1T341',
        location: 'Cửa hàng 126 Nguyễn Thị Minh Khai',
        directionType: 'ALL',
        status: 'PENDING',
      },
    ],
  });

  // Biometric Raw Logs
  await prisma.biometricRawLog.deleteMany();
  await Promise.all(
    allEmps.slice(0, 10).map((emp, i) =>
      prisma.biometricRawLog.create({
        data: {
          employeeId: emp.id,
          timestamp: new Date(`2026-09-18T07:5${i}:24Z`),
          fromType: i % 2 === 0 ? 'MACHINE' : 'GPS',
          location: '14 Lê Duy Đình - Đà Nẵng',
          deviceId: 'HN-2026-X88',
          verifyMode: 'FaceID (Nhận diện khuôn mặt AI)',
        },
      })
    )
  );

  // Furlough Balances for 28 employees
  await prisma.furloughBalance.deleteMany();
  await Promise.all(
    allEmps.map((emp, i) =>
      prisma.furloughBalance.create({
        data: {
          employeeId: emp.id,
          year: 2026,
          yearOpen: 12,
          yearUsed: i % 5,
          seniorityOpen: i % 2 === 0 ? 1 : 0,
          accumulationOpen: i % 3 === 0 ? 2 : 0,
          accumulationExpired: 0,
        },
      })
    )
  );

  // Holidays
  await prisma.holidayCalendar.deleteMany();
  await prisma.holidayCalendar.createMany({
    data: [
      {
        name: 'Tết Dương Lịch 2026',
        type: 'HOLIDAY',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-01-01'),
        totalDays: 1,
        hasSalary: true,
        salaryRate: '100% Lương chuẩn (300% nếu làm OT)',
        symbol: 'L',
      },
      {
        name: 'Tết Nguyên Đán Bính Ngọ 2026',
        type: 'HOLIDAY',
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-02-21'),
        totalDays: 7,
        hasSalary: true,
        salaryRate: '100% Lương chuẩn (300% nếu làm OT)',
        symbol: 'L',
      },
      {
        name: 'Giỗ Tổ Hùng Vương (10/3 Âm lịch)',
        type: 'HOLIDAY',
        startDate: new Date('2026-04-26'),
        endDate: new Date('2026-04-26'),
        totalDays: 1,
        hasSalary: true,
        salaryRate: '100% Lương chuẩn',
        symbol: 'L',
      },
      {
        name: 'Ngày Giải phóng & Quốc tế Lao động (30/4 - 1/5)',
        type: 'HOLIDAY',
        startDate: new Date('2026-04-30'),
        endDate: new Date('2026-05-01'),
        totalDays: 2,
        hasSalary: true,
        salaryRate: '100% Lương chuẩn',
        symbol: 'L',
      },
      {
        name: 'Du lịch Teambuilding Công ty 2026',
        type: 'EVENT',
        startDate: new Date('2026-07-10'),
        endDate: new Date('2026-07-12'),
        totalDays: 3,
        hasSalary: true,
        salaryRate: '100% Lương chuẩn (Sự kiện công ty)',
        symbol: 'SK',
      },
    ],
  });

  // Auto timekeep rules
  await prisma.autoTimekeepRule.deleteMany();
  await prisma.autoTimekeepRule.create({
    data: {
      employeeId: allEmps[0].id,
      startDate: new Date('2026-01-01'),
      status: 'ACTIVE',
      note: 'Áp dụng tự động 1.0 công chuẩn/ngày có ca. Ưu tiên trừ công nếu có đơn nghỉ không lương.',
    },
  });

  // Attendance Meal Logs
  await prisma.attendanceMeal.deleteMany();
  await Promise.all(
    allEmps.slice(0, 15).map((emp) =>
      prisma.attendanceMeal.create({
        data: {
          employeeId: emp.id,
          date: new Date('2026-09-01'),
          caCount: 1,
          otCount: 0,
        },
      })
    )
  );

  // Seed 45 Applications
  await prisma.applicationApproval.deleteMany();
  await prisma.application.deleteMany();

  const appTypes = [
    'Đơn xin nghỉ phép',
    'Đơn làm thêm giờ OT',
    'Đơn đi muộn / về sớm',
    'Đơn công tác',
  ];

  const appReasons = [
    'Giải quyết công việc cá nhân',
    'Hỗ trợ nhập kho hàng đợt mới',
    'Kẹt xe tuyến đường Nguyễn Hữu Thọ',
    'Gặp khách hàng đối tác tại TP.HCM',
    'Nghỉ phép năm định kỳ',
    'Hoàn thiện báo cáo kiểm soát nội bộ',
    'Bảo trì hệ thống máy kiểm kê',
  ];

  const appStatuses = [
    ...Array(34).fill('APPROVED'),
    ...Array(5).fill('WAITING'),
    ...Array(3).fill('APPROVING'),
    ...Array(2).fill('NO_APPROVED'),
    ...Array(1).fill('CANCELED'),
  ];

  for (let i = 0; i < 45; i++) {
    const emp = allEmps[i % allEmps.length];
    const type = appTypes[i % appTypes.length];
    const reason = appReasons[i % appReasons.length];
    const status = appStatuses[i] as any;

    const app = await prisma.application.create({
      data: {
        employeeId: emp.id,
        type,
        status,
        reason,
        description: `Đơn từ tự động khởi tạo cho nhân sự ${emp.name} (${emp.code})`,
        payload: {
          startDate: `2026-09-${(i % 25) + 1}`,
          endDate: `2026-09-${(i % 25) + 1}`,
          amount: (i % 3) + 1,
        },
        currentStep: status === 'APPROVED' ? 2 : 1,
        createdAt: new Date(Date.now() - i * 3600 * 1000 * 4),
      },
    });

    await prisma.applicationApproval.create({
      data: {
        applicationId: app.id,
        step: 1,
        approverId: emp.managerId || allEmps[0].id,
        status: status === 'APPROVED' ? 'APPROVED' : status === 'NO_APPROVED' ? 'REJECTED' : 'PENDING',
      },
    });
  }

  console.log('🎉 Full 28 Employees, 28 Users & 45 Applications Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
