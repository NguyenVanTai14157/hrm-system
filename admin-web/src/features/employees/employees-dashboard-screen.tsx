'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Progress, Table, Space, Spin, Alert } from 'antd';
import {
  UserOutlined,
  UserAddOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  FileTextOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export function EmployeesDashboardScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/employees/stats');
      if (res.data) setStats(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu dashboard';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
          <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={loading}>
            Làm mới
          </Button>
          <Link href="/hrm/employees">
            <Button icon={<UserOutlined />}>Danh sách nhân sự</Button>
          </Link>
          <Button type="primary" icon={<UserAddOutlined />} style={{ background: '#6d28d9', borderColor: '#6d28d9' }}>
            + Thêm hồ sơ mới
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 16 }}
          action={<Button size="small" onClick={fetchStats}>Thử lại</Button>}
        />
      )}

      {loading && !stats && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#64748b' }}>Đang tải dữ liệu...</div>
        </div>
      )}

      {!loading && !stats && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          Không có dữ liệu
        </div>
      )}

      {stats && (
        <>
          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
            <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #f5f3ff)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Tổng số nhân sự</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#6d28d9', marginTop: 4 }}>{stats.total} người</div>
                  <span style={{ fontSize: 11, color: '#10b981' }}>↑ +{stats.onboardingThisMonth} người trong tháng này</span>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0edff', display: 'grid', placeItems: 'center', color: '#6d28d9' }}>
                  <UserOutlined style={{ fontSize: 20 }} />
                </div>
              </div>
            </Card>

            <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #ecfdf5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Nhân viên đang làm việc</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 4 }}>{stats.working} người</div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    Chiếm {stats.total > 0 ? Math.round((stats.working / stats.total) * 100) : 0}% toàn bộ nhân sự
                  </span>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'grid', placeItems: 'center', color: '#059669' }}>
                  <CheckCircleOutlined style={{ fontSize: 20 }} />
                </div>
              </div>
            </Card>

            <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #fffbe6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Đang thử việc / Tạm nghỉ</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 4 }}>{stats.temporary} người</div>
                  <span style={{ fontSize: 11, color: '#d97706' }}>Nghỉ tạm thời</span>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#d97706' }}>
                  <FieldTimeOutlined style={{ fontSize: 20 }} />
                </div>
              </div>
            </Card>

            <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #eff6ff)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Vào làm tháng này</span>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{stats.onboardingThisMonth} người</div>
                  <span style={{ fontSize: 11, color: '#2563eb' }}>Nhân sự mới trong tháng hiện tại</span>
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
                {stats.departmentBreakdown && stats.departmentBreakdown.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {stats.departmentBreakdown
                      .sort((a: any, b: any) => b.count - a.count)
                      .slice(0, 8)
                      .map((dept: any, idx: number) => {
                        const colors = ['#6d28d9', '#2563eb', '#059669', '#e83e8c', '#d97706', '#0891b2', '#7c3aed', '#dc2626'];
                        const percent = stats.total > 0 ? Math.round((dept.count / stats.total) * 100) : 0;
                        return (
                          <div key={dept.id || idx}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                              <span><strong>{dept.name}</strong></span>
                              <span style={{ color: '#64748b' }}>{dept.count} người ({percent}%)</span>
                            </div>
                            <Progress percent={percent} strokeColor={colors[idx % colors.length]} showInfo={false} />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                    Chưa có dữ liệu phân bổ phòng ban
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Seniority Breakdown */}
              <Card title="🏆 Cơ cấu Thâm niên Công tác" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
                {stats.seniorityBreakdown && stats.seniorityBreakdown.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {stats.seniorityBreakdown.map((item: any, idx: number) => {
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
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                    Chưa có dữ liệu thâm niên
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
