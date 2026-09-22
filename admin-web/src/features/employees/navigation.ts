import type { IconName } from '@/lib/hrm-modules';

export const employeeSections: { slug: string; label: string; icon: IconName; description: string }[] = [
  { slug: 'dashboard', label: 'Dashboard', icon: 'chart', description: 'Tổng hợp tình hình nhân sự và biến động trong kỳ.' },
  { slug: '', label: 'Nhân sự', icon: 'users', description: 'Hồ sơ nhân sự' },
  { slug: 'contracts', label: 'Hợp đồng', icon: 'file', description: 'Quản lý hợp đồng và thời hạn hợp đồng của nhân viên.' },
  { slug: 'decisions', label: 'Quyết định', icon: 'calendar', description: 'Theo dõi các quyết định và thay đổi công việc.' },
  { slug: 'reports', label: 'Báo cáo', icon: 'chart', description: 'Báo cáo nhân sự theo phòng ban và thời gian.' },
  { slug: 'customize', label: 'Tùy chỉnh', icon: 'settings', description: 'Tùy chỉnh trường thông tin và cách hiển thị hồ sơ.' },
];

export const employeeSectionHref = (slug: string) => '/hrm/employees' + (slug ? '/' + slug : '');
