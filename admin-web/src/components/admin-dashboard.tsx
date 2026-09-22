'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Tag, Button, Avatar, Select, Space, Spin, App, Tooltip, Badge, Modal } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  FolderOutlined,
  RightOutlined,
  LeftOutlined,
  MinusOutlined,
  PlusOutlined,
  EnvironmentOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ExclamationOutlined
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import { useAuth } from './auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';
import { PortalIcon } from './portal-icon';

interface ApplicationItem {
  id: string;
  code: string;
  type: string;
  employeeId?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  reason?: string;
  currentStep?: number;
  totalSteps?: number;
  currentApproverName?: string;
  payload?: any;
  applicant?: {
    id: string;
    code: string;
    name: string;
    department?: string;
    position?: string;
  };
  employee?: {
    id: string;
    code: string;
    name: string;
    department?: { id: string; name: string } | string;
    position?: { id: string; name: string } | string;
  };
}

interface TodayShift {
  id: string;
  shiftId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  location: string;
}

interface TodayLog {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
  status: string;
}

export function AdminDashboard() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  const [taskFilter, setTaskFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [pendingApps, setPendingApps] = useState<ApplicationItem[]>([]);
  const [myRequests, setMyRequests] = useState<ApplicationItem[]>([]);

  // Attendance Widget State
  const [todayShifts, setTodayShifts] = useState<TodayShift[]>([]);
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null);
  const [todayWorkday, setTodayWorkday] = useState<number>(0);
  const [monthSummary, setMonthSummary] = useState({ totalWorkdays: 0, lateMinutes: 0, earlyMinutes: 0 });
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);

  // Collapse states for 1Office card panels
  const [collapseTasks, setCollapseTasks] = useState(false);
  const [collapseRequests, setCollapseRequests] = useState(false);
  const [collapseDelegated, setCollapseDelegated] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/applications/dashboard-cards', {
        params: {
          employeeId: user?.employeeId,
          isAdmin: isAdmin,
        },
      });
      if (res.data) {
        setPendingApps(res.data.toDoList || []);
        setMyRequests(res.data.myRequests || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard cards, trying fallback', err);
      try {
        const fallbackRes = await apiClient.get<any>('/applications');
        const rawData = fallbackRes.data;
        const apps: ApplicationItem[] = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.items)
          ? rawData.items
          : Array.isArray(rawData?.data)
          ? rawData.data
          : [];

        if (isAdmin) {
          const pending = apps.filter(
            (a) => a.status === 'PENDING' || a.status === 'WAITING' || a.status === 'APPROVING'
          );
          setPendingApps(pending);
          setMyRequests(apps.slice(0, 10));
        } else {
          const userEmployeeId = user?.employeeId;
          const userApps = apps.filter(
            (a) => (userEmployeeId && a.employeeId === userEmployeeId) || a.employee?.code === user?.username
          );
          setMyRequests(userApps);

          const assignedToMe = apps.filter(
            (a) =>
              (a.status === 'PENDING' || a.status === 'WAITING' || a.status === 'APPROVING') &&
              a.payload?.approverId === user?.id
          );
          setPendingApps(assignedToMe);
        }
      } catch (innerErr) {
        console.error('Fallback failed', innerErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const res = await apiClient.get('/attendance/my-today', {
        params: { employeeId: user?.employeeId },
      });
      setTodayShifts(res.data?.shifts || []);
      setTodayLog(res.data?.log || null);
      if (typeof res.data?.workday === 'number') {
        setTodayWorkday(res.data.workday);
      }
      if (res.data?.monthSummary) setMonthSummary(res.data.monthSummary);
    } catch (err) {
      console.error('Failed to load today attendance', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTodayAttendance();
  }, [isAdmin, user]);

  const handleApprove = async (id: string, name: string) => {
    try {
      await apiClient.patch(`/applications/${id}/approve`, {
        comment: 'Duyệt nhanh 1-chạm từ Dashboard',
      });
      message.success(`Đã phê duyệt đơn thành công cho ${name}`);
      setPendingApps((prev) => prev.filter((item) => item.id !== id));
      fetchDashboardData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể phê duyệt đơn');
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await apiClient.patch(`/applications/${id}/reject`, {
        comment: 'Từ chối nhanh 1-chạm từ Dashboard',
      });
      message.warning(`Đã từ chối đơn của ${name}`);
      setPendingApps((prev) => prev.filter((item) => item.id !== id));
      fetchDashboardData();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể từ chối đơn');
    }
  };

  const handleCheckInOut = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!user?.employeeId) {
      message.warning('Tài khoản chưa được gán hồ sơ nhân viên để thực hiện dập thẻ.');
      return;
    }
    setCheckingInOut(true);

    const submitAction = async (locationStr: string) => {
      try {
        const res = await apiClient.post('/attendance/checkin', {
          employeeId: user.employeeId,
          type,
          location: locationStr,
        });
        message.success(
          res.data?.message ||
            (type === 'CHECK_IN'
              ? '✅ Check-in vào ca thành công!'
              : '✅ Check-out ra ca thành công!')
        );
        if (typeof res.data?.workday === 'number') {
          setTodayWorkday(res.data.workday);
        }
        await fetchTodayAttendance();
      } catch (err: any) {
        message.error(err.response?.data?.message || 'Lỗi khi ghi nhận chấm công');
      } finally {
        setCheckingInOut(false);
      }
    };

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          submitAction(`Vị trí GPS: ${lat}, ${lng}`);
        },
        () => {
          submitAction('Vị trí Trình duyệt Web (GPS)');
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      submitAction('Vị trí Trình duyệt Web (GPS)');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'NS';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const todayFormatted = (() => {
    const d = new Date();
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = days[d.getDay()];
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  })();

  const todayFormattedShort = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  })();

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const hasCheckedIn = !!todayLog?.checkIn;
  const hasCheckedOut = !!todayLog?.checkOut;
  const isMultipleShifts = todayShifts.length >= 2;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 40 }}>
      {/* Top Heading */}
      {isAdmin ? (
        <div className="page-heading" style={{ marginBottom: 20 }}>
          <div>
            <span className="eyebrow" style={{ color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: 1.2 }}>
              QUẢN TRỊ DOANH NGHIỆP
            </span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>
              Tổng quan HRM
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
            Chế độ Quản trị viên
          </div>
        </div>
      ) : (
        /* 1Office Employee Top Heading - Đối chiếu động theo thông tin nhân sự/tài khoản đăng nhập */
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
            {user?.displayName || user?.username || 'Bàn làm việc'}
          </span>
          <SettingOutlined style={{ fontSize: 14, color: '#94a3b8', cursor: 'pointer' }} />
        </div>
      )}

      <div className="dashboard-grid">
        {/* Main Column Left (3 Cards: Việc cần thực hiện, Đề xuất của bạn, Việc bạn giao theo dõi) */}
        <div className="dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Card 1: Việc cần thực hiện */}
          <div className="dashboard-panel" style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
            <div className="panel-heading" style={{ padding: '14px 20px', borderBottom: collapseTasks ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Việc cần thực hiện {pendingApps.length > 0 && `(${pendingApps.length})`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select
                  value={taskFilter}
                  onChange={setTaskFilter}
                  size="small"
                  style={{ width: 90 }}
                  options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'approval', label: 'Cần duyệt' }
                  ]}
                />
                <Button
                  type="text"
                  size="small"
                  icon={collapseTasks ? <PlusOutlined /> : <MinusOutlined />}
                  onClick={() => setCollapseTasks(!collapseTasks)}
                  style={{ color: '#94a3b8' }}
                />
              </div>
            </div>

            {!collapseTasks && (
              <>
                {loading ? (
                  <div style={{ padding: 36, textAlign: 'center' }}>
                    <Spin />
                  </div>
                ) : pendingApps.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                      <span>Nội dung công việc</span>
                      <span>Phân loại</span>
                      <span style={{ textAlign: 'right' }}>Tác vụ nhanh</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {pendingApps.map((app) => (
                        <div
                          key={app.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '2.5fr 1fr 1.2fr',
                            alignItems: 'center',
                            padding: '14px 20px',
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s'
                          }}
                          className="task-row-item"
                        >
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                            <Avatar style={{ backgroundColor: '#6366f1', fontWeight: 700, flexShrink: 0 }}>
                              {getInitials(app.applicant?.name || app.employee?.name || 'NS')}
                            </Avatar>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>
                                {app.applicant?.name || app.employee?.name || 'Nhân sự'}
                                {(app.applicant?.department || (typeof app.employee?.department === 'object' ? app.employee?.department?.name : app.employee?.department)) && (
                                  <span style={{ fontWeight: 400, color: '#64748b', fontSize: 12, marginLeft: 6 }}>
                                    • {app.applicant?.department || (typeof app.employee?.department === 'object' ? app.employee?.department?.name : app.employee?.department)}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 4px' }}>
                                🕒 {new Date(app.createdAt).toLocaleString('vi-VN')}
                              </div>
                              <div style={{ fontSize: 12, color: '#475569' }}>
                                {app.reason || app.payload?.reason || app.payload?.note || app.code}
                              </div>
                            </div>
                          </div>

                          <div>
                            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>{app.type}</Tag>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button
                              type="primary"
                              size="small"
                              icon={<CheckOutlined />}
                              style={{ background: '#22c55e', borderColor: '#22c55e', borderRadius: 6, fontWeight: 600 }}
                              onClick={() => handleApprove(app.id, app.applicant?.name || app.employee?.name || 'Nhân sự')}
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="small"
                              danger
                              icon={<CloseOutlined />}
                              style={{ borderRadius: 6, fontWeight: 600 }}
                              onClick={() => handleReject(app.id, app.applicant?.name || app.employee?.name || 'Nhân sự')}
                            >
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* 1Office Standard Empty State matching Screenshot 1 */
                  <div style={{ padding: '44px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <FileTextOutlined style={{ fontSize: 26, color: '#cbd5e1' }} />
                    <span style={{ fontSize: 13.5, color: '#64748b' }}>Thật tuyệt. Bạn đã xử lý hết công việc!</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Card 2: Đề xuất của bạn */}
          <div className="dashboard-panel" style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
            <div className="panel-heading" style={{ padding: '14px 20px', borderBottom: collapseRequests ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Đề xuất của bạn {myRequests.length > 0 && `(${myRequests.length})`}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select
                  value={requestFilter}
                  onChange={setRequestFilter}
                  size="small"
                  style={{ width: 90 }}
                  options={[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'pending', label: 'Chờ duyệt' }
                  ]}
                />
                <Button
                  type="text"
                  size="small"
                  icon={collapseRequests ? <PlusOutlined /> : <MinusOutlined />}
                  onClick={() => setCollapseRequests(!collapseRequests)}
                  style={{ color: '#94a3b8' }}
                />
              </div>
            </div>

            {!collapseRequests && (
              <>
                {myRequests.length > 0 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr', padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                      <span>Nội dung đề xuất</span>
                      <span>Phân loại</span>
                      <span style={{ textAlign: 'right' }}>Trạng thái</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {myRequests
                        .filter((req) => requestFilter === 'all' || req.status === 'WAITING' || req.status === 'APPROVING' || req.status === 'PENDING')
                        .map((req) => (
                        <div key={req.id} style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1.2fr', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                          <div>
                            <strong style={{ fontSize: 13, color: '#0f172a', display: 'block' }}>
                              {req.reason || req.payload?.reason || req.code || req.type}
                            </strong>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              🕒 {new Date(req.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          <div>
                            <Tag style={{ borderRadius: 6, fontWeight: 500 }}>{req.type}</Tag>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <Tag
                              color={
                                req.status === 'APPROVED'
                                  ? 'success'
                                  : req.status === 'NO_APPROVED' || req.status === 'REJECTED'
                                  ? 'error'
                                  : req.status === 'CANCELED'
                                  ? 'default'
                                  : 'warning'
                              }
                              style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}
                            >
                              {req.status === 'APPROVED'
                                ? 'Đã duyệt'
                                : req.status === 'NO_APPROVED' || req.status === 'REJECTED'
                                ? 'Từ chối'
                                : req.status === 'CANCELED'
                                ? 'Đã hủy'
                                : 'Chờ duyệt'}
                            </Tag>
                            {req.currentApproverName && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color:
                                    req.status === 'APPROVED'
                                      ? '#15803d'
                                      : req.status === 'NO_APPROVED' || req.status === 'REJECTED'
                                      ? '#b91c1c'
                                      : '#b45309',
                                  marginTop: 3,
                                }}
                              >
                                {req.status === 'APPROVED'
                                  ? '✓ ' + req.currentApproverName
                                  : req.status === 'WAITING' || req.status === 'APPROVING'
                                  ? 'Đang chờ: ' + req.currentApproverName
                                  : req.currentApproverName}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* 1Office Standard Empty State matching Screenshot 1 */
                  <div style={{ padding: '44px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <FileTextOutlined style={{ fontSize: 26, color: '#cbd5e1' }} />
                    <span style={{ fontSize: 13.5, color: '#64748b' }}>Đề xuất của bạn đã được xử lý hết.</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Card 3: Việc bạn giao, theo dõi */}
          <div className="dashboard-panel" style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
            <div className="panel-heading" style={{ padding: '14px 20px', borderBottom: collapseDelegated ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Việc bạn giao, theo dõi
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select
                  defaultValue="all"
                  size="small"
                  style={{ width: 90 }}
                  options={[{ value: 'all', label: 'Tất cả' }]}
                />
                <Button
                  type="text"
                  size="small"
                  icon={collapseDelegated ? <PlusOutlined /> : <MinusOutlined />}
                  onClick={() => setCollapseDelegated(!collapseDelegated)}
                  style={{ color: '#94a3b8' }}
                />
              </div>
            </div>

            {!collapseDelegated && (
              /* 1Office Standard Empty State matching Screenshot 1 */
              <div style={{ padding: '44px 20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <FileTextOutlined style={{ fontSize: 26, color: '#cbd5e1' }} />
                <span style={{ fontSize: 13.5, color: '#64748b' }}>Công việc bạn theo dõi đã được xử lý hết.</span>
              </div>
            )}
          </div>
        </div>

        {/* Side Column Right (Chấm công hôm nay, Lịch đào tạo...) */}
        <div className="dashboard-side" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Section: Chấm công hôm nay (Khối hiển thị cho tất cả, nút dập thẻ chỉ hiển thị cho Nhân viên) */}
          <div className="dashboard-panel" style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{todayFormatted}</span>
                <div style={{ display: 'flex', gap: 2 }}>
                  <Button size="small" type="text" icon={<LeftOutlined />} style={{ padding: 4 }} />
                  <Button size="small" type="text" icon={<RightOutlined />} style={{ padding: 4 }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarOutlined style={{ fontSize: 16, color: '#64748b' }} />
                <Button size="small" type="text" icon={<MinusOutlined />} style={{ color: '#94a3b8', padding: 2 }} />
              </div>
            </div>

            {/* Shift Details Banner matching User requirement */}
            {todayShifts.length > 0 ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    [{todayShifts[0].code}] {todayShifts[0].name}
                  </span>
                  <Tag color="green" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
                    {todayShifts[0].startTime} - {todayShifts[0].endTime}
                  </Tag>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <EnvironmentOutlined style={{ color: '#059669' }} /> {todayShifts[0].location || '14 Lê Duy Đình'}
                </div>
              </div>
            ) : (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
                  Ca hôm nay: <strong>Không phân ca</strong>
                </span>
                <Tag style={{ borderRadius: 6, margin: 0 }}>Tự do</Tag>
              </div>
            )}

            {/* Attendance Status 3 Tiles matching 1Office Screenshot 2 */}
            <div
              onClick={() => setAttendanceModalOpen(true)}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 0.8fr',
                gap: 8,
                marginBottom: 12,
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              title="Bấm để xem chi tiết chấm công"
            >
              {/* Box 1: Giờ vào */}
              <div style={{
                background: hasCheckedIn ? '#ecfdf5' : '#fef2f2',
                padding: '12px 6px',
                borderRadius: 8,
                textAlign: 'center',
                border: `1px solid ${hasCheckedIn ? '#a7f3d0' : '#fee2e2'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 88,
              }}>
                <div style={{ fontSize: 12, color: hasCheckedIn ? '#065f46' : '#991b1b', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>Giờ vào</span>
                  {hasCheckedIn ? (
                    <CheckOutlined style={{ fontSize: 9, color: '#059669', border: '1px solid #059669', borderRadius: '50%', padding: 1 }} />
                  ) : (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 13, height: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>!</span>
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: hasCheckedIn ? '#059669' : '#ef4444' }}>
                  {formatTime(todayLog?.checkIn) || '--'}
                </div>
                <div style={{ fontSize: 10.5, color: hasCheckedIn ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 500 }}>
                  {hasCheckedIn ? '✓ Đã check in' : (
                    <>
                      <span style={{ fontSize: 10 }}>!</span> Chưa check in
                    </>
                  )}
                </div>
              </div>

              {/* Box 2: Giờ ra */}
              <div style={{
                background: hasCheckedOut ? '#ecfdf5' : '#fffbeb',
                padding: '12px 6px',
                borderRadius: 8,
                textAlign: 'center',
                border: `1px solid ${hasCheckedOut ? '#a7f3d0' : '#fef08a'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 88,
              }}>
                <div style={{ fontSize: 12, color: hasCheckedOut ? '#065f46' : '#92400e', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <span>Giờ ra</span>
                  {hasCheckedOut ? (
                    <CheckOutlined style={{ fontSize: 9, color: '#059669', border: '1px solid #059669', borderRadius: '50%', padding: 1 }} />
                  ) : (
                    <ClockCircleOutlined style={{ fontSize: 11, color: '#d97706' }} />
                  )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: hasCheckedOut ? '#059669' : '#d97706' }}>
                  {formatTime(todayLog?.checkOut) || '--'}
                </div>
                <div style={{ fontSize: 10.5, color: hasCheckedOut ? '#10b981' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 500 }}>
                  {hasCheckedOut ? '✓ Đã check out' : (
                    <>
                      <ClockCircleOutlined style={{ fontSize: 9 }} /> Chưa đến giờ
                    </>
                  )}
                </div>
              </div>

              {/* Box 3: Công */}
              <div style={{
                background: '#eff6ff',
                padding: '12px 6px',
                borderRadius: 8,
                textAlign: 'center',
                border: '1px solid #dbeafe',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 88,
              }}>
                <div style={{ fontSize: 12, color: '#1e40af', marginBottom: 2 }}>Công</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>
                  {todayWorkday > 0 ? todayWorkday : hasCheckedIn && hasCheckedOut ? '1' : hasCheckedIn ? '0.5' : '0'}
                </div>
                <div style={{ fontSize: 10.5, color: '#60a5fa' }}>
                  {hasCheckedIn && hasCheckedOut ? '08:00p' : hasCheckedIn ? '04:00p' : '00:00p'}
                </div>
              </div>
            </div>

            {/* Nút Chấm công nhanh: Dập thẻ Vào / Ra */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                margin: '10px 0 6px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                type="primary"
                size="small"
                icon={<LoginOutlined />}
                loading={checkingInOut}
                disabled={hasCheckedIn}
                onClick={() => handleCheckInOut('CHECK_IN')}
                style={{
                  height: 32,
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: hasCheckedIn ? '#f1f5f9' : '#2563eb',
                  borderColor: hasCheckedIn ? '#e2e8f0' : '#2563eb',
                  color: hasCheckedIn ? '#94a3b8' : '#ffffff',
                }}
              >
                {hasCheckedIn ? 'Đã Check-in' : 'Dập thẻ Vào'}
              </Button>
              <Button
                size="small"
                icon={<LogoutOutlined />}
                loading={checkingInOut}
                disabled={!hasCheckedIn || hasCheckedOut}
                onClick={() => handleCheckInOut('CHECK_OUT')}
                style={{
                  height: 32,
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 6,
                  background: !hasCheckedIn || hasCheckedOut ? '#f8fafc' : '#f0fdf4',
                  borderColor: !hasCheckedIn || hasCheckedOut ? '#e2e8f0' : '#16a34a',
                  color: !hasCheckedIn || hasCheckedOut ? '#94a3b8' : '#15803d',
                }}
              >
                {hasCheckedOut ? 'Đã Check-out' : 'Dập thẻ Ra'}
              </Button>
            </div>

            {/* Subtext matching 1Office Screenshot 2 */}
            <div style={{ fontSize: 11, color: hasCheckedIn || todayShifts.length > 0 ? '#15803d' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {hasCheckedIn ? (
                <>
                  <ClockCircleOutlined /> 🟢 Đã kết nối dữ liệu chấm công thời gian thực
                </>
              ) : (
                <>
                  <InfoCircleOutlined style={{ color: '#94a3b8' }} /> Chưa có dữ liệu chấm công
                </>
              )}
            </div>
          </div>

          {/* Section: Lịch đào tạo phần mềm 1Office */}
          <div className="dashboard-panel" style={{ borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Lịch đào tạo phần mềm 1Office
              </h3>
              <Button size="small" type="text" icon={<MinusOutlined />} style={{ color: '#94a3b8', padding: 2 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { date: '23/09', year: '2026', title: '[HRM] C02: Quản trị thông tin nhân sự', time: '15:00 - 17:00' },
                { date: '25/09', year: '2028', title: '[WORK] WPL02: Quy trình làm việc', time: '15:00 - 17:00' },
                { date: '28/09', year: '2026', title: '[HRM] C03: Quản lý chấm công', time: '15:00 - 17:00' },
                { date: '30/09', year: '2026', title: '[HRM] C04: Quản lý tiền lương và thu nhập', time: '15:00 - 17:00' },
              ].map((event, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 10, borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'center', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', minWidth: 46 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{event.date}</div>
                      <div style={{ fontSize: 9.5, color: '#94a3b8' }}>{event.year}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>{event.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>🕒 {event.time}</div>
                    </div>
                  </div>
                  <Button
                    size="small"
                    style={{ borderRadius: 6, fontSize: 10.5, fontWeight: 600, padding: '0 8px' }}
                    onClick={() => message.success('Đã đăng ký tham gia lớp đào tạo')}
                  >
                    ĐĂNG KÝ
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1Office Floating AI Assistant Widget (matching bottom-right circle in Screenshot 1) */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          border: '2px solid #ff7a00',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onClick={() => message.info('Trợ lý thông minh 1AI luôn sẵn sàng hỗ trợ bạn!')}
        title="Trợ lý 1AI Support"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#ff7a00', fontWeight: 900, fontSize: 22, lineHeight: 1 }}>▲</span>
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              border: '1.5px solid #fff'
            }}
          />
        </div>
      </div>

      {/* Modal Chấm công, ngày DD/MM/YY matching 1Office Screenshot 2 */}
      <Modal
        open={attendanceModalOpen}
        onCancel={() => setAttendanceModalOpen(false)}
        footer={null}
        title={
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            Chấm công, ngày {todayFormattedShort}
          </div>
        }
        width={460}
        centered
        styles={{
          body: { paddingTop: 8 }
        }}
      >
        {/* 3 Blocks in Modal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: 10, margin: '16px 0 18px' }}>
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: '1px solid #dbeafe' }}>
            <div style={{ fontSize: 11.5, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>Giờ vào</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8' }}>
              {formatTime(todayLog?.checkIn) || '--:--'}
            </div>
          </div>
          <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: '1px solid #dbeafe' }}>
            <div style={{ fontSize: 11.5, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>Giờ ra</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8' }}>
              {formatTime(todayLog?.checkOut) || '--:--'}
            </div>
          </div>
          <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: '1px solid #ddd6fe', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ height: 3, background: '#8b5cf6', borderRadius: 2, margin: '0 12px 6px' }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: '#6d28d9' }}>
              {todayWorkday > 0 ? todayWorkday : hasCheckedIn && hasCheckedOut ? 1 : hasCheckedIn ? 0.5 : 0}
            </div>
          </div>
        </div>

        {/* Shift Details */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>
            {todayShifts.length > 0
              ? `Ca làm việc ${todayShifts[0].code} - ${todayShifts[0].name}`
              : 'Ca làm việc: Chưa có ca phân công'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Thời gian</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {todayShifts.length > 0 ? `${todayShifts[0].startTime} - ${todayShifts[0].endTime}` : '--:-- - --:--'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Số giờ</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {hasCheckedIn && hasCheckedOut ? '8' : hasCheckedIn ? '4' : '0'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>Số công</span>
              <span style={{ fontWeight: 600, color: '#0f172a' }}>
                {todayWorkday > 0 ? todayWorkday : hasCheckedIn && hasCheckedOut ? 1 : hasCheckedIn ? 0.5 : 0}
              </span>
            </div>
            {todayLog?.checkInLocation && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                <span style={{ color: '#64748b' }}>Vị trí / Nguồn chốt</span>
                <span style={{ fontWeight: 500, color: '#059669', fontSize: 12 }}>
                  {todayLog.checkInLocation}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons in Modal */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
            <Button
              type="primary"
              icon={<LoginOutlined />}
              loading={checkingInOut}
              disabled={hasCheckedIn}
              onClick={() => handleCheckInOut('CHECK_IN')}
              style={{
                height: 38,
                fontWeight: 600,
                borderRadius: 6,
                background: hasCheckedIn ? '#f1f5f9' : '#2563eb',
                borderColor: hasCheckedIn ? '#e2e8f0' : '#2563eb',
                color: hasCheckedIn ? '#94a3b8' : '#ffffff',
              }}
            >
              {hasCheckedIn ? '✓ Đã vào ca' : 'Dập thẻ Vào (Check-in)'}
            </Button>
            <Button
              icon={<LogoutOutlined />}
              loading={checkingInOut}
              disabled={!hasCheckedIn || hasCheckedOut}
              onClick={() => handleCheckInOut('CHECK_OUT')}
              style={{
                height: 38,
                fontWeight: 600,
                borderRadius: 6,
                background: !hasCheckedIn || hasCheckedOut ? '#f8fafc' : '#f0fdf4',
                borderColor: !hasCheckedIn || hasCheckedOut ? '#e2e8f0' : '#16a34a',
                color: !hasCheckedIn || hasCheckedOut ? '#94a3b8' : '#15803d',
              }}
            >
              {hasCheckedOut ? '✓ Đã ra ca' : 'Dập thẻ Ra (Check-out)'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
