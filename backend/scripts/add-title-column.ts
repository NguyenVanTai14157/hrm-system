import 'dotenv/config';
import { createPrismaClient } from '../src/database/client';

const p = createPrismaClient(process.env.DATABASE_URL!);

async function main() {
  try {
    await p.$executeRawUnsafe('ALTER TABLE ShiftAssignment ADD COLUMN title VARCHAR(150) NULL');
    console.log('Successfully added title column to ShiftAssignment');
  } catch (err: any) {
    if (err.message && err.message.includes('Duplicate column')) {
      console.log('Column title already exists');
    } else {
      console.log('Error or notice:', err.message);
    }
  }
}

main().finally(() => process.exit(0));
