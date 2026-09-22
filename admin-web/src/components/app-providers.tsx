'use client';

import { App, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './auth-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#2563eb', borderRadius: 10 } }}>
      <App><AuthProvider>{children}</AuthProvider></App>
    </ConfigProvider>
  );
}
