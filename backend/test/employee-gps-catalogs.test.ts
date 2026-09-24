import assert from 'node:assert/strict';
import test from 'node:test';
import { EmployeesService } from '../src/modules/employees/employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../src/modules/employees/employees.dto';

function createMockPrisma() {
  const gpsLocations = new Map<string, any>([
    [
      'loc-1',
      {
        id: 'loc-1',
        code: 'D01',
        name: '38 Nguyễn Oanh',
        address: '38 Nguyễn Oanh, Phường 7, Gò Vấp',
        latitude: 10.829,
        longitude: 106.677,
        radius: 100,
        isActive: true,
      },
    ],
    [
      'loc-2',
      {
        id: 'loc-2',
        code: 'DD01',
        name: '108 Nguyễn Văn Thoại',
        address: '',
        latitude: 16.054,
        longitude: 108.243,
        radius: 100,
        isActive: true,
      },
    ],
    [
      'loc-inactive',
      {
        id: 'loc-inactive',
        code: 'OLD01',
        name: 'Chi nhánh cũ đã đóng cửa',
        address: '123 Đường Cũ',
        latitude: 10.1,
        longitude: 106.1,
        radius: 100,
        isActive: false,
      },
    ],
  ]);

  const employees = new Map<string, any>();
  const employeeGps = new Map<string, { employeeId: string; gpsLocationId: string }[]>();
  const historyLogs: any[] = [];

  const mockTx = {
    employee: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const emp = employees.get(where.id);
        if (!emp) return null;
        const locAssignments = employeeGps.get(where.id) || [];
        return {
          ...emp,
          gpsLocations: locAssignments.map((a) => ({
            ...a,
            gpsLocation: gpsLocations.get(a.gpsLocationId),
          })),
        };
      },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) => {
        const emp = employees.get(where.id);
        if (!emp) throw new Error('Not found');
        const locAssignments = employeeGps.get(where.id) || [];
        return {
          ...emp,
          gpsLocations: locAssignments.map((a) => ({
            ...a,
            gpsLocation: gpsLocations.get(a.gpsLocationId),
          })),
        };
      },
      findMany: async () => Array.from(employees.values()),
      create: async ({ data }: { data: any }) => {
        const id = 'emp-' + Math.random().toString(36).slice(2, 9);
        const created = { id, ...data, version: 0, createdAt: new Date(), updatedAt: new Date() };
        employees.set(id, created);
        return created;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const existing = employees.get(where.id);
        if (!existing) throw new Error('Not found');
        const updated = {
          ...existing,
          ...data,
          version: (existing.version || 0) + 1,
          updatedAt: new Date(),
        };
        employees.set(where.id, updated);
        return updated;
      },
    },
    employeeCatalog: {
      findUnique: async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        kind: 'DEPARTMENT',
        active: true,
      }),
    },
    gpsLocation: {
      findMany: async ({ where }: { where?: { id?: { in: string[] } } }) => {
        if (where?.id?.in) {
          return where.id.in.map((id) => gpsLocations.get(id)).filter(Boolean);
        }
        return Array.from(gpsLocations.values());
      },
    },
    employeeGpsLocation: {
      deleteMany: async ({ where }: { where: { employeeId: string } }) => {
        employeeGps.delete(where.employeeId);
        return { count: 1 };
      },
      createMany: async ({ data }: { data: { employeeId: string; gpsLocationId: string }[] }) => {
        for (const item of data) {
          const list = employeeGps.get(item.employeeId) || [];
          list.push(item);
          employeeGps.set(item.employeeId, list);
        }
        return { count: data.length };
      },
    },
    employeeHistory: {
      create: async ({ data }: { data: any }) => {
        historyLogs.push(data);
        return data;
      },
    },
    user: {
      create: async () => ({ id: 'user-1' }),
    },
  };

  const mockPrisma = {
    client: {
      ...mockTx,
      $transaction: async (cb: any) => cb(mockTx),
    },
  };

  return {
    prisma: mockPrisma as any,
    gpsLocations,
    employees,
    employeeGps,
    historyLogs,
  };
}

const mockActor = { id: 'admin-1', displayName: 'Admin QTV' };

test('EmployeesService.getGpsLocations returns all locations with details and active flags', async () => {
  const { prisma } = createMockPrisma();
  const service = new EmployeesService(prisma);

  const locs = await service.getGpsLocations();
  assert.equal(locs.length, 3);
  assert.ok(locs.some((l) => l.code === 'D01' && l.name === '38 Nguyễn Oanh' && l.isActive === true));
  assert.ok(locs.some((l) => l.code === 'OLD01' && l.isActive === false));
});

test('EmployeesService.save: successfully creates employee with multiple valid GPS locations and syncs join table', async () => {
  const { prisma, employeeGps, historyLogs } = createMockPrisma();
  const service = new EmployeesService(prisma);

  const dto: CreateEmployeeDto = {
    name: 'Nguyễn Văn Test',
    gpsLocationIds: ['loc-1', 'loc-2'],
  } as any;

  const result = await service.save(dto, mockActor);
  assert.ok(result.id);
  assert.equal(result.name, 'Nguyễn Văn Test');
  assert.deepEqual(result.gpsLocationIds, ['loc-1', 'loc-2']);
  assert.equal(result.gpsLocation, '38 Nguyễn Oanh, 108 Nguyễn Văn Thoại');

  const assignments = employeeGps.get(result.id) || [];
  assert.equal(assignments.length, 2);
  assert.equal(assignments[0].gpsLocationId, 'loc-1');
  assert.equal(assignments[1].gpsLocationId, 'loc-2');

  assert.equal(historyLogs.length, 1);
  assert.equal(historyLogs[0].action, 'CREATED');
});

test('EmployeesService.save: rejects non-existent GPS location ID', async () => {
  const { prisma } = createMockPrisma();
  const service = new EmployeesService(prisma);

  const dto: CreateEmployeeDto = {
    name: 'Trần Văn Lỗi',
    gpsLocationIds: ['loc-non-existent'],
  } as any;

  await assert.rejects(
    async () => service.save(dto, mockActor),
    { name: 'BadRequestException', message: 'Một hoặc nhiều địa điểm chấm công không tồn tại trong hệ thống.' },
  );
});

test('EmployeesService.save: rejects newly assigning inactive GPS location', async () => {
  const { prisma } = createMockPrisma();
  const service = new EmployeesService(prisma);

  const dto: CreateEmployeeDto = {
    name: 'Lê Văn Cũ',
    gpsLocationIds: ['loc-inactive'],
  } as any;

  await assert.rejects(
    async () => service.save(dto, mockActor),
    { name: 'BadRequestException', message: 'Địa điểm chấm công "Chi nhánh cũ đã đóng cửa" đã ngừng hoạt động.' },
  );
});

test('EmployeesService.save: allows existing employee to update GPS locations and reloads them correctly', async () => {
  const { prisma, employeeGps, employees } = createMockPrisma();
  const service = new EmployeesService(prisma);

  // Setup existing employee
  employees.set('emp-1', {
    id: 'emp-1',
    code: 'NV001',
    name: 'Phạm Thị Hiện Tại',
    version: 0,
    status: 'WORKING',
    gpsLocation: '38 Nguyễn Oanh',
  });
  employeeGps.set('emp-1', [{ employeeId: 'emp-1', gpsLocationId: 'loc-1' }]);

  // Verify detail loads correctly
  const detailBefore = await service.detail('emp-1');
  assert.deepEqual(detailBefore.gpsLocationIds, ['loc-1']);

  // Update to loc-2
  const updateDto: UpdateEmployeeDto = {
    version: 0,
    gpsLocationIds: ['loc-2'],
  } as any;

  const detailAfter = await service.save(updateDto, mockActor, 'emp-1');
  assert.deepEqual(detailAfter.gpsLocationIds, ['loc-2']);
  assert.equal(detailAfter.gpsLocation, '108 Nguyễn Văn Thoại');

  const assignments = employeeGps.get('emp-1') || [];
  assert.equal(assignments.length, 1);
  assert.equal(assignments[0].gpsLocationId, 'loc-2');
});
