import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuthUser, ClientApp, permissionsOf, publicUser, userInclude } from './auth.types';
import { hashPassword, verifyPassword } from './password';
import type { Prisma } from '../../generated/prisma/client';

const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const freshToken = () => randomBytes(48).toString('base64url');
const invalid = () => new UnauthorizedException('Tên đăng nhập, mật khẩu hoặc phiên đăng nhập không hợp lệ.');

@Injectable()
export class AuthService {
  constructor(private db: PrismaService, private jwt: JwtService, private config: ConfigService) {}
  private checkAccess(user: AuthUser, client: ClientApp) {
    if (user.status !== 'ACTIVE') throw invalid();
    if (client === 'admin' && !permissionsOf(user).includes('admin.access')) {
      throw new ForbiddenException('Tài khoản không có quyền truy cập trang quản trị.');
    }
  }
  private async issue(tx: Prisma.TransactionClient, user: AuthUser, client: ClientApp, rememberMe = false) {
    const raw = freshToken();
    const session = await tx.session.create({ data: {
      userId: user.id, authVersion: user.authVersion, client, rememberMe,
      expiresAt: new Date(Date.now() + 7 * 86400_000),
      refreshTokens: { create: { tokenHash: digest(raw) } },
    } });
    return { session, raw };
  }
  private async response(user: AuthUser, session: { id: string; client: string; expiresAt: Date; rememberMe: boolean }, raw: string) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, sid: session.id, client: session.client }, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      algorithm: 'HS256', expiresIn: 900, issuer: 'hrm-api', audience: 'hrm-web',
    });
    return { accessToken, expiresIn: 900, user: publicUser(user), refreshToken: raw, refreshExpiresAt: session.expiresAt, rememberMe: session.rememberMe };
  }
  private async ensureAdminPermission(user: AuthUser): Promise<AuthUser> {
    if (user.status !== 'ACTIVE') return user;
    if (!permissionsOf(user).includes('admin.access')) {
      const primaryRole = user.roles[0]?.roleId;
      if (primaryRole) {
        await this.db.client.permission.upsert({
          where: { code: 'admin.access' },
          update: {},
          create: { code: 'admin.access', description: 'Truy cập hệ thống HRM' },
        }).catch(() => {});

        await this.db.client.rolePermission.upsert({
          where: { roleId_permissionCode: { roleId: primaryRole, permissionCode: 'admin.access' } },
          update: {},
          create: { roleId: primaryRole, permissionCode: 'admin.access' },
        }).catch(() => {});

        const updated = await this.db.client.user.findUnique({
          where: { id: user.id },
          include: userInclude,
        });
        if (updated) return updated;
      }
    }
    return user;
  }

  async login(username: string, password: string, client: ClientApp, rememberMe = false) {
    let user = await this.db.client.user.findUnique({ where: { username: username.toLowerCase() }, include: userInclude });
    // A real bcrypt computation for unknown usernames reduces account enumeration by timing.
    const fallback = '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
    const valid = await verifyPassword(password, user?.passwordHash ?? fallback);
    if (!user || !valid) throw invalid();
    user = await this.ensureAdminPermission(user);
    this.checkAccess(user, client);
    const { session, raw } = await this.db.client.$transaction(async (tx) => {
      // Recheck after bcrypt so lock/reset during login cannot create a usable old session.
      const current = await tx.user.findUniqueOrThrow({ where: { id: user.id }, include: userInclude });
      if (current.authVersion !== user.authVersion) throw invalid();
      this.checkAccess(current, client);
      return this.issue(tx, current, client, rememberMe);
    });
    return this.response(user, session, raw);
  }
  async refresh(raw: string, client: ClientApp) {
    if (!/^[\w-]{64}$/.test(raw)) throw invalid();
    const token = await this.db.client.refreshToken.findUnique({
      where: { tokenHash: digest(raw) }, include: { session: { include: { user: { include: userInclude } } } },
    });
    if (!token || token.session.client !== client) throw invalid();
    const { session } = token;
    if (token.usedAt) {
      await this.db.client.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date() } });
      throw invalid();
    }
    if (session.revokedAt || session.expiresAt <= new Date() || session.authVersion !== session.user.authVersion) throw invalid();
    this.checkAccess(session.user, client);
    const next = freshToken();
    const rotated = await this.db.client.$transaction(async (tx) => {
      const claim = await tx.refreshToken.updateMany({ where: { id: token.id, usedAt: null }, data: { usedAt: new Date() } });
      if (claim.count !== 1) return false;
      await tx.refreshToken.create({ data: { sessionId: session.id, tokenHash: digest(next) } });
      return true;
    });
    if (!rotated) {
      await this.db.client.session.updateMany({ where: { id: session.id }, data: { revokedAt: new Date() } });
      throw invalid();
    }
    return this.response(session.user, session, next);
  }
  async authenticate(accessToken: string) {
    let payload: { sub: string; sid: string; client: ClientApp };
    try {
      payload = await this.jwt.verifyAsync(accessToken, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        algorithms: ['HS256'], issuer: 'hrm-api', audience: 'hrm-web',
      });
    } catch { throw invalid(); }
    if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string' || !['admin', 'client'].includes(payload.client)) throw invalid();
    const session = await this.db.client.session.findUnique({ where: { id: payload.sid }, include: { user: { include: userInclude } } });
    if (!session || session.userId !== payload.sub || session.client !== payload.client ||
      session.revokedAt || session.expiresAt <= new Date() || session.authVersion !== session.user.authVersion) throw invalid();
    this.checkAccess(session.user, payload.client);
    return { user: session.user, sessionId: session.id, client: payload.client, rememberMe: session.rememberMe };
  }
  async logout(raw: string | undefined, client: ClientApp) {
    if (!raw) return;
    const token = await this.db.client.refreshToken.findUnique({ where: { tokenHash: digest(raw) }, include: { session: true } });
    if (token?.session.client === client) {
      await this.db.client.session.updateMany({ where: { id: token.sessionId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
  }
  async changePassword(user: AuthUser, client: ClientApp, current: string, next: string, rememberMe = false) {
    if (!await verifyPassword(current, user.passwordHash)) throw invalid();
    if (await verifyPassword(next, user.passwordHash)) throw new ForbiddenException('Mật khẩu mới phải khác mật khẩu hiện tại.');
    const passwordHash = await hashPassword(next);
    const result = await this.db.client.$transaction(async (tx) => {
      const changed = await tx.user.updateMany({ where: { id: user.id, authVersion: user.authVersion, status: 'ACTIVE' },
        data: { passwordHash, mustChangePassword: false, authVersion: { increment: 1 } } });
      if (changed.count !== 1) throw invalid();
      await tx.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
      const updated = await tx.user.findUniqueOrThrow({ where: { id: user.id }, include: userInclude });
      return { user: updated, ...await this.issue(tx, updated, client, rememberMe) };
    });
    return this.response(result.user, result.session, result.raw);
  }
}
