import type { Request } from 'express';
import type { Prisma } from '../../generated/prisma/client';

export const userInclude = { roles: { include: { role: { include: { permissions: true } } } } } as const;
export type AuthUser = Prisma.UserGetPayload<{ include: typeof userInclude }>;
export type ClientApp = 'admin' | 'client';
export interface AuthRequest extends Request {
  auth: { user: AuthUser; sessionId: string; client: ClientApp; rememberMe: boolean };
}
export function permissionsOf(user: AuthUser): string[] {
  return [...new Set(user.roles.flatMap(({ role }) => role.permissions.map((p) => p.permissionCode)))];
}
export function publicUser(user: AuthUser) {
  return {
    id: user.id, username: user.username, displayName: user.displayName,
    employeeId: user.employeeId, mustChangePassword: user.mustChangePassword,
    roles: user.roles.map(({ role }) => ({ id: role.id, name: role.name })),
    permissions: permissionsOf(user),
  };
}
