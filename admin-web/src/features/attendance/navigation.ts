export interface SubMenuItem {
  slug: string;
  label: string;
  href: string;
}

export interface SectionItem {
  slug: string;
  label: string;
  icon: string;
  children?: SubMenuItem[];
}

export const attendanceSections: SectionItem[] = [
  { slug: 'dashboard', label: 'Dashboard', icon: 'home' },
  { 
    slug: 'timekeep', 
    label: 'Chấm công', 
    icon: 'clock',
    children: [
      { slug: 'timekeep', label: 'Bảng chấm công', href: '/hrm/attendance/timekeep' },
      { slug: 'meal', label: 'Bảng chấm công ăn', href: '/hrm/attendance/meal' },
      { slug: 'auto-rules', label: 'Tự động chấm công', href: '/hrm/attendance/auto-rules' },
    ] 
  },
  { 
    slug: 'shift-assign', 
    label: 'Phân ca', 
    icon: 'calendar',
    children: [
      { slug: 'shift-assign', label: 'Bảng phân ca', href: '/hrm/attendance/shift-assign' },
      { slug: 'shifts', label: 'Phân ca làm việc', href: '/hrm/attendance/shifts' },
      { slug: 'shift-registers', label: 'Bảng đăng ký ca', href: '/hrm/attendance/shift-registers' },
    ]
  },
  { 
    slug: 'devices', 
    label: 'Máy chấm', 
    icon: 'key',
    children: [
      { slug: 'devices', label: 'Danh sách máy chấm', href: '/hrm/attendance/devices' },
      { slug: 'raw-logs', label: 'Dữ liệu thô máy chấm', href: '/hrm/attendance/raw-logs' },
    ]
  },
  { 
    slug: 'holidays', 
    label: 'Ngày nghỉ', 
    icon: 'file',
    children: [
      { slug: 'furlough', label: 'Bảng tổng hợp phép', href: '/hrm/attendance/furlough' },
      { slug: 'holidays', label: 'Danh sách ngày nghỉ', href: '/hrm/attendance/holidays' },
    ]
  },
  { slug: 'reports', label: 'Báo cáo', icon: 'chart' },
  { slug: 'customize', label: 'Tùy chỉnh', icon: 'settings' },
];

export const attendanceSectionHref = (slug: string) => {
  if (slug === 'shift-assign') return '/hrm/attendance/shift-assign';
  if (slug === 'timekeep') return '/hrm/attendance/timekeep';
  return slug ? `/hrm/attendance/${slug}` : '/hrm/attendance';
};

