import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

export function createPrismaClient(connectionString: string) {
  const url = new URL(connectionString);
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql://');
  // Local MySQL 8 may require a full caching_sha2_password handshake after restart.
  // Never retrieve an unverified server key for a remote/production database.
  const localDevelopment = process.env.NODE_ENV !== 'production' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const adapter = new PrismaMariaDb({
    host: url.hostname, port: Number(url.port || 3306),
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)), connectionLimit: 5,
    allowPublicKeyRetrieval: localDevelopment,
  });
  return new PrismaClient({ adapter });
}
