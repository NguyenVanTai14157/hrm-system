import Link from 'next/link';
import { notFound } from 'next/navigation';
import { hrmModules } from '@/lib/hrm-modules';
import { PortalIcon } from '@/components/portal-icon';

export function generateStaticParams() {
  return hrmModules.filter((item) => item.slug !== 'employees').map((item) => ({ module: item.slug }));
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const { module: slug } = await params;
  const moduleInfo = hrmModules.find((item) => item.slug === slug);
  if (!moduleInfo) notFound();
  return (
    <>
      <div className="page-heading"><div><span className="eyebrow">HRM / {moduleInfo.name}</span><h1>{moduleInfo.name}</h1></div><span className="phase-label"><span />Giao diện khởi tạo</span></div>
      <section className="dashboard-panel module-placeholder">
        <span className="module-icon" style={{ color: moduleInfo.color, background: moduleInfo.color + '12' }}><PortalIcon name={moduleInfo.icon} size={34} /></span>
        <h2>{moduleInfo.description}</h2>
        <p>Không gian {moduleInfo.name.toLowerCase()} đã sẵn sàng để phát triển.<br />Các chức năng sẽ được bổ sung sau khi thống nhất yêu cầu nghiệp vụ.</p>
        <Link href="/" className="back-home">Về trang tổng quan →</Link>
      </section>
    </>
  );
}
