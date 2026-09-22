'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Tag, Button, Table, Space, Badge, Spin, Modal, Select, Input, Radio, message, App } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  SyncOutlined,
  MobileOutlined,
  EnvironmentOutlined,
  CameraOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface StatsData {
  totalEmployees: number;
  checkedInToday: number;
  onTime: number;
  late: number;
  onLeave: number;
  devices: { id: string; title: string; ipMachine: string; status: string; lastTimeUpdate: string; location: string }[];
  rawLogs: { key: string; emp: string; time: string; mode: string; loc: string; status: string }[];
}

export function AttendanceDashboardScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mobile Checkin Simulator State
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    employeeId: '',
    type: 'CHECK_IN' as 'CHECK_IN' | 'CHECK_OUT',
    date: new Date().toISOString().slice(0, 10),
    verifyMode: 'Khuôn mặt (FaceID) + GPS',
    location: 'GPS: 10.7626, 106.6602 — Tòa nhà 1Office Võ Văn Tần',
  });

  const fetchStats = useCallback(() => {
    setLoading(true);
    apiClient.get('/attendance/stats')
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    // Fetch employee list for mobile checkin simulator
    apiClient.get('/employees?pageSize=100').then((res) => {
      if (res.data?.items) {
        setEmployees(res.data.items);
        if (res.data.items.length > 0) {
          setCheckinForm((f) => ({ ...f, employeeId: res.data.items[0].id }));
        }
      }
    }).catch(() => {});
  }, [fetchStats]);

  const handleMobileCheckIn = async () => {
    if (!checkinForm.employeeId) {
      message.warning('Vui lòng chọn nhân viên dập thẻ.');
      return;
    }
    setSubmittingCheckin(true);
    try {
      const res = await apiClient.post('/attendance/checkin', checkinForm);
      message.success(res.data?.message || 'Dập thẻ thành công!');
      setMobileModalOpen(false);
      fetchStats();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi dập thẻ.');
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const checkinPercent = stats && stats.totalEmployees > 0
    ? Math.round((stats.checkedInToday / stats.totalEmployees) * 1000) / 10
    : 0;

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            HRM / Chấm công
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: '#0f172a' }}>
            ⏰ Dashboard Tổng quan Tình hình Chấm công
          </h1>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<MobileOutlined />}
            style={{ background: '#7c3aed', borderColor: '#7c3aed', fontWeight: 600 }}
            onClick={() => setMobileModalOpen(true)}
          >
            📱 Giả lập Dập thẻ Mobile (GPS / FaceID)
          </Button>
          <Link href="/hrm/attendance/timekeep">
            <Button icon={<ClockCircleOutlined />}>Bảng chấm công</Button>
          </Link>
          <Link href="/hrm/attendance/meal">
            <Button icon={<CalendarOutlined />}>Bảng công ăn</Button>
          </Link>
          <Button type="primary" icon={<SyncOutlined />} style={{ background: '#059669', borderColor: '#059669' }} onClick={fetchStats}>
            Đồng bộ máy chấm
          </Button>
        </Space>
      </div>

      <Spin spinning={loading} description="Đang tải dữ liệu...">
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #ecfdf5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Tỷ lệ Check-in Hôm nay</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 4 }}>{checkinPercent}%</div>
                <span style={{ fontSize: 11, color: '#059669' }}>{stats?.checkedInToday ?? 0} / {stats?.totalEmployees ?? 0} nhân sự đã dập thẻ</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'grid', placeItems: 'center', color: '#059669' }}>
                <CheckCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #eff6ff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Đúng giờ (≤ 5 phút ân hạn)</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>{stats?.onTime ?? 0} người</div>
                <span style={{ fontSize: 11, color: '#2563eb' }}>Tuân thủ quy định ca</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'grid', placeItems: 'center', color: '#2563eb' }}>
                <ClockCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #fffbe6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Đi muộn / Về sớm</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706', marginTop: 4 }}>{stats?.late ?? 0} người</div>
                <span style={{ fontSize: 11, color: '#d97706' }}>Đi muộn sau phút ân hạn</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#d97706' }}>
                <ExclamationCircleOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #f5f3ff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Nghỉ phép / Công tác</span>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#6d28d9', marginTop: 4 }}>{stats?.onLeave ?? 0} người</div>
                <span style={{ fontSize: 11, color: '#6d28d9' }}>Đã có đơn duyệt chuẩn</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0edff', display: 'grid', placeItems: 'center', color: '#6d28d9' }}>
                <CalendarOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          {/* Realtime Raw Log Feed */}
          <Card title="📑 Nhật ký Check-in gần đây (Dữ liệu từ máy chấm công & Mobile GPS)" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {stats?.rawLogs && stats.rawLogs.length > 0 ? (
              <Table
                dataSource={stats.rawLogs}
                columns={[
                  { title: 'STT', key: 'stt', width: 50, align: 'center' as const, render: (_: any, __: any, index: number) => index + 1 },
                  { title: 'Nhân sự', dataIndex: 'emp', key: 'emp', render: (e: string) => <strong style={{ color: '#0f172a' }}>{e}</strong> },
                  { title: 'Thời gian', dataIndex: 'time', key: 'time', render: (t: string) => <Tag color="green" style={{ fontFamily: 'monospace' }}>{t}</Tag> },
                  { title: 'Phương thức', dataIndex: 'mode', key: 'mode' },
                  { title: 'Địa điểm / Thiết bị', dataIndex: 'loc', key: 'loc', render: (l: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{l}</span> },
                  { title: 'Đánh giá', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'Đúng giờ' ? 'green' : 'orange'}>{s}</Tag> },
                ]}
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                Chưa có dữ liệu chấm công hôm nay. Vui lòng bấm "📱 Giả lập Dập thẻ Mobile" hoặc Đồng bộ máy chấm.
              </div>
            )}
          </Card>

          {/* Device Status Grid */}
          <Card title="📟 Trạng thái Máy chấm công & App Mobile" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: 13, color: '#166534' }}>📱 1Office App Mobile (GPS/Wifi)</strong>
                  <Badge status="success" text="Hoạt động" />
                </div>
                <span style={{ fontSize: 11, color: '#15803d' }}>
                  Hỗ trợ Check-in qua GPS định vị & Nhận diện khuôn mặt FaceID
                </span>
              </div>
              {stats?.devices && stats.devices.length > 0 ? (
                stats.devices.map((d) => (
                  <div key={d.id} style={{ padding: 12, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13 }}>{d.title}</strong>
                      <Badge
                        status={d.status === 'ONLINE' ? 'success' : d.status === 'OFFLINE' ? 'error' : 'processing'}
                        text={d.status === 'ONLINE' ? 'Online' : d.status === 'OFFLINE' ? 'Offline' : 'Connecting'}
                      />
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      IP: {d.ipMachine || '—'} | Cập nhật: {d.lastTimeUpdate || '—'}
                    </span>
                  </div>
                ))
              ) : null}
            </div>
          </Card>
        </div>
      </Spin>

      {/* Modal Giả lập Dập Thẻ Mobile */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9' }}>
            <MobileOutlined style={{ fontSize: 20 }} />
            <span>📱 Giả lập Dập thẻ Mobile 1Office (Check-in / Check-out GPS)</span>
          </div>
        }
        open={mobileModalOpen}
        onOk={handleMobileCheckIn}
        onCancel={() => setMobileModalOpen(false)}
        mask={{ closable: false }}
        okText=" Thao tác Dập Thẻ trên Điện Thoại"
        cancelText="Hủy"
        confirmLoading={submittingCheckin}
        okButtonProps={{ style: { background: '#7c3aed', borderColor: '#7c3aed', height: 40, fontWeight: 600 } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 12 }}>
          {/* Mobile phone mockup frame effect */}
          <div style={{ background: '#1e1b4b', padding: 16, borderRadius: 16, color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: 1 }}>1OFFICE MOBILE CHECK-IN SIMULATOR</div>
            <div style={{ fontSize: 22, fontWeight: 700, margin: '6px 0 2px' }}>
              {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: 12, color: '#c7d2fe' }}>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              👤 Nhân viên thực hiện dập thẻ (*):
            </label>
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn nhân viên..."
              value={checkinForm.employeeId || undefined}
              onChange={(val) => setCheckinForm({ ...checkinForm, employeeId: val })}
              options={employees.map((e) => ({
                value: e.id,
                label: `${e.name} (${e.code}) — ${e.department?.name || 'Chưa xếp phòng'}`,
              }))}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              ⏱️ Thao tác Dập thẻ (*):
            </label>
            <Radio.Group
              value={checkinForm.type}
              onChange={(e) => setCheckinForm({ ...checkinForm, type: e.target.value })}
              buttonStyle="solid"
              style={{ width: '100%' }}
            >
              <Radio.Button value="CHECK_IN" style={{ width: '50%', textAlign: 'center', background: checkinForm.type === 'CHECK_IN' ? '#16a34a' : undefined }}>
                🟢 Check-in VÀO Ca
              </Radio.Button>
              <Radio.Button value="CHECK_OUT" style={{ width: '50%', textAlign: 'center', background: checkinForm.type === 'CHECK_OUT' ? '#dc2626' : undefined }}>
                🔴 Check-out RA Ca
              </Radio.Button>
            </Radio.Group>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <CameraOutlined style={{ marginRight: 4 }} /> Phương thức xác thực (*):
            </label>
            <Select
              style={{ width: '100%' }}
              value={checkinForm.verifyMode}
              onChange={(val) => setCheckinForm({ ...checkinForm, verifyMode: val })}
              options={[
                { value: 'Khuôn mặt (FaceID) + GPS', label: '📸 Khuôn mặt (FaceID AI) + Định vị GPS' },
                { value: 'Wifi Công Ty 1Office_5G', label: '📶 Kết nối Wifi Văn Phòng (1Office_5G)' },
                { value: 'GPS Bán kính 50m', label: '📍 Vị trí GPS chuẩn (Bán kính 50m)' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} /> Tọa độ GPS / Địa điểm dập thẻ:
            </label>
            <Input
              value={checkinForm.location}
              onChange={(e) => setCheckinForm({ ...checkinForm, location: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
