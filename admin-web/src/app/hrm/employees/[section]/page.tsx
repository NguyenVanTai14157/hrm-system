import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortalIcon } from '@/components/portal-icon';
import { employeeSections } from '@/features/employees/navigation';

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const item = employeeSections.find(item => item.slug === section && item.slug !== '');
  if (!item) notFound();
  return <section className="dashboard-panel module-placeholder">
    <span className="module-icon"><PortalIcon name={item.icon} size={36} /></span>
    <h1>{item.label}</h1>
    <p>{item.description}</p>
    <span className="phase-label">Sẽ triển khai sau</span>
    <p>Bạn có thể tiếp tục quản lý hồ sơ, danh mục và lịch sử thay đổi tại mục Nhân sự.</p>
    <Link className="back-home" href="/hrm/employees">Đi đến hồ sơ nhân sự →</Link>
  </section>;
}
