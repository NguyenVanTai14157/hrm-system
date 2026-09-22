import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';
export const employeePermissions = ['employee.view','employee.create','employee.update','employee.catalog.manage'];
async function main() {
  const db = createPrismaClient(process.env.DATABASE_URL!);
  try {
    await db.$transaction(async tx => {
      for (const code of employeePermissions) await tx.permission.upsert({where:{code},update:{},create:{code,description:code}});
      const roles = await tx.role.findMany({where:{permissions:{some:{permissionCode:'system.manage'}}}});
      for (const role of roles) for (const permissionCode of employeePermissions) await tx.rolePermission.upsert({where:{roleId_permissionCode:{roleId:role.id,permissionCode}},update:{},create:{roleId:role.id,permissionCode}});
      console.log(`Employee permissions ready for ${roles.length} system management role(s). No passwords changed.`);
    });
  } finally {await db.$disconnect();}
}
main().catch(()=>{console.error('Could not initialize employee permissions. Check database connectivity.');process.exitCode=1;});
