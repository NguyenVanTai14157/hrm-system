export const payrollSections = [
  { slug: 'dashboard', label: 'Dashboard', icon: 'home' },
  { slug: '', label: 'Bảng lương', icon: 'currency' },
  { slug: 'templates', label: 'Loại bảng lương', icon: 'document' },
  { slug: 'reports', label: 'Báo cáo', icon: 'chart' },
  { slug: 'customize', label: 'Tùy chỉnh', icon: 'settings' },
];

export const payrollSectionHref = (slug: string) => slug ? `/hrm/payroll/${slug}` : '/hrm/payroll';
