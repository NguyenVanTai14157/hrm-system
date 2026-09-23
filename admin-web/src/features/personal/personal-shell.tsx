'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer, Modal, Button, message, Spin, Tag } from 'antd';
import {
  AppstoreOutlined,
  UserOutlined,
  PlusCircleOutlined,
  BookOutlined,
  BellOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  KeyOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient, logout } from '@/lib/api-client';
import { TopSystemMenuDrawer, BottomCategoryDrawer } from './personal-menu-drawer';
import { PersonalGpsPunchModal } from './personal-gps-punch-modal';
import './personal.css';

interface PersonalShellProps {
  children: React.ReactNode;
  title?: string;
}

export function PersonalShell({ children, title }: PersonalShellProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [systemMenuOpen, setSystemMenuOpen] = useState(false);
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [gpsModalOpen, setGpsModalOpen] = useState(false);

  const displayName = user?.displayName || user?.username || 'Nhân viên';
  const initial = (displayName[0] || 'T').toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch {
      router.replace('/login');
    }
  };

  let pageTitle = 'HRM';
  if (pathname?.includes('/attendance/gps')) pageTitle = 'Chấm công GPS/Wifi';
  else if (pathname?.includes('/attendance')) pageTitle = 'Bảng công';
  else if (pathname?.includes('/payroll')) pageTitle = 'Bảng lương';
  else if (pathname?.includes('/profile')) pageTitle = 'Hồ sơ nhân sự';
  else if (pathname?.includes('/requests')) pageTitle = 'Đơn từ & Đề xuất';
  else if (pathname?.includes('/social')) pageTitle = 'Mạng nội bộ';
  else if (pathname?.includes('/documents')) pageTitle = 'Tài liệu';
  else if (pathname?.includes('/contracts')) pageTitle = 'Ký số';
  else if (pathname?.includes('/calendar')) pageTitle = 'Lịch biểu';

  return (
    <div className="personal-mobile-container">
      {/* ── Top Header ── */}
      <header className="personal-top-header">
        <div className="personal-top-left">
          <button
            className="personal-top-btn"
            onClick={() => setSystemMenuOpen(true)}
            aria-label="Menu phân hệ"
          >
            <AppstoreOutlined />
          </button>
          <span className="personal-top-title">{title || pageTitle}</span>
        </div>
        <div className="personal-top-right">
          <button className="personal-top-btn" aria-label="Đánh dấu">
            <BookOutlined />
          </button>
          <button className="personal-top-btn" aria-label="Thông báo">
            <BellOutlined />
          </button>
          <Link
            href="/me"
            className="personal-top-btn home"
            aria-label="Trang chủ"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ef4444',
              borderRadius: 8,
              width: 32,
              height: 32,
            }}
          >
            <HomeOutlined style={{ fontSize: 16, color: '#ffffff' }} />
          </Link>
        </div>
      </header>

      {/* ── Main Page Content ── */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* ── Bottom Navigation Bar ── */}
      <nav className="personal-bottom-nav">
        <button
          className={`personal-nav-item ${categoryDrawerOpen ? 'active' : ''}`}
          onClick={() => setCategoryDrawerOpen(true)}
        >
          <span className="personal-nav-icon">
            <AppstoreOutlined />
          </span>
          <span className="personal-nav-label">Danh mục</span>
        </button>

        <button
          className="personal-nav-item"
          onClick={() => setGpsModalOpen(true)}
        >
          <span className="personal-nav-icon" style={{ color: '#0284c7' }}>
            <PlusCircleOutlined style={{ fontSize: 24 }} />
          </span>
          <span className="personal-nav-label">Tác vụ +</span>
        </button>

        <button
          className={`personal-nav-item ${actionSheetOpen ? 'active' : ''}`}
          onClick={() => setActionSheetOpen(true)}
        >
          <span className="personal-nav-avatar-circle">{initial}</span>
          <span className="personal-nav-label">Cá nhân</span>
        </button>
      </nav>

      {/* ── 1. Top System Menu Drawer (Menu 5 phân hệ lớn ở Header trên) ── */}
      <TopSystemMenuDrawer
        open={systemMenuOpen}
        onClose={() => setSystemMenuOpen(false)}
      />

      {/* ── 2. Bottom Category Drawer (Danh mục HRM ở thanh điều hướng dưới) ── */}
      <BottomCategoryDrawer
        open={categoryDrawerOpen}
        onClose={() => setCategoryDrawerOpen(false)}
      />

      {/* ── Action Sheet (Menu Cá nhân chuẩn 1Office) ── */}
      <Drawer
        placement="bottom"
        height={440}
        open={actionSheetOpen}
        onClose={() => setActionSheetOpen(false)}
        styles={{
          wrapper: { maxWidth: 480, margin: '0 auto' },
          body: { padding: '16px 16px 28px 16px', overflow: 'hidden' },
        }}
      >
        <div className="personal-action-sheet-header">
          <div className="personal-action-sheet-avatar">{initial}</div>
          <div className="personal-action-sheet-info">
            <div className="personal-action-sheet-name">{displayName}</div>
            <div className="personal-action-sheet-sub">
              Tài khoản: <strong>{user?.username}</strong>
            </div>
          </div>
        </div>

        <div className="personal-drawer-content">
          <Link
            href="/me/profile"
            className="personal-menu-item"
            onClick={() => setActionSheetOpen(false)}
          >
            <span className="personal-menu-icon">
              <UserOutlined style={{ color: '#0284c7' }} />
            </span>
            <span>Hồ sơ cá nhân</span>
          </Link>

          <Link
            href="/me/attendance/gps"
            className="personal-menu-item"
            onClick={() => setActionSheetOpen(false)}
          >
            <span className="personal-menu-icon">
              <EnvironmentOutlined style={{ color: '#10b981' }} />
            </span>
            <span>Chấm công GPS/Wifi</span>
          </Link>

          <Link
            href="/me/requests"
            className="personal-menu-item"
            onClick={() => setActionSheetOpen(false)}
          >
            <span className="personal-menu-icon">
              <BookOutlined style={{ color: '#8b5cf6' }} />
            </span>
            <span>Đơn từ & Đề xuất</span>
          </Link>

          <Link
            href="/change-password"
            className="personal-menu-item"
            onClick={() => setActionSheetOpen(false)}
          >
            <span className="personal-menu-icon">
              <KeyOutlined style={{ color: '#f59e0b' }} />
            </span>
            <span>Đổi mật khẩu</span>
          </Link>

          <button className="personal-menu-item danger" onClick={handleLogout}>
            <span className="personal-menu-icon">
              <LogoutOutlined />
            </span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </Drawer>

      {/* ── Quick GPS Check-In Modal ── */}
      <PersonalGpsPunchModal
        open={gpsModalOpen}
        onClose={() => setGpsModalOpen(false)}
      />
    </div>
  );
}
