'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Progress, Space, Avatar, Spin, message } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface StatsData {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  pendingItems: {
    id: string;
    type: string;
    reason: string;
    createdAt: string;
    payload: any;
    employee: { id: string; code: string; name: string };
  }[];
}

const avatarColors = ['#2563eb', '#6d28d9', '#059669', '#d97706', '#e83e8c', '#0ea5e9'];

export function ApplicationsDashboardScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applications/stats');
      if (res.data) setStats(res.data);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  const approveRate = stats && stats.total > 0
    ? Math.round((stats.approved / stats.total) * 1000) / 10
    : 0;

  const rejectedRate = stats && stats.total > 0
    ? Math.round((stats.rejected / stats.total) * 1000) / 10
    : 0;

  const handleQuickApprove = async (id: string) => {
    try {
      await apiClient.patch(`/applications/${id}/approve`, {});
      message.success('Đã duyệt đơn thành công');
      void fetchStats();
    } catch (err) {
      message.error('Không thể duyệt đơn');
    }
  };

  const handleBypassApprove = async (id: string) => {
    try {
      await apiClient.patch(`/applications/${id}/approve`, { isBypass: true, comment: 'Duyệt vượt cấp bởi Admin/HR' });
      message.success('⚡ Đã duyệt vượt cấp thành công! Đơn chuyển thẳng sang ĐÃ DUYỆT');
      void fetchStats();
    } catch (err) {
      message.error('Không thể thực hiện duyệt vượt cấp');
    }
  };

  const handleQuickReject = async (id: string) => {
    try {
      await apiClient.patch(`/applications/${id}/reject`, { comment: 'Từ chối nhanh từ Dashboard' });
      message.success('Đã từ chối đơn');
      void fetchStats();
    } catch (err) {
      message.error('Không thể từ chối đơn');
    }
  };

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            HRM / Đơn từ
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: '#0f172a' }}>
            📋 Dashboard Tổng quan Quản lý Đơn từ
          </h1>
        </div>
        <Space>
          <Link href="/hrm/applications">
            <Button icon={<FileTextOutlined />}>Danh sách đơn từ</Button>
          </Link>
          <Link href="/hrm/applications">
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#2563eb', borderColor: '#2563eb' }}>
              + Tạo đơn từ mới
            </Button>
          </Link>
        </Space>
      </div>

      <Spin spinning={loading} description="Đang tải dữ liệu...">
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #eff6ff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Tổng đơn trong hệ thống</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{stats?.total ?? 0} đơn</div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Dữ liệu từ Database</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'grid', placeItems: 'center', color: '#2563eb' }}>
                <FileTextOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #fffbe6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Đơn chờ duyệt</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 4 }}>{stats?.pending ?? 0} đơn</div>
                <span style={{ fontSize: 11, color: '#d97706' }}>Cần xử lý</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#d97706' }}>
                <ClockCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #ecfdf5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Đã phê duyệt</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 4 }}>{stats?.approved ?? 0} đơn</div>
                <span style={{ fontSize: 11, color: '#059669' }}>Tỷ lệ duyệt {approveRate}%</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'grid', placeItems: 'center', color: '#059669' }}>
                <CheckCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #fff0f5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Từ chối / Hủy</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#e83e8c', marginTop: 4 }}>{stats?.rejected ?? 0} đơn</div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Chiếm {rejectedRate}%</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ffe4e6', display: 'grid', placeItems: 'center', color: '#e83e8c' }}>
                <CloseCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Pending Approval Cards — data from API */}
          <Card title={`⏳ Đơn chờ duyệt (${stats?.pendingItems?.length ?? 0} đơn gần nhất)`} size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats?.pendingItems && stats.pendingItems.length > 0 ? (
                stats.pendingItems.map((item, idx) => (
                  <div key={item.id} style={{ padding: 14, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar style={{ backgroundColor: avatarColors[idx % avatarColors.length] }}>
                        {item.employee.name.charAt(item.employee.name.length - 1)}
                      </Avatar>
                      <div>
                        <strong style={{ fontSize: 14, color: '#0f172a' }}>{item.employee.name}</strong>
                        <span style={{ fontSize: 12, color: '#64748b', display: 'block' }}>
                          Loại đơn: <Tag color="blue">{item.type}</Tag>
                          {item.reason && <> | Lý do: {item.reason}</>}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                          Ngày tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <Space>
                      <Button
                        size="small"
                        type="primary"
                        icon={<CheckOutlined />}
                        style={{ background: '#059669', borderColor: '#059669' }}
                        onClick={() => void handleQuickApprove(item.id)}
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                        onClick={() => void handleBypassApprove(item.id)}
                        title="Tài khoản Admin / HR Admin duyệt thẳng chốt đơn không qua cấp 1"
                      >
                        ⚡ Duyệt vượt cấp
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => void handleQuickReject(item.id)}
                      >
                        Từ chối
                      </Button>
                    </Space>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  🎉 Không có đơn nào đang chờ duyệt. Tuyệt vời!
                </div>
              )}
            </div>
          </Card>

          {/* Application Distribution — dynamic from stats */}
          <Card title="📊 Tỷ lệ phê duyệt" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Đã duyệt</span>
                  <strong>{stats?.approved ?? 0} đơn ({approveRate}%)</strong>
                </div>
                <Progress percent={approveRate} strokeColor="#059669" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Chờ duyệt</span>
                  <strong>{stats?.pending ?? 0} đơn</strong>
                </div>
                <Progress
                  percent={stats && stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}
                  strokeColor="#d97706"
                  showInfo={false}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Từ chối / Hủy</span>
                  <strong>{stats?.rejected ?? 0} đơn ({rejectedRate}%)</strong>
                </div>
                <Progress percent={rejectedRate} strokeColor="#e83e8c" showInfo={false} />
              </div>
            </div>
          </Card>
        </div>
      </Spin>
    </div>
  );
}
