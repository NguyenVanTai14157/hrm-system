import { CurrentUser } from './api-client';

export function isUserAdmin(user: CurrentUser | null): boolean {
  if (!user) return false;
  if (user.username?.toLowerCase() === 'admin') return true;
  return (
    user.permissions?.includes('system.manage') ||
    user.roles?.some((r) => {
      const name = (r.name || '').toLowerCase();
      return name.includes('quản trị hệ thống') || (name.includes('admin') && !name.includes('nhân viên'));
    }) ||
    false
  );
}

export function isUserManager(user: CurrentUser | null): boolean {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  return (
    user.roles?.some((r) => {
      const name = (r.name || '').toLowerCase();
      return name.includes('quản lý') || name.includes('manager') || name.includes('trưởng');
    }) ?? false
  );
}
