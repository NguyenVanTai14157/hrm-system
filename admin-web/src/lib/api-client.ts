import axios from 'axios';
import { rememberUsername } from './login-preference';

export interface CurrentUser {
  id: string;
  username: string;
  displayName: string;
  employeeId: string | null;
  mustChangePassword: boolean;
  roles: { id: string; name: string }[];
  permissions: string[];
}
interface AuthResult { accessToken: string; expiresIn: number; user: CurrentUser }
let token: string | null = null;
let refreshPending: Promise<CurrentUser | null> | null = null;
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002/api/v1',
  timeout: 15_000, withCredentials: true,
  headers: { Accept: 'application/json', 'X-HRM-Client': 'admin' },
});
function publish(result: AuthResult | null) {
  token = result?.accessToken ?? null;
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hrm-session', { detail: result?.user ?? null }));
}
async function cookieLock<T>(work: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('hrm-admin-session', work);
  }
  return work();
}
export function restoreSession(): Promise<CurrentUser | null> {
  if (!refreshPending) {
    refreshPending = cookieLock(async () => {
      try {
        const { data } = await apiClient.post<AuthResult>('/auth/refresh');
        publish(data);
        return data.user;
      } catch (error) {
        if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
          publish(null); return null;
        }
        throw error;
      }
    }).finally(() => { refreshPending = null; });
  }
  return refreshPending;
}
apiClient.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
apiClient.interceptors.response.use((response) => response, async (error) => {
  const original = error.config;
  // Login/change-password errors belong to their forms, not to session recovery.
  if (error.response?.status === 401 && original && !original._retried &&
      (!original.url?.startsWith('/auth/') || original.url === '/auth/me' || original.url === '/auth/admin-access')) {
    original._retried = true;
    if (await restoreSession()) return apiClient(original);
  }
  return Promise.reject(error);
});
export async function login(username: string, password: string, rememberMe = false) {
  return cookieLock(async () => {
    const { data } = await apiClient.post<AuthResult>('/auth/login', { username, password, rememberMe });
    rememberUsername(data.user.username, rememberMe);
    publish(data); return data.user;
  });
}
export async function logout() {
  await cookieLock(async () => {
    await apiClient.post('/auth/logout');
    publish(null);
  });
}
export async function changePassword(currentPassword: string, newPassword: string) {
  return cookieLock(async () => {
    const { data } = await apiClient.post<AuthResult>('/auth/change-password', { currentPassword, newPassword });
    publish(data); return data.user;
  });
}
export async function getCurrentUser() {
  try {
    const { data } = await apiClient.get<CurrentUser>('/auth/me');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('hrm-session', { detail: data }));
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) publish(null);
    throw error;
  }
}
export function authError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Không kết nối được máy chủ. Kiểm tra backend đang chạy rồi thử lại.';
    if (error.response.status === 429) return 'Bạn thao tác quá nhiều lần. Vui lòng chờ một phút rồi thử lại.';
    const message: unknown = error.response.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(' • ');
  }
  return 'Không thực hiện được yêu cầu. Vui lòng thử lại.';
}
