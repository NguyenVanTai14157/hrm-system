import { SetMetadata } from '@nestjs/common';
export const Public = () => SetMetadata('auth:public', true);
export const AllowPasswordChange = () => SetMetadata('auth:allow-password-change', true);
export const RequirePermissions = (...codes: string[]) => SetMetadata('auth:permissions', codes);
