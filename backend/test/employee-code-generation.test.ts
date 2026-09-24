import assert from 'node:assert/strict';
import test from 'node:test';
import { EmployeesService } from '../src/modules/employees/employees.service';

/**
 * Mock Prisma Client in-memory để kiểm thử cô lập (Isolated Test),
 * tuyệt đối KHÔNG kết nối hay ghi bất kỳ dữ liệu nào vào Database thực tế.
 */
function createMockPrismaService(initialEmployees: Array<{ id: string; code: string; syncCode?: string | null }> = []) {
  const store: Array<{ id: string; code: string; syncCode: string | null; name?: string }> = [
    ...initialEmployees.map(e => ({
      id: e.id,
      code: e.code,
      syncCode: e.syncCode ?? null,
      name: 'Mock',
    })),
  ];

  const createTx = () => ({
    employee: {
      findMany: async (args?: any) => {
        if (args?.where?.syncCode?.not === null) {
          return store.filter(e => e.syncCode !== null).map(e => ({ syncCode: e.syncCode }));
        }
        if (args?.select?.code) {
          return store.map(e => ({ code: e.code }));
        }
        return store;
      },
      findUnique: async ({ where }: any) => {
        return store.find(e => e.id === where.id || e.code === where.code) || null;
      },
      create: async ({ data }: any) => {
        // Kiểm tra unique code
        if (store.some(e => e.code.toUpperCase() === data.code.toUpperCase())) {
          const err: any = new Error('Unique constraint failed on the fields: (`code`)');
          err.code = 'P2002';
          throw err;
        }
        const record = { id: `mock-${Date.now()}-${Math.random()}`, ...data };
        store.push(record);
        return record;
      },
      update: async ({ where, data }: any) => {
        const idx = store.findIndex(e => e.id === where.id);
        if (idx === -1) throw new Error('Not found');
        store[idx] = { ...store[idx], ...data };
        return store[idx];
      },
    },
    employeeCatalog: {
      findUnique: async () => ({ id: 'c1', active: true, kind: 'DEPARTMENT' }),
    },
    user: {
      create: async () => ({ id: 'u1' }),
    },
  });

  const prismaMock: any = {
    client: {
      employee: {
        findMany: async (args?: any) => createTx().employee.findMany(args),
        findUnique: async (args?: any) => createTx().employee.findUnique(args),
      },
      $transaction: async (fn: any) => {
        const tx = createTx();
        return fn(tx);
      },
    },
    _getStore: () => store,
  };

  return { prismaMock, service: new EmployeesService(prismaMock) };
}

test('1. Database trống: Tự động khởi tạo từ NV000 và mã chấm công 0', async () => {
  const { service, prismaMock } = createMockPrismaService([]);

  const next = await service.getNextCode();
  assert.equal(next.code, 'NV000');
  assert.equal(next.syncCode, '0');

  // Lưu bản ghi đầu tiên
  const created = await service.save(
    { name: 'Nguyễn Văn Zero' } as any,
    { id: 'admin', displayName: 'Admin' },
  );
  assert.equal(created.code, 'NV000');
  assert.equal(created.syncCode, '0');
  assert.equal(prismaMock._getStore().length, 1);
});

test('2. Tạo liên tiếp: Mã NS và Mã chấm công tự động tăng đều đặn', async () => {
  const { service, prismaMock } = createMockPrismaService([]);

  // Tạo liên tiếp 3 nhân viên
  const emp1 = await service.save({ name: 'Nhân viên 1' } as any, { id: 'admin', displayName: 'Admin' });
  const emp2 = await service.save({ name: 'Nhân viên 2' } as any, { id: 'admin', displayName: 'Admin' });
  const emp3 = await service.save({ name: 'Nhân viên 3' } as any, { id: 'admin', displayName: 'Admin' });

  assert.equal(emp1.code, 'NV000');
  assert.equal(emp1.syncCode, '0');

  assert.equal(emp2.code, 'NV001');
  assert.equal(emp2.syncCode, '1');

  assert.equal(emp3.code, 'NV002');
  assert.equal(emp3.syncCode, '2');

  // Kiểm tra mã dự kiến tiếp theo
  const next = await service.getNextCode();
  assert.equal(next.code, 'NV003');
  assert.equal(next.syncCode, '3');
});

test('3. Dữ liệu phức tạp (như DB hiện tại có NV065, NV0126, mã chấm công 111, 123...): Không trùng mã, tự động cấp mã an toàn', async () => {
  // Giả lập dữ liệu như hệ thống hiện hành
  const initial = [
    { id: '1', code: 'NV0000', syncCode: null },
    { id: '2', code: 'NV0001', syncCode: null },
    { id: '3', code: 'NV0065', syncCode: null },
    { id: '4', code: 'NV0125', syncCode: 'NV0125_machamcong' },
    { id: '5', code: 'NV0126', syncCode: 'NV0125_machamcong' },
    { id: '6', code: '111', syncCode: '111' },
    { id: '7', code: '123', syncCode: '123' },
  ];
  const { service } = createMockPrismaService(initial);

  // Mã NS số lớn nhất hiện có là 126 (từ NV0126) -> Mã tiếp theo phải là NV127
  // Mã chấm công 0 chưa có ai dùng -> Cấp 0
  const next = await service.getNextCode();
  assert.equal(next.code, 'NV127');
  assert.equal(next.syncCode, '0');

  const created1 = await service.save({ name: 'Nhân viên 127' } as any, { id: 'admin', displayName: 'Admin' });
  assert.equal(created1.code, 'NV127');
  assert.equal(created1.syncCode, '0');

  const created2 = await service.save({ name: 'Nhân viên 128' } as any, { id: 'admin', displayName: 'Admin' });
  assert.equal(created2.code, 'NV128');
  assert.equal(created2.syncCode, '1');
});

test('4. Tạo đồng thời (Concurrent creation): Xử lý xung đột mã bằng retry an toàn, không trùng mã', async () => {
  const { service, prismaMock } = createMockPrismaService([
    { id: '1', code: 'NV001', syncCode: '0' },
  ]);

  // Cố tình tạo 3 tác nhân cùng gọi save đồng thời
  const [res1, res2, res3] = await Promise.all([
    service.save({ name: 'Đồng thời 1' } as any, { id: 'admin', displayName: 'Admin' }),
    service.save({ name: 'Đồng thời 2' } as any, { id: 'admin', displayName: 'Admin' }),
    service.save({ name: 'Đồng thời 3' } as any, { id: 'admin', displayName: 'Admin' }),
  ]);

  const codes = [res1.code, res2.code, res3.code];
  const syncCodes = [res1.syncCode, res2.syncCode, res3.syncCode];

  // 3 mã phải hoàn toàn khác nhau (không bị trùng lặp)
  assert.equal(new Set(codes).size, 3);
  assert.equal(new Set(syncCodes).size, 3);

  // Tất cả đều có định dạng chuẩn NV...
  codes.forEach(c => assert.match(c, /^NV\d{3,}$/));
});

test('5. Hủy form: Người dùng mở form nhận mã dự kiến nhưng không lưu, mã không bị mất hay hỏng chuỗi', async () => {
  const { service, prismaMock } = createMockPrismaService([
    { id: '1', code: 'NV001', syncCode: '0' },
  ]);

  // Người dùng A mở form -> nhận mã dự kiến NV002, syncCode 1
  const draftA = await service.getNextCode();
  assert.equal(draftA.code, 'NV002');
  assert.equal(draftA.syncCode, '1');

  // Người dùng A hủy form (không gọi save).
  // Số lượng bản ghi trong DB không đổi.
  assert.equal(prismaMock._getStore().length, 1);

  // Người dùng B mở form -> vẫn nhận chính xác NV002, syncCode 1
  const draftB = await service.getNextCode();
  assert.equal(draftB.code, 'NV002');
  assert.equal(draftB.syncCode, '1');

  // Người dùng B lưu thành công -> được cấp chính thức NV002, syncCode 1
  const createdB = await service.save({ name: 'User B' } as any, { id: 'admin', displayName: 'Admin' });
  assert.equal(createdB.code, 'NV002');
  assert.equal(createdB.syncCode, '1');
});

test('6. Lưu thất bại: Dữ liệu lỗi nghiệp vụ (thiếu tên), transaction rollback, không làm bẩn DB và không làm sai lệch mã', async () => {
  const { service, prismaMock } = createMockPrismaService([
    { id: '1', code: 'NV001', syncCode: '0' },
  ]);

  // Thử lưu hồ sơ không có họ tên
  await assert.rejects(
    async () => {
      await service.save({ name: '' } as any, { id: 'admin', displayName: 'Admin' });
    },
    { message: 'Họ và tên không được để trống.' }
  );

  // DB không bị thêm bản ghi rác
  assert.equal(prismaMock._getStore().length, 1);

  // Mã tiếp theo vẫn là NV002 và syncCode 1
  const next = await service.getNextCode();
  assert.equal(next.code, 'NV002');
  assert.equal(next.syncCode, '1');

  // Sau khi sửa đúng họ tên, lưu thành công trọn vẹn
  const ok = await service.save({ name: 'Đã nhập tên' } as any, { id: 'admin', displayName: 'Admin' });
  assert.equal(ok.code, 'NV002');
  assert.equal(ok.syncCode, '1');
  assert.equal(prismaMock._getStore().length, 2);
});
