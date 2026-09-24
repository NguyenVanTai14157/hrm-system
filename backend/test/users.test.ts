import assert from 'node:assert/strict';
import test from 'node:test';
import { UsersService } from '../src/modules/users/users.service';

function createMockPrisma() {
  const users = new Map<string, any>([
    ['admin-id', { id: 'admin-id', username: 'admin', displayName: 'Administrator' }],
    ['user-1', { id: 'user-1', username: 'thuntm', displayName: 'Minh Thu' }],
    ['user-2', { id: 'user-2', username: 'danvhl', displayName: 'Linh Dan' }],
  ]);

  const deletedUsers: string[] = [];
  const deletedRoles: string[] = [];
  const deletedNotifications: string[] = [];
  const deletedSessions: string[] = [];

  const mockClient = {
    user: {
      findUnique: async ({ where }: { where: { id?: string; username?: string } }) => {
        if (where.id) return users.get(where.id) || null;
        if (where.username) {
          for (const u of users.values()) {
            if (u.username === where.username) return u;
          }
        }
        return null;
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const u = users.get(where.id);
        if (!u) throw new Error('Not found');
        users.delete(where.id);
        deletedUsers.push(where.id);
        return u;
      },
      findMany: async () => Array.from(users.values()),
    },
    userRole: {
      deleteMany: async ({ where }: { where: { userId: string } }) => {
        deletedRoles.push(where.userId);
        return { count: 1 };
      },
    },
    notification: {
      deleteMany: async ({ where }: { where: { userId: string } }) => {
        deletedNotifications.push(where.userId);
        return { count: 0 };
      },
    },
    session: {
      deleteMany: async ({ where }: { where: { userId: string } }) => {
        deletedSessions.push(where.userId);
        return { count: 0 };
      },
    },
  };

  return {
    prisma: { client: mockClient } as any,
    users,
    deletedUsers,
    deletedRoles,
  };
}

const mockMailService = {
  sendLoginCredentials: async () => {},
} as any;

test('UsersService.remove: throws NotFoundException when user does not exist', async () => {
  const { prisma } = createMockPrisma();
  const service = new UsersService(prisma, mockMailService);

  await assert.rejects(
    async () => service.remove('non-existent-id'),
    { name: 'NotFoundException', message: 'Không tìm thấy tài khoản' },
  );
});

test('UsersService.remove: protects admin account from deletion', async () => {
  const { prisma } = createMockPrisma();
  const service = new UsersService(prisma, mockMailService);

  await assert.rejects(
    async () => service.remove('admin-id'),
    { name: 'ForbiddenException', message: 'Không thể xóa tài khoản quản trị hệ thống.' },
  );
});

test('UsersService.remove: successfully removes non-admin user and dependencies', async () => {
  const { prisma, deletedUsers, deletedRoles } = createMockPrisma();
  const service = new UsersService(prisma, mockMailService);

  const res = await service.remove('user-1');
  assert.equal(res.id, 'user-1');
  assert.ok(deletedUsers.includes('user-1'));
  assert.ok(deletedRoles.includes('user-1'));
});

test('UsersService.bulkRemove: rejects empty array or non-array', async () => {
  const { prisma } = createMockPrisma();
  const service = new UsersService(prisma, mockMailService);

  await assert.rejects(
    async () => service.bulkRemove([]),
    { name: 'BadRequestException' },
  );
  await assert.rejects(
    async () => service.bulkRemove(null as any),
    { name: 'BadRequestException' },
  );
});

test('UsersService.bulkRemove: correctly identifies non-existent IDs, admin, and deletes valid users', async () => {
  const { prisma, users } = createMockPrisma();
  const service = new UsersService(prisma, mockMailService);

  // Pass non-existent mock ID like 'u-thuntm', admin ID, and real user ID 'user-2'
  const result = await service.bulkRemove(['u-thuntm', 'admin-id', 'user-2']);

  // u-thuntm should fail because it does not exist
  const missingFailure = result.failed.find(f => f.id === 'u-thuntm');
  assert.ok(missingFailure, 'u-thuntm should be in failed list');
  assert.equal(missingFailure.reason, 'Tài khoản không tồn tại hoặc đã bị xóa.');

  // admin-id should fail because it is protected
  const adminFailure = result.failed.find(f => f.id === 'admin-id');
  assert.ok(adminFailure, 'admin-id should be in failed list');
  assert.equal(adminFailure.reason, 'Không thể xóa tài khoản quản trị hệ thống.');

  // user-2 should succeed
  assert.ok(result.succeeded.includes('user-2'));
  assert.equal(users.has('user-2'), false);
});
