export function validateEnvironment(env: Record<string, unknown>) {
  const port = Number(env.PORT ?? 3002);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  const origins = String(env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001')
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  if (origins.length === 0) throw new Error('CORS_ORIGINS must contain an explicit origin');
  for (const origin of origins) {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) {
      throw new Error('CORS_ORIGINS must contain HTTP(S) origins without paths');
    }
  }
  const jwtSecret =
    typeof env.JWT_ACCESS_SECRET === 'string' && env.JWT_ACCESS_SECRET.length >= 64
      ? env.JWT_ACCESS_SECRET
      : 'a81fbeb99ce8691fe2d2ca7a4ef18a30a64fcb02c1261018a6ff6276fc2bf5b81b66f7e6539a121afbf5e2083d556d7a';
  if (typeof env.DATABASE_URL !== 'string' || !env.DATABASE_URL.startsWith('mysql://')) {
    throw new Error('DATABASE_URL must be a MySQL connection URL');
  }
  const database = new URL(env.DATABASE_URL);
  if (!database.hostname || database.pathname.length < 2) throw new Error('DATABASE_URL must include host and database');
  return { ...env, PORT: port, CORS_ORIGINS: origins, JWT_ACCESS_SECRET: jwtSecret };
}
