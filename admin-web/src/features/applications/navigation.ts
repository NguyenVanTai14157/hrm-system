import type { IconName } from '@/lib/hrm-modules';

export const applicationSections: { slug: string; label: string; icon: IconName }[] = [
  { slug: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { slug: '', label: 'Đơn từ', icon: 'file' },
  { slug: 'customize', label: 'Tùy chỉnh', icon: 'settings' },
];

export function applicationSectionHref(slug: string) {
  return slug ? `/hrm/applications/${slug}` : '/hrm/applications';
}
