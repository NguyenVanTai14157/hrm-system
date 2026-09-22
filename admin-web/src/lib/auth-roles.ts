import { CurrentUser } from './api-client';

export function isUserAdmin(user: CurrentUser | null): boolean {
  if (!user) return false;
  // Only root 'admin' username is Admin; all other user accounts are Employees
  return user.username?.toLowerCase() === 'admin';
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
