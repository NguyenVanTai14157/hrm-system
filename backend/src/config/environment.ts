function cleanValue(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

export function validateEnvironment(env: Record<string, unknown>) {
  const rawPort = cleanValue(env.PORT) || '3002';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const rawOrigins = cleanValue(env.CORS_ORIGINS) || 'http://localhost:3000,http://localhost:3001,https://hrm.cool.tvt.id.vn';
  const origins = rawOrigins
    .split(',')
    .map((origin) => cleanValue(origin).replace(/\/+$/, ''))
    .filter(Boolean);

  if (origins.length === 0) throw new Error('CORS_ORIGINS must contain an explicit origin');
  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('CORS_ORIGINS must contain HTTP(S) origins');
      }
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }
  }

  const rawSecret = cleanValue(env.JWT_ACCESS_SECRET);
  const jwtSecret =
    rawSecret.length >= 64
      ? rawSecret
      : 'a81fbeb99ce8691fe2d2ca7a4ef18a30a64fcb02c1261018a6ff6276fc2bf5b81b66f7e6539a121afbf5e2083d556d7a';

  const rawDbUrl = cleanValue(env.DATABASE_URL) || 'mysql://root:75SuauOg1etik5WzuyHoI00Jb8g6Dy1jmcaFMvGxv6srBTLgZLZURDjewrfj0H8N@ca6f0ar8iifbdwv6qoq8lauh:3306/hrm';
  if (!rawDbUrl.startsWith('mysql://')) {
    throw new Error('DATABASE_URL must be a MySQL connection URL starting with mysql://');
  }

  return {
    ...env,
    PORT: port,
    CORS_ORIGINS: origins,
    JWT_ACCESS_SECRET: jwtSecret,
    DATABASE_URL: rawDbUrl,
  };
}

