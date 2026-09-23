import React from 'react';
import { PersonalShell } from '@/features/personal/personal-shell';

export const metadata = {
  title: 'Cá nhân | HRM System',
  description: 'Hồ sơ, bảng công và bảng lương cá nhân',
};

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return <PersonalShell>{children}</PersonalShell>;
}
