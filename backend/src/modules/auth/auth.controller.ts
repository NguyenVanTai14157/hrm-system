import { Controller, Get, Post, Body, Req, Res, HttpCode, ForbiddenException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response, CookieOptions } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, ChangePasswordDto } from './auth.dto';
import { AllowPasswordChange, Public, RequirePermissions } from './auth.decorators';
import { AuthRequest, ClientApp, publicUser } from './auth.types';

@ApiTags('auth')
@ApiHeader({ name: 'X-HRM-Client', required: true, schema: { enum: ['admin', 'client'] } })
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private auth: AuthService, private config: ConfigService) {}
  private client(req: AuthRequest): ClientApp {
    const value = req.header('X-HRM-Client');
    const origin = req.header('Origin');
    const isDev = this.config.get('NODE_ENV') !== 'production';
    const allowed = this.config.getOrThrow<string[]>('CORS_ORIGINS');
    if ((value !== 'admin' && value !== 'client') ||
      (origin && !allowed.includes(origin) && !isDev)) {
      throw new ForbiddenException('Nguồn yêu cầu không được phép.');
    }
    return value;
  }
  private options(): CookieOptions {
    return { httpOnly: true, secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax', path: '/api/v1/auth' };
  }
  private send(res: Response, client: ClientApp, result: Awaited<ReturnType<AuthService['login']>>) {
    res.setHeader('Cache-Control', 'no-store');
    res.cookie('hrm_' + client + '_refresh', result.refreshToken, {
      ...this.options(), ...(result.rememberMe ? { expires: result.refreshExpiresAt } : {}),
    });
    return { accessToken: result.accessToken, expiresIn: result.expiresIn, user: result.user };
  }
  @Public() @Post('login') @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const client = this.client(req);
    return this.send(res, client, await this.auth.login(dto.username, dto.password, client, dto.rememberMe ?? false));
  }
  @Public() @Post('refresh') @HttpCode(200)
  async refresh(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const client = this.client(req);
    return this.send(res, client, await this.auth.refresh(req.cookies?.['hrm_' + client + '_refresh'] ?? '', client));
  }
  @Public() @Post('logout') @HttpCode(200)
  async logout(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const client = this.client(req);
    await this.auth.logout(req.cookies?.['hrm_' + client + '_refresh'], client);
    res.clearCookie('hrm_' + client + '_refresh', this.options());
    return { message: 'Đã đăng xuất.' };
  }
  @ApiBearerAuth() @AllowPasswordChange() @Get('me')
  me(@Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return publicUser(req.auth.user);
  }
  @ApiBearerAuth() @RequirePermissions('admin.access') @Get('admin-access')
  adminAccess() {
    return { allowed: true };
  }
  @ApiBearerAuth() @AllowPasswordChange() @Post('change-password') @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: AuthRequest, @Res({ passthrough: true }) res: Response) {
    const client = this.client(req);
    if (client !== req.auth.client) throw new ForbiddenException();
    return this.send(res, client, await this.auth.changePassword(req.auth.user, client, dto.currentPassword, dto.newPassword, req.auth.rememberMe));
  }
}
