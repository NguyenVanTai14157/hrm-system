import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

export function createPrismaClient(connectionString: string) {
  const url = new URL(connectionString);
  if (url.protocol !== 'mysql:') throw new Error('DATABASE_URL must use mysql://');
  // Coolify's private MySQL network uses caching_sha2_password. Allow the
  // driver to retrieve the server RSA key so the production handshake works.
  const adapter = new PrismaMariaDb({
    host: url.hostname, port: Number(url.port || 3306),
    user: decodeURIComponent(url.username), password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)), connectionLimit: 5,
    allowPublicKeyRetrieval: true,
  });
  return new PrismaClient({ adapter });
}
