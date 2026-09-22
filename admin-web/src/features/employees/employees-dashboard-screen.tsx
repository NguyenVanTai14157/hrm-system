'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Progress, Table, Space, Avatar } from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  IdcardOutlined,
  CrownOutlined,
  GiftOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import Link from 'next/link';

export function EmployeesDashboardScreen() {
  const [stats, setStats] = useState<any>({
    total: 28,
    working: 22,
    temporary: 4,
    onboardingThisMonth: 3,
    contractRenewals: 2,
    departmentBreakdown: [
      { id: '1', name: 'KHO HÀNG', count: 9 },
      { id: '2', name: 'MARKETING & TRUYỀN THÔNG', count: 6 },
      { id: '3', name: 'CỬA HÀNG 126 NGUYỄN THỊ MINH KHAI', count: 5 },
      { id: '4', name: 'KIỂM SOÁT NỘI BỘ (KSNB)', count: 4 },
      { id: '5', name: 'BAN GIÁM ĐỐC & HÀNH CHÍNH', count: 4 },
    ],
  });

  useEffect(() => {
    fetch('http://localhost:3002/api/employees/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.total) setStats(data);
      })
      .catch(() => {});
  }, []);
  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Top Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            HRM / Nhân sự
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: '#0f172a' }}>
            👥 Dashboard Tổng quan Hồ sơ Nhân sự
          </h1>
        </div>
        <Space>
          <Link href="/hrm/employees">
            <Button icon={<UserOutlined />}>Danh sách nhân sự</Button>
          </Link>
          <Button type="primary" icon={<UserAddOutlined />} style={{ background: '#6d28d9', borderColor: '#6d28d9' }}>
            + Thêm hồ sơ mới
          </Button>
        </Space>
      </div>

      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #f5f3ff)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Tổng số nhân sự</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#6d28d9', marginTop: 4 }}>28 người</div>
              <span style={{ fontSize: 11, color: '#10b981' }}>↑ +3 người trong tháng này</span>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0edff', display: 'grid', placeItems: 'center', color: '#6d28d9' }}>
              <UserOutlined style={{ fontSize: 20 }} />
            </div>
          </div>
        </Card>

        <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #ecfdf5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Nhân viên chính thức</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 4 }}>22 người</div>
              <span style={{ fontSize: 11, color: '#64748b' }}>Chiếm 78.5% toàn bộ nhân sự</span>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'grid', placeItems: 'center', color: '#059669' }}>
              <CheckCircleOutlined style={{ fontSize: 20 }} />
            </div>
          </div>
        </Card>

        <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #fffbe6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Đang thử việc</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 4 }}>4 người</div>
              <span style={{ fontSize: 11, color: '#d97706' }}>2 người sắp hết hạn thử việc</span>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#d97706' }}>
              <FieldTimeOutlined style={{ fontSize: 20 }} />
            </div>
          </div>
        </Card>

        <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #eff6ff)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Hợp đồng sắp hết hạn</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>2 HĐLĐ</div>
              <span style={{ fontSize: 11, color: '#2563eb' }}>Cần ký lại trong 30 ngày</span>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'grid', placeItems: 'center', color: '#2563eb' }}>
              <FileTextOutlined style={{ fontSize: 20 }} />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Department Distribution */}
          <Card title="🏢 Cơ cấu Nhân sự theo Phòng ban & Chi nhánh" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span><strong>KHO HÀNG (Kho Tổng Hòa Cầm)</strong></span>
                  <span style={{ color: '#64748b' }}>9 người (32%)</span>
                </div>
                <Progress percent={32} strokeColor="#6d28d9" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span><strong>MARKETING & TRUYỀN THÔNG</strong></span>
                  <span style={{ color: '#64748b' }}>6 người (21%)</span>
                </div>
                <Progress percent={21} strokeColor="#2563eb" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span><strong>CỬA HÀNG 126 NGUYỄN THỊ MINH KHAI</strong></span>
                  <span style={{ color: '#64748b' }}>5 người (18%)</span>
                </div>
                <Progress percent={18} strokeColor="#059669" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span><strong>KIỂM SOÁT NỘI BỘ (KSNB)</strong></span>
                  <span style={{ color: '#64748b' }}>4 người (14%)</span>
                </div>
                <Progress percent={14} strokeColor="#e83e8c" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span><strong>BAN GIÁM ĐỐC & HÀNH CHÍNH</strong></span>
                  <span style={{ color: '#64748b' }}>4 người (14%)</span>
                </div>
                <Progress percent={14} strokeColor="#d97706" showInfo={false} />
              </div>
            </div>
          </Card>

          {/* Contract Renewal List */}
          <Card title="📑 Hợp đồng Lao động Sắp hết hạn (Cần tái ký)" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <Table
              dataSource={[
                { key: '1', code: 'NV0099', name: 'Nguyễn Trần Nam Anh', dept: 'KHO HÀNG', type: 'HĐLĐ Xác định thời hạn 1 năm', expire: '2026-10-15', status: 'Còn 26 ngày' },
                { key: '2', code: 'NV0102', name: 'Nguyễn Thị Phúc Thảo', dept: 'KHO HÀNG', type: 'HĐLĐ Thử việc 2 tháng', expire: '2026-09-30', status: 'Còn 11 ngày' },
              ]}
              columns={[
                { title: 'STT', key: 'stt', width: 50, align: 'center', render: (_: any, __: any, index: number) => index + 1 },
                { title: 'Mã NV', dataIndex: 'code', key: 'code', render: (c) => <strong style={{ color: '#2563eb' }}>{c}</strong> },
                { title: 'Họ tên', dataIndex: 'name', key: 'name', render: (n) => <strong>{n}</strong> },
                { title: 'Phòng ban', dataIndex: 'dept', key: 'dept' },
                { title: 'Loại HĐLĐ', dataIndex: 'type', key: 'type' },
                { title: 'Ngày hết hạn', dataIndex: 'expire', key: 'expire', render: (d) => <Tag color="orange">{d}</Tag> },
                { title: 'Thao tác', key: 'act', render: () => <Button type="link" size="small">Tái ký HĐ</Button> },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Upcoming Birthdays */}
          <Card title="🎂 Sinh nhật trong tháng 9" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff0f5' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #fbcfe8' }}>
                <Avatar style={{ backgroundColor: '#e83e8c' }}>N</Avatar>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13, display: 'block' }}>Nguyễn Thị Kim Nhi</strong>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Sinh nhật: 24/09/1995 (KSNB)</span>
                </div>
                <Tag color="magenta">24/09</Tag>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#ffffff', borderRadius: 8, border: '1px solid #fbcfe8' }}>
                <Avatar style={{ backgroundColor: '#2563eb' }}>Đ</Avatar>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 13, display: 'block' }}>Ngô Minh Đức</strong>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Sinh nhật: 28/09/1998 (MKT)</span>
                </div>
                <Tag color="magenta">28/09</Tag>
              </div>
            </div>
          </Card>

          {/* Seniority Pie Chart Widget */}
          <Card title="🏆 Cơ cấu Thâm niên Công tác (Seniority Breakdown)" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(stats.seniorityBreakdown || [
                { label: 'Dưới 1 năm (<12 tháng)', count: 8, percent: 29 },
                { label: 'Từ 1 - 3 năm (12-36 tháng)', count: 12, percent: 43 },
                { label: 'Từ 3 - 5 năm (36-60 tháng)', count: 5, percent: 18 },
                { label: 'Trên 5 năm (>60 tháng)', count: 3, percent: 10 },
              ]).map((item: any, idx: number) => {
                const colors = ['#6d28d9', '#2563eb', '#059669', '#d97706'];
                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span>{item.label}</span>
                      <strong>{item.count} người ({item.percent}%)</strong>
                    </div>
                    <Progress percent={item.percent} strokeColor={colors[idx % 4]} showInfo={false} size="small" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
