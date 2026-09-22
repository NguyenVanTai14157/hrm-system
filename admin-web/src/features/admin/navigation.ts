export const adminSections = [
  { slug: '', label: 'Người dùng', icon: 'users' },
  { slug: 'departments', label: 'Phòng ban', icon: 'home' },
  { slug: 'roles', label: 'Nhóm', icon: 'shield' },
  { slug: 'reconcile', label: 'Đối soát', icon: 'reconcile' },
  { slug: 'currencies', label: 'Tiền tệ', icon: 'currency' },
  { slug: 'audit', label: 'Lịch sử', icon: 'clock' },
  { slug: 'sso', label: 'SSO', icon: 'key' },
  { slug: 'oidc', label: 'OIDC App', icon: 'app' },
];

export const adminSectionHref = (slug: string) => slug ? `/hrm/admin/${slug}` : '/hrm/admin';
