import 'dotenv/config';
import { createHash } from 'node:crypto';
import { createPrismaClient } from '../src/database/client';
import { CatalogKind, EmployeeStatus, Prisma } from '../src/generated/prisma/client';

class DemoSeedError extends Error {}

// Stable identifiers isolate this fixture set from manually entered records.
function id(key: string): string {
  const hex = createHash('sha256').update('hrm-employees-demo-v1:' + key).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}
const marker = 'Script dữ liệu mẫu HRM v1';
const catalogRows = [
  [CatalogKind.DEPARTMENT, 'HR', 'Nhân sự'],
  [CatalogKind.DEPARTMENT, 'PRODUCTION', 'Sản xuất'],
  [CatalogKind.DEPARTMENT, 'FINANCE', 'Kế toán'],
  [CatalogKind.DEPARTMENT, 'SALES', 'Kinh doanh'],
  [CatalogKind.POSITION, 'MANAGER', 'Quản lý'],
  [CatalogKind.POSITION, 'SPECIALIST', 'Chuyên viên'],
  [CatalogKind.POSITION, 'WORKER', 'Công nhân'],
  [CatalogKind.JOB_TITLE, 'HEAD', 'Trưởng bộ phận'],
  [CatalogKind.JOB_TITLE, 'STAFF', 'Nhân viên'],
  [CatalogKind.JOB_TITLE, 'OPERATOR', 'Nhân viên vận hành'],
].map(([kind, key, name]) => ({
  id: id('catalog:' + key), kind: kind as CatalogKind,
  code: 'DEMO_' + key, name: `${name} (mẫu)`, active: true,
}));
const names = [
  'Nguyễn Minh An', 'Trần Ngọc Bình', 'Lê Thanh Chi', 'Phạm Quốc Dũng',
  'Hoàng Thu Hà', 'Vũ Minh Hải', 'Đặng Lan Hương', 'Bùi Đức Huy',
  'Đỗ Mai Linh', 'Ngô Tuấn Kiệt', 'Dương Bảo Long', 'Lý Ngọc Mai',
  'Nguyễn Hoài Nam', 'Trần Khánh Ngân', 'Lê Minh Phúc', 'Phạm Anh Quân',
  'Hoàng Hải Sơn', 'Vũ Thanh Tâm', 'Đặng Phương Thảo', 'Bùi Đức Thành',
  'Đỗ Ngọc Trang', 'Ngô Minh Trí', 'Dương Anh Tú', 'Lý Thảo Vy',
];
const employeeIds = names.map((_, index) => id('employee:' + index));
const catalogIds = catalogRows.map(row => row.id);
const statuses = Object.values(EmployeeStatus);

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--clean') || args.length > 1) throw new DemoSeedError('Chỉ hỗ trợ tùy chọn --clean.');
  if (process.env.NODE_ENV === 'production') throw new DemoSeedError('Không chạy dữ liệu mẫu trong production.');
  if (!process.env.DATABASE_URL) throw new DemoSeedError('Cần cấu hình DATABASE_URL trong backend/.env.');
  const db = createPrismaClient(process.env.DATABASE_URL);
  try {
    await db.$transaction(async tx => {
      // Fail on collisions instead of adopting or overwriting unrelated data.
      for (const [index, employeeId] of employeeIds.entries()) {
        const existing = await tx.employee.findUnique({ where: { id: employeeId } });
        if (existing) {
          const origin = await tx.employeeHistory.findUnique({ where: { id: id('history:' + index) } });
          if (origin?.employeeId !== employeeId || origin.actorName !== marker) {
            throw new DemoSeedError('Trùng ID với hồ sơ không thuộc bộ mẫu; đã hủy toàn bộ thao tác.');
          }
        }
      }
      if (args.includes('--clean')) {
        const externalReferences = await tx.employee.count({ where: {
          id: { notIn: employeeIds }, OR: [
            { managerId: { in: employeeIds } }, { departmentId: { in: catalogIds } },
            { positionId: { in: catalogIds } }, { jobTitleId: { in: catalogIds } },
          ],
        } });
        const accounts = await tx.user.count({ where: { employeeId: { in: employeeIds } } });
        if (externalReferences || accounts) throw new DemoSeedError('Dữ liệu mẫu đã được hồ sơ khác hoặc tài khoản sử dụng. Hãy gỡ liên kết trước khi dọn.');
        await tx.employee.updateMany({ where: { id: { in: employeeIds } }, data: { managerId: null } });
        await tx.employeeHistory.deleteMany({ where: { employeeId: { in: employeeIds } } });
        const removed = await tx.employee.deleteMany({ where: { id: { in: employeeIds } } });
        await tx.employeeCatalog.deleteMany({ where: { id: { in: catalogIds } } });
        console.log(`Đã dọn ${removed.count} hồ sơ mẫu và danh mục mẫu.`);
        return;
      }
      for (const row of catalogRows) {
        await tx.employeeCatalog.upsert({ where: { id: row.id }, update: {}, create: row });
      }
      let created = 0;
      for (const [index, name] of names.entries()) {
        if (await tx.employee.findUnique({ where: { id: employeeIds[index] } })) continue;
        const department = ['HR', 'PRODUCTION', 'FINANCE', 'SALES'][index % 4];
        const managerId = index < 4 ? null : employeeIds[index % 4];
        if (managerId) {
          const manager = await tx.employee.findUnique({ where: { id: managerId } });
          if (manager?.status !== 'WORKING') throw new DemoSeedError('Quản lý mẫu đã đổi trạng thái. Không tự ghi đè chỉnh sửa; hãy kiểm tra hồ sơ mẫu trước.');
        }
        const row = await tx.employee.create({ data: {
          id: employeeIds[index], code: `DEMO_NV${String(index + 1).padStart(3, '0')}`,
          name: `${name} (mẫu)`, gender: index % 2 ? 'FEMALE' : 'MALE',
          birthday: new Date(`${1985 + index}-05-15T00:00:00Z`),
          joinDate: new Date(`${2022 + index % 4}-03-01T00:00:00Z`),
          email: `demo.nv${index + 1}@example.com`,
          address: 'Địa chỉ giả lập — chỉ dùng kiểm thử',
          status: index < 4 ? 'WORKING' : statuses[(index - 4) % statuses.length],
          departmentId: id('catalog:' + department),
          positionId: id('catalog:' + (index < 4 ? 'MANAGER' : department === 'PRODUCTION' ? 'WORKER' : 'SPECIALIST')),
          jobTitleId: id('catalog:' + (index < 4 ? 'HEAD' : department === 'PRODUCTION' ? 'OPERATOR' : 'STAFF')),
          managerId,
        }, include: { department: true, position: true, jobTitle: true, manager: { select: { id: true, code: true, name: true, status: true } } } });
        await tx.employeeHistory.create({ data: {
          id: id('history:' + index), employeeId: row.id, actorName: marker,
          action: 'CREATED', after: JSON.parse(JSON.stringify({
            ...row, birthday: row.birthday?.toISOString().slice(0, 10),
            joinDate: row.joinDate?.toISOString().slice(0, 10),
          })) as Prisma.InputJsonValue,
        } });
        created++;
      }
      console.log(`Đã thêm ${created} hồ sơ; giữ nguyên ${names.length - created} hồ sơ mẫu đã tồn tại. Bộ mẫu: ${names.length} nhân sự, ${catalogRows.length} danh mục.`);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
  } finally { await db.$disconnect(); }
}
main().catch((error: unknown) => {
  // Database errors can contain connection details; never dump them to the terminal.
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`Không thực hiện được (${error.code}). Kiểm tra migration hoặc mã trùng; transaction đã rollback.`);
  } else if (error instanceof DemoSeedError) {
    console.error(error.message);
  } else console.error('Không thực hiện được. Kiểm tra cấu hình và kết nối MySQL.');
  process.exitCode = 1;
});
