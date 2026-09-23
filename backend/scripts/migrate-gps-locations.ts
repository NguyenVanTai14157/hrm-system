import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';

const p = createPrismaClient(process.env.DATABASE_URL!);

async function main() {
  console.log('--- Migrating GPS Location Tables ---');

  // 1. Create GpsLocation table
  await p.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS GpsLocation (
      id CHAR(36) NOT NULL PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(150) NOT NULL,
      address VARCHAR(255) NULL,
      latitude DOUBLE NOT NULL,
      longitude DOUBLE NOT NULL,
      radius INT NOT NULL DEFAULT 200,
      isActive BOOLEAN NOT NULL DEFAULT true,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ GpsLocation table ready');

  // 2. Create EmployeeGpsLocation join table
  await p.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS EmployeeGpsLocation (
      id CHAR(36) NOT NULL PRIMARY KEY,
      employeeId CHAR(36) NOT NULL,
      gpsLocationId CHAR(36) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      UNIQUE KEY uk_emp_gps (employeeId, gpsLocationId),
      INDEX idx_emp (employeeId),
      INDEX idx_gps (gpsLocationId),
      CONSTRAINT fk_egl_employee FOREIGN KEY (employeeId) REFERENCES Employee(id) ON DELETE CASCADE,
      CONSTRAINT fk_egl_gps FOREIGN KEY (gpsLocationId) REFERENCES GpsLocation(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ EmployeeGpsLocation table ready');

  // 3. Seed / Ensure TEST_HQ and TEST_CN_DANANG exist
  const hqId = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
  const cnId = 'b2c3d4e5-f6a1-4b2c-9d3e-4f5a6b7c8d9e';

  await p.$executeRawUnsafe(`
    INSERT INTO GpsLocation (id, code, name, address, latitude, longitude, radius, isActive, createdAt, updatedAt)
    VALUES 
      ('${hqId}', 'TEST_HQ', 'Văn phòng TEST_HQ (Hội Sở)', '14 Lê Duy Đình, Q. Thanh Khê, TP. Đà Nẵng', 16.0544, 108.2022, 200, true, NOW(3), NOW(3)),
      ('${cnId}', 'TEST_CN_DANANG', 'Chi nhánh TEST_CN_DANANG', '38 Nguyễn Oanh, Q. Hải Châu, TP. Đà Nẵng', 16.0600, 108.2100, 300, true, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      address = VALUES(address),
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      radius = VALUES(radius),
      isActive = VALUES(isActive);
  `);
  console.log('✓ Seeded TEST_HQ and TEST_CN_DANANG GPS locations');

  // 4. Assign TEST_HQ and TEST_CN_DANANG to all active employees if they don't have assignments yet
  const employees: Array<{ id: string }> = await p.$queryRawUnsafe(`SELECT id FROM Employee WHERE status = 'WORKING'`);
  console.log(`Found ${employees.length} active employees to assign GPS locations`);

  for (const emp of employees) {
    const assignHqId = `hq-${emp.id}`.slice(0, 36);
    const assignCnId = `cn-${emp.id}`.slice(0, 36);

    await p.$executeRawUnsafe(`
      INSERT IGNORE INTO EmployeeGpsLocation (id, employeeId, gpsLocationId, createdAt)
      VALUES 
        ('${assignHqId}', '${emp.id}', '${hqId}', NOW(3)),
        ('${assignCnId}', '${emp.id}', '${cnId}', NOW(3));
    `);
  }
  console.log('✓ Assigned GPS locations to active employees');
  console.log('--- GPS Migration Completed Successfully ---');
}

main()
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
