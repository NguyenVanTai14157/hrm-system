'use client';

import React from 'react';
import Link from 'next/link';
import { Drawer } from 'antd';
import {
  CommentOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  RightOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';

// ── 1. Top System Menu Drawer (Bấm nút 4 ô vuông ở Header trên cùng) ──
interface TopSystemMenuDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function TopSystemMenuDrawer({ open, onClose }: TopSystemMenuDrawerProps) {
  const systemModules = [
    {
      key: 'social',
      label: 'Mạng nội bộ',
      desc: 'Bảng tin & Thông báo công ty',
      href: '/me/social',
      icon: <CommentOutlined style={{ fontSize: 24, color: '#0284c7' }} />,
      bg: '#e0f2fe',
    },
    {
      key: 'documents',
      label: 'Tài liệu',
      desc: 'Kho văn bản & Biểu mẫu',
      href: '/me/documents',
      icon: <FolderOpenOutlined style={{ fontSize: 24, color: '#f59e0b' }} />,
      bg: '#fef3c7',
    },
    {
      key: 'contracts',
      label: 'Ký số',
      desc: 'Hợp đồng & Ký số OTP',
      href: '/me/contracts',
      icon: <SafetyCertificateOutlined style={{ fontSize: 24, color: '#10b981' }} />,
      bg: '#dcfce7',
    },
    {
      key: 'calendar',
      label: 'Lịch biểu',
      desc: 'Lịch họp & Sự kiện',
      href: '/me/calendar',
      icon: <CalendarOutlined style={{ fontSize: 24, color: '#8b5cf6' }} />,
      bg: '#ede9fe',
    },
    {
      key: 'requests',
      label: 'Đơn từ',
      desc: '10 loại đơn từ & Luồng duyệt',
      href: '/me/requests',
      icon: <FileDoneOutlined style={{ fontSize: 24, color: '#ef4444' }} />,
      bg: '#fee2e2',
    },
  ];

  return (
    <Drawer
      title="Menu chức năng (1Office)"
      placement="top"
      height={500}
      onClose={onClose}
      open={open}
      styles={{
        wrapper: { maxWidth: 480, margin: '0 auto' },
        body: { padding: '16px 16px 24px 16px', overflow: 'hidden' },
        header: { padding: '14px 20px', borderBottom: '1px solid #f3f4f6' },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {systemModules.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              background: '#f8fafc',
              borderRadius: 10,
              border: '1px solid #f1f5f9',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  {item.desc}
                </div>
              </div>
            </div>
            <RightOutlined style={{ fontSize: 12, color: '#94a3b8' }} />
          </Link>
        ))}
      </div>
    </Drawer>
  );
}

// ── 2. Bottom Category Drawer (Bấm nút "Danh mục" ở Bottom Nav) ──
interface BottomCategoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function BottomCategoryDrawer({ open, onClose }: BottomCategoryDrawerProps) {
  const hrmFeatures = [
    {
      key: 'gps',
      label: 'Chấm công GPS/Wifi',
      desc: 'Điểm danh tọa độ GPS và mạng Wifi công ty',
      href: '/me/attendance/gps',
      icon: <EnvironmentOutlined style={{ color: '#ff5722', fontSize: 20 }} />,
      bg: '#ffedd5',
    },
    {
      key: 'attendance',
      label: 'Bảng công',
      desc: 'Xem công & Chi tiết chấm công tháng',
      href: '/me/attendance',
      icon: <ClockCircleOutlined style={{ color: '#0284c7', fontSize: 20 }} />,
      bg: '#e0f2fe',
    },
    {
      key: 'payroll',
      label: 'Bảng lương',
      desc: 'Phiếu lương & Thu nhập thực nhận (Net)',
      href: '/me/payroll',
      icon: <DollarOutlined style={{ color: '#10b981', fontSize: 20 }} />,
      bg: '#dcfce7',
    },
    {
      key: 'profile',
      label: 'Hồ sơ nhân sự',
      desc: 'Thông tin chung & Sơ yếu lý lịch cá nhân',
      href: '/me/profile',
      icon: <UserOutlined style={{ color: '#6366f1', fontSize: 20 }} />,
      bg: '#ede9fe',
    },
  ];

  return (
    <Drawer
      title="Danh mục HRM"
      placement="bottom"
      height={340}
      onClose={onClose}
      open={open}
      styles={{
        wrapper: { maxWidth: 480, margin: '0 auto' },
        body: { padding: '16px 16px 28px 16px', overflow: 'hidden' },
        header: { padding: '16px 20px', borderBottom: '1px solid #f3f4f6' },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {hrmFeatures.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            onClick={onClose}
            className="personal-menu-item"
            style={{ padding: '14px 16px' }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1e293b' }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {item.desc}
              </div>
            </div>
            <RightOutlined style={{ fontSize: 12, color: '#cbd5e1' }} />
          </Link>
        ))}
      </div>
    </Drawer>
  );
}
