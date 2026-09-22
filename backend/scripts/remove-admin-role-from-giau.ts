import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';

async function main() {
  const prisma = createPrismaClient(process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/hrm');
  
  const user = await prisma.user.findUnique({
    where: { username: 'giau' },
    include: {
      roles: {
        include: { role: true }
      }
    }
  });

  if (!user) {
    console.log('User giau not found');
    return;
  }

  console.log('Before update roles of giau:', user.roles.map(r => r.role.name));

  // Find Quản trị hệ thống role
  const adminRole = user.roles.find(r => r.role.name.includes('Quản trị'));
  if (adminRole) {
    await prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.roleId,
        }
      }
    });
    console.log('✅ Đã gỡ vai trò "Quản trị hệ thống" khỏi tài khoản Nguyễn Văn Giàu (giau)!');
  }

  // Also increment authVersion or update so session is refreshed
  await prisma.user.update({
    where: { id: user.id },
    data: { authVersion: { increment: 1 } },
  });

  const updated = await prisma.user.findUnique({
    where: { username: 'giau' },
    include: { roles: { include: { role: true } } }
  });
  console.log('After update roles of giau:', updated?.roles.map(r => r.role.name));

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
