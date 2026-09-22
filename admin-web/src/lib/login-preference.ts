const key = 'hrm.admin-web.rememberedUsername';
export function rememberedUsername(): string {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}
export function rememberUsername(username: string, enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(key, username);
    else localStorage.removeItem(key);
  } catch { /* Login remains available when browser storage is disabled. */ }
}
