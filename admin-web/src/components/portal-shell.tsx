'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer, Tag, Tooltip, Dropdown, Popover } from 'antd';
import { BookOutlined, HomeOutlined, MessageOutlined } from '@ant-design/icons';
import { AccountMenu } from './account-menu';
import { NotificationBell } from './notification-bell';
import { hrmModules, type IconName } from '@/lib/hrm-modules';
import { PortalIcon } from './portal-icon';
import { employeeSections, employeeSectionHref } from '@/features/employees/navigation';
import { applicationSections, applicationSectionHref } from '@/features/applications/navigation';
import { attendanceSections, attendanceSectionHref } from '@/features/attendance/navigation';
import { payrollSections, payrollSectionHref } from '@/features/payroll/navigation';
import { adminSections, adminSectionHref } from '@/features/admin/navigation';
import { useAuth } from './auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';

function dispatchAddEmployee() {
  window.dispatchEvent(new CustomEvent('hrm:add-employee'));
}

function dispatchAddUser() {
  window.dispatchEvent(new CustomEvent('hrm:add-user'));
}

function RailItemWithPopover({
  item,
  isActive,
  sectionHref,
  moduleTheme = '#e83e8c'
}: {
  item: any;
  isActive: boolean;
  sectionHref: string;
  moduleTheme?: string;
}) {
  const pathname = usePathname();
  const linkContent = (
    <Link
      href={sectionHref}
      className={'rail-item' + (isActive ? ' is-active' : '')}
      aria-current={isActive ? 'page' : undefined}
    >
      <PortalIcon name={item.icon as IconName} />
      <span>{item.label}</span>
    </Link>
  );

  if (!item.children || item.children.length === 0) {
    return linkContent;
  }

  const popoverContent = (
    <div className="rail-popover-menu">
      <div className="popover-header" style={{ color: moduleTheme, backgroundColor: `${moduleTheme}10` }}>
        {item.label}
      </div>
      <div className="popover-items">
        {item.children.map((sub: any) => {
          const subHref = sub.href || (
            item.slug === 'employees' ? employeeSectionHref(sub.slug) :
            item.slug === 'applications' ? applicationSectionHref(sub.slug) :
            item.slug === 'attendance' ? attendanceSectionHref(sub.slug) :
            item.slug === 'payroll' ? payrollSectionHref(sub.slug) :
            item.slug === 'admin' ? adminSectionHref(sub.slug) :
            (sectionHref + (sub.slug ? '/' + sub.slug : ''))
          );
          const isSubActive = pathname === subHref;
          return (
            <Link
              key={sub.slug || sub.label}
              href={subHref}
              className={'popover-item' + (isSubActive ? ' is-active' : '')}
              style={{ color: isSubActive ? moduleTheme : undefined }}
            >
              {sub.label}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <Popover
      placement="rightTop"
      content={popoverContent}
      trigger="hover"
      overlayClassName="office-rail-popover"
      styles={{ container: { padding: 0, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.12)' } }}
    >
      {linkContent}
    </Popover>
  );
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const activeModule = hrmModules.find((item) => pathname === '/hrm/' + item.slug || pathname.startsWith('/hrm/' + item.slug + '/'));
  const inEmployees = activeModule?.slug === 'employees' || pathname.startsWith('/hrm/settings');
  const inApplications = activeModule?.slug === 'applications';
  const inAttendance = activeModule?.slug === 'attendance';
  const inPayroll = activeModule?.slug === 'payroll';
  const inAdmin = activeModule?.slug === 'admin';
  const onEmployeesRoot = pathname === '/hrm/employees';
  const onAdminRoot = pathname === '/hrm/admin';

  const employeeSection = employeeSections.find(item => pathname === employeeSectionHref(item.slug));
  const applicationSection = applicationSections.find(item =>
    item.slug === ''
      ? (pathname === '/hrm/applications' || pathname.startsWith('/hrm/applications/create') || pathname.startsWith('/hrm/applications/'))
      : pathname === applicationSectionHref(item.slug)
  );
  const attendanceSection = attendanceSections.find(item => pathname === attendanceSectionHref(item.slug) || item.children?.some(c => c.href === pathname));
  const payrollSection = payrollSections.find(item => pathname === payrollSectionHref(item.slug));
  const adminSection = adminSections.find(item => pathname === adminSectionHref(item.slug));

  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  if (pathname === '/login' || pathname === '/change-password') return <>{children}</>;

  // Block regular employees from accessing system admin area
  if (!isAdmin && pathname.startsWith('/hrm/admin')) {
    return (
      <div className="portal portal-employees">
        <aside className="portal-rail" aria-label="Điều hướng chính">
          <button
            className={'launcher-button' + (menuOpen ? ' is-active' : '')}
            aria-label="Mở menu ứng dụng 1Office"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            title="Ứng dụng doanh nghiệp"
          >
            <PortalIcon name="grid" size={24} />
          </button>
          <nav className="rail-links">
            <Link href="/" className="rail-item is-active">
              <PortalIcon name="home" />
              <span>Trang chủ</span>
            </Link>
          </nav>
        </aside>
        <header className="portal-topbar">
          <div className="topbar-title">
            <strong style={{ fontSize: 17, color: '#0f172a', fontWeight: 700 }}>Không gian làm việc</strong>
          </div>
          <div className="topbar-account">
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>
        <main className="portal-content">
          <div style={{ maxWidth: 500, margin: '80px auto', background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Giới hạn quyền truy cập</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: '8px 0 24px', lineHeight: 1.6 }}>
              Tài khoản của bạn là <strong>Nhân viên</strong> nên chỉ có quyền sử dụng các chức năng tự phục vụ cá nhân (Công, Lương, Hồ sơ, Đơn từ). Mục Quản trị hệ thống chỉ dành riêng cho Admin.
            </p>
            <Link href="/" style={{ display: 'inline-block', padding: '10px 24px', background: '#e83e8c', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>
              Về bàn làm việc của tôi
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Filter sections for regular user vs admin
  const visibleEmployeeSections = isAdmin
    ? employeeSections
    : employeeSections.filter(item => item.slug === '');

  const visibleAttendanceSections = isAdmin
    ? attendanceSections
    : attendanceSections.filter(item => item.slug === 'timekeep' || item.slug === 'shift-assign' || item.slug === 'holidays');

  // Root rail items for regular user (matching 1Office User Board screenshot)
  const regularUserRail = [
    { slug: 'attendance', label: 'Công', href: '/hrm/attendance', icon: 'calendar', color: '#059669', children: [] },
    { slug: 'payroll', label: 'Lương', href: '/hrm/payroll', icon: 'wallet', color: '#d97706', children: [] },
    { slug: 'employees', label: 'Hồ sơ', href: '/hrm/employees', icon: 'users', color: '#6d28d9', children: [] },
    { slug: 'applications', label: 'Đơn từ', href: '/hrm/applications', icon: 'file', color: '#2563eb', children: [] },
    { slug: 'settings', label: 'Tùy chỉnh', href: '/hrm/settings', icon: 'settings', color: '#64748b', children: [] },
  ];

  // Root rail items for Admin
  const adminRail = [
    { slug: 'employees', label: 'Nhân sự', href: '/hrm/employees', icon: 'users', color: '#6d28d9', children: employeeSections },
    { slug: 'applications', label: 'Đơn từ', href: '/hrm/applications', icon: 'file', color: '#2563eb', children: applicationSections },
    { slug: 'attendance', label: 'Chấm công', href: '/hrm/attendance', icon: 'clock', color: '#059669', children: attendanceSections },
    { slug: 'payroll', label: 'Bảng lương', href: '/hrm/payroll', icon: 'wallet', color: '#d97706', children: payrollSections },
    { slug: 'admin', label: 'Tùy chỉnh', href: '/hrm/admin', icon: 'settings', color: '#e83e8c', children: adminSections },
  ];

  return (
    <div className={'portal' + (inEmployees ? ' portal-employees' : inApplications ? ' portal-applications' : inAttendance ? ' portal-attendance' : inPayroll ? ' portal-payroll' : inAdmin ? ' portal-admin' : '')}>
      {/* 1Office Left Vertical Navigation Rail (Desktop) */}
      <aside className="portal-rail" aria-label="Điều hướng chính" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <button
          className={'launcher-button' + (menuOpen ? ' is-active' : '')}
          aria-label="Mở menu ứng dụng 1Office"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          title="Ứng dụng doanh nghiệp"
        >
          <PortalIcon name="grid" size={24} />
        </button>

        <nav className="rail-links" aria-label="Điều hướng các phân hệ">
          {/* Always show Home / Trang chủ link at the top */}
          <Link
            href="/"
            className={'rail-item' + (pathname === '/' ? ' is-active' : '')}
            aria-current={pathname === '/' ? 'page' : undefined}
          >
            <PortalIcon name="home" />
            <span>Trang chủ</span>
          </Link>
          <div className="rail-home-divider" />

          {!isAdmin ? (
            /* Regular User: Rail always displays the self-service items (matching Screenshots 1, 2, 3, 4) */
            regularUserRail.map((item) => {
              const isActive =
                item.slug === 'attendance'
                  ? pathname.startsWith('/hrm/attendance')
                  : item.slug === 'payroll'
                  ? pathname.startsWith('/hrm/payroll')
                  : item.slug === 'employees'
                  ? pathname.startsWith('/hrm/employees')
                  : item.slug === 'applications'
                  ? pathname.startsWith('/hrm/applications')
                  : item.slug === 'settings'
                  ? pathname.startsWith('/hrm/settings')
                  : pathname === item.href;

              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  className={'rail-item' + (isActive ? ' is-active' : '')}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <PortalIcon name={item.icon as IconName} />
                  <span>{item.label}</span>
                </Link>
              );
            })
          ) : (
            /* Admin view: Module sub-sections or Admin Rail */
            inEmployees ? (
              visibleEmployeeSections.map((item) => (
                <RailItemWithPopover
                  key={item.slug}
                  item={item}
                  isActive={employeeSection === item}
                  sectionHref={employeeSectionHref(item.slug)}
                  moduleTheme="#6d28d9"
                />
              ))
            ) : inApplications ? (
              applicationSections.map((item) => (
                <RailItemWithPopover
                  key={item.slug}
                  item={item}
                  isActive={applicationSection === item}
                  sectionHref={applicationSectionHref(item.slug)}
                  moduleTheme="#2563eb"
                />
              ))
            ) : inAttendance ? (
              visibleAttendanceSections.map((item) => (
                <RailItemWithPopover
                  key={item.slug}
                  item={item}
                  isActive={attendanceSection === item}
                  sectionHref={attendanceSectionHref(item.slug)}
                  moduleTheme="#059669"
                />
              ))
            ) : inPayroll ? (
              payrollSections.map((item) => (
                <RailItemWithPopover
                  key={item.slug}
                  item={item}
                  isActive={payrollSection === item}
                  sectionHref={payrollSectionHref(item.slug)}
                  moduleTheme="#d97706"
                />
              ))
            ) : inAdmin && isAdmin ? (
              adminSections.map((item) => (
                <RailItemWithPopover
                  key={item.slug}
                  item={item}
                  isActive={adminSection === item}
                  sectionHref={adminSectionHref(item.slug)}
                  moduleTheme="#e83e8c"
                />
              ))
            ) : (
              adminRail.map((item) => (
                <RailItemWithPopover
                  key={item.slug}
                  item={item}
                  isActive={pathname.startsWith(item.href)}
                  sectionHref={item.href}
                  moduleTheme={item.color}
                />
              ))
            )
          )}
        </nav>

        {/* 1Office AI Support at bottom of rail */}
        <div style={{ marginTop: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Tooltip title="Trợ lý AI 1Office" placement="right">
            <button
              type="button"
              className="rail-item"
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%', padding: '8px 0' }}
              onClick={() => window.open('https://1office.vn', '_blank')}
            >
              <PortalIcon name="bot" size={20} style={{ color: '#ff7a00' }} />
              <span style={{ fontSize: 10, color: '#ff7a00', fontWeight: 700 }}>AI Support</span>
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* 1Office Topbar Header */}
      <header className="portal-topbar">
        <div className="topbar-title">
          {/* Mobile hamburger button */}
          <button
            type="button"
            className="topbar-mobile-menu-btn"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Mở danh mục ứng dụng"
            title="Mở menu"
          >
            <PortalIcon name="grid" size={20} />
          </button>

          {pathname !== '/' && pathname !== '/hrm/dashboard' ? (
            <>
              <strong style={{ fontSize: 17, color: '#0f172a', fontWeight: 700 }}>
                {pathname.startsWith('/hrm/settings')
                  ? 'Cài đặt nhân sự'
                  : inEmployees
                  ? (employeeSection?.slug === '' ? 'Hồ sơ nhân sự' : employeeSection?.label ?? 'Nhân sự')
                  : inApplications
                  ? (applicationSection?.slug === '' ? 'Danh sách đơn từ' : applicationSection?.label ?? 'Đơn từ')
                  : inAttendance
                  ? (attendanceSection?.slug === '' ? 'Bảng chấm công' : attendanceSection?.label ?? 'Chấm công')
                  : inPayroll
                  ? (payrollSection?.slug === '' ? 'Bảng lương' : payrollSection?.label ?? 'Tiền lương')
                  : inAdmin
                  ? (adminSection?.slug === '' ? 'Danh sách người dùng' : adminSection?.label ?? 'Cài đặt hệ thống')
                  : ''}
              </strong>
              {isAdmin && (
                <>
                  <span className="topbar-divider" />
                  <span className="workspace-label" style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>HRM Workspace</span>
                </>
              )}
            </>
          ) : isAdmin ? (
            <>
              <strong style={{ fontSize: 17, color: '#0f172a', fontWeight: 700 }}>HRM Workspace</strong>
              <span className="topbar-divider" />
              <span className="workspace-label" style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>HRM Workspace</span>
            </>
          ) : null}
        </div>

        <div className="topbar-account" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* 1Office Topbar Action Icons (matching Screenshot 1) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{ color: '#ff7a00', fontWeight: 900, fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
              title="1Office Hệ thống ứng dụng"
            >
              ▲
            </span>
            <Tooltip title="Đánh dấu">
              <BookOutlined style={{ fontSize: 16, color: '#64748b', cursor: 'pointer' }} />
            </Tooltip>
            <Tooltip title="Trang chủ">
              <Link href="/" style={{ color: '#64748b', display: 'flex', alignItems: 'center' }}>
                <HomeOutlined style={{ fontSize: 16 }} />
              </Link>
            </Tooltip>
            <Tooltip title="Tin nhắn">
              <MessageOutlined style={{ fontSize: 16, color: '#64748b', cursor: 'pointer' }} />
            </Tooltip>
          </div>

          <NotificationBell />
          <AccountMenu />
        </div>
      </header>

      <main className="portal-content">{children}</main>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="mobile-bottom-bar" aria-label="Điều hướng di động">
        <Link
          href="/"
          className={'mobile-bottom-item' + (pathname === '/' || pathname === '/hrm/dashboard' ? ' is-active' : '')}
        >
          <PortalIcon name="home" size={20} />
          <span>Trang chủ</span>
        </Link>

        <Link
          href="/hrm/attendance/timesheet"
          className={'mobile-bottom-item' + (pathname.includes('/attendance') && !pathname.includes('/shifts') ? ' is-active' : '')}
        >
          <PortalIcon name="clock" size={20} />
          <span>Chấm công</span>
        </Link>

        <Link
          href="/hrm/attendance/shifts"
          className={'mobile-bottom-item' + (pathname.includes('/shifts') ? ' is-active' : '')}
        >
          <PortalIcon name="calendar" size={20} />
          <span>Phân ca</span>
        </Link>

        <Link
          href="/hrm/employees"
          className={'mobile-bottom-item' + (pathname.startsWith('/hrm/employees') || pathname.startsWith('/hrm/settings') ? ' is-active' : '')}
        >
          <PortalIcon name="users" size={20} />
          <span>Nhân sự</span>
        </Link>

        <button
          type="button"
          className={'mobile-bottom-item' + (mobileDrawerOpen ? ' is-active' : '')}
          onClick={() => setMobileDrawerOpen(true)}
        >
          <PortalIcon name="grid" size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Drawer (Mở toàn bộ danh mục trên điện thoại) */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7056d8, #e83e8c)', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <PortalIcon name="grid" size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>HRM 1Office</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Hệ thống Quản trị Doanh nghiệp</div>
            </div>
          </div>
        }
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        styles={{ wrapper: { width: 'min(320px, 86vw)' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Phân hệ 1: Nhân sự */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              <PortalIcon name="users" size={18} />
              <span>QUẢN LÝ NHÂN SỰ</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 6 }}>
              <Link
                href="/hrm/employees"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Hồ sơ nhân sự</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
              <Link
                href="/hrm/settings/positions"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Sơ đồ tổ chức & Vị trí</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
            </div>
          </div>

          {/* Phân hệ 2: Chấm công & Phân ca */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              <PortalIcon name="clock" size={18} />
              <span>CHẤM CÔNG & PHÂN CA</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 6 }}>
              <Link
                href="/hrm/attendance/timesheet"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Bảng chấm công</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
              <Link
                href="/hrm/attendance/shifts"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Phân ca làm việc</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
              <Link
                href="/hrm/attendance/shift-register"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Đăng ký ca làm</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
              <Link
                href="/hrm/attendance/furlough"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Nghỉ phép & Phép năm</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
            </div>
          </div>

          {/* Phân hệ 3: Đơn từ */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#2563eb', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              <PortalIcon name="file" size={18} />
              <span>QUẢN LÝ ĐƠN TỪ</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 6 }}>
              <Link
                href="/hrm/applications"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Danh sách đơn từ</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
            </div>
          </div>

          {/* Phân hệ 4: Tiền lương */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d97706', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
              <PortalIcon name="wallet" size={18} />
              <span>TIỀN LƯƠNG & PHÚC LỢI</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 6 }}>
              <Link
                href="/hrm/payroll"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Bảng lương</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
              <Link
                href="/hrm/payroll/templates"
                onClick={() => setMobileDrawerOpen(false)}
                style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span>Mẫu bảng lương</span>
                <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
              </Link>
            </div>
          </div>

          {/* Phân hệ 5: Cài đặt hệ thống (Chỉ Admin mới thấy) */}
          {isAdmin && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#e83e8c', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                <PortalIcon name="settings" size={18} />
                <span>CÀI ĐẶT HỆ THỐNG</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 6 }}>
                <Link
                  href="/hrm/admin"
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>Danh sách người dùng</span>
                  <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
                </Link>
                <Link
                  href="/hrm/admin/roles"
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{ fontSize: 13, color: '#334155', padding: '6px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>Phân quyền & Vai trò</span>
                  <PortalIcon name="arrow" size={14} style={{ color: '#94a3b8' }} />
                </Link>
              </div>
            </div>
          )}
        </div>
      </Drawer>

      {/* 8 HRM Apps Launcher Mega Drawer (Desktop) */}
      <Drawer
        title={<span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Ứng dụng doanh nghiệp</span>}
        placement="left"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        styles={{ wrapper: { width: 'min(640px, 100vw)' } }}
      >
        <div className="launcher-heading">
          <div>
            <span className="eyebrow">{isAdmin ? 'QUẢN LÝ DOANH NGHIỆP' : 'KHÔNG GIAN NHÂN SỰ'}</span>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '4px 0 6px' }}>HRM</h2>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              {isAdmin ? 'Quản lý nhân sự trong một không gian liên thông.' : 'Cổng tự phục vụ nhân sự chuẩn 1Office.'}
            </p>
          </div>
          <Tag color={isAdmin ? 'purple' : 'magenta'} style={{ borderRadius: 12, padding: '4px 12px', fontWeight: 600 }}>
            {isAdmin ? '8 chức năng' : 'Chức năng nhân sự'}
          </Tag>
        </div>

        <nav className="module-grid" aria-label="Các chức năng HRM">
          {(isAdmin ? hrmModules : hrmModules.filter(m => m.slug !== 'admin')).map((item) => (
            <Link
              key={item.slug}
              href={'/hrm/' + item.slug}
              className={'module-link' + (activeModule?.slug === item.slug ? ' selected' : '')}
              aria-current={activeModule?.slug === item.slug ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span className="module-icon" style={{ color: item.color, background: item.color + '14' }}>
                <PortalIcon name={item.icon} size={25} />
              </span>
              <span>
                <strong style={{ fontSize: 14, color: '#1e293b' }}>{item.name}</strong>
                <small style={{ fontSize: 11, color: '#64748b' }}>{item.description}</small>
              </span>
              <PortalIcon name="arrow" size={15} />
            </Link>
          ))}
        </nav>
      </Drawer>
    </div>
  );
}
