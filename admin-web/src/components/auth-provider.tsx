'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Alert, Button, Spin } from 'antd';
import { authError, getCurrentUser, restoreSession, type CurrentUser } from '@/lib/api-client';

const AuthContext = createContext<{ user: CurrentUser | null; loading: boolean }>({ user: null, loading: true });
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pathname = usePathname();
  const router = useRouter();
  const initialize = useCallback(() => restoreSession()
    .then((account) => { setUser(account); setLoading(false); })
    .catch((err: unknown) => { setError(authError(err)); setLoading(false); }), []);
  useEffect(() => {
    const listener = (event: Event) => setUser((event as CustomEvent<CurrentUser | null>).detail);
    window.addEventListener('hrm-session', listener);
    void initialize();
    return () => window.removeEventListener('hrm-session', listener);
  }, [initialize]);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const check = () => { if (document.visibilityState === 'visible') void getCurrentUser().catch(() => {}); };
    window.addEventListener('focus', check);
    const interval = window.setInterval(check, 60_000);
    return () => { window.removeEventListener('focus', check); window.clearInterval(interval); };
  }, [userId]);
  useEffect(() => {
    if (loading || error) return;
    if (!user && pathname !== '/login') router.replace('/login');
    else if (user?.mustChangePassword && pathname !== '/change-password') router.replace('/change-password');
    else if (user && !user.mustChangePassword && pathname === '/login') router.replace('/');
  }, [user, loading, error, pathname, router]);
  if (loading) return <div className="auth-loading"><Spin size="large" /><p>Đang kiểm tra phiên đăng nhập…</p></div>;
  if (error) return <div className="auth-loading"><Alert type="error" title={error} /><Button onClick={() => { setLoading(true); setError(''); void initialize(); }}>Thử lại</Button></div>;
  const allowed = (!user && pathname === '/login') || (user && (user.mustChangePassword ? pathname === '/change-password' : pathname !== '/login'));
  return <AuthContext.Provider value={{ user, loading }}>{allowed ? children : <div className="auth-loading"><Spin /></div>}</AuthContext.Provider>;
}
