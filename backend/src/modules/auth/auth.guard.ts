import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthRequest, permissionsOf } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>('auth:public', targets)) return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Vui lòng đăng nhập.');
    request.auth = await this.auth.authenticate(header.slice(7));
    if (request.auth.user.mustChangePassword &&
      !this.reflector.getAllAndOverride<boolean>('auth:allow-password-change', targets)) {
      throw new ForbiddenException({ code: 'PASSWORD_CHANGE_REQUIRED', message: 'Vui lòng đổi mật khẩu trước khi tiếp tục.' });
    }
    const required = this.reflector.getAllAndOverride<string[]>('auth:permissions', targets) ?? [];
    const granted = permissionsOf(request.auth.user);
    if (required.some((code) => !granted.includes(code))) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    return true;
  }
}
