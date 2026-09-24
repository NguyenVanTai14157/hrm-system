'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Spin, Button, Tag, Modal, DatePicker, App } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  FileTextOutlined,
  FilterOutlined,
  MinusOutlined,
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  AuditOutlined,
  ScheduleOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';
import { PersonalGpsPunchModal } from './personal-gps-punch-modal';

export function PersonalHomeScreen() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [homeData, setHomeData] = useState<any>(null);

  // Selected date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Attendance detail modal & GPS punch modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [gpsPunchModalOpen, setGpsPunchModalOpen] = useState(false);

  // Collapse states for the 3 panels & widget
  const [collapseTasks, setCollapseTasks] = useState(false);
  const [collapseRequests, setCollapseRequests] = useState(false);
  const [collapseDelegated, setCollapseDelegated] = useState(false);
  const [collapseAttendance, setCollapseAttendance] = useState(false);

  const dateStr = selectedDate.format('YYYY-MM-DD');

  const fetchHomeData = useCallback(async (targetDate?: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/me/home', {
        params: targetDate ? { date: targetDate } : undefined,
      });
      setHomeData(res.data);
    } catch {
      setHomeData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData(dateStr);
  }, [fetchHomeData, dateStr]);

  // Date navigation handlers
  const handlePrevDay = () => {
    setSelectedDate((prev) => prev.subtract(1, 'day'));
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => prev.add(1, 'day'));
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      setDatePickerOpen(false);
    }
  };

  // Date formatting for Vietnamese
  const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayOfWeekStr = dayNames[selectedDate.day()];
  const formattedDateStr = `${dayOfWeekStr}, ${selectedDate.format('DD/MM/YYYY')}`;

  const toDoList: any[] = homeData?.toDoList || [];
  const myRequests: any[] = homeData?.myRequests || [];
  const delegated: any[] = homeData?.delegated || [];
  const todayAtt = homeData?.todayAttendance;
  const todayLog = todayAtt?.log;
  const todayShift = todayAtt?.shift || todayAtt?.shifts?.[0];
  const workDay = todayAtt?.workDay ?? todayAtt?.workday ?? 0;
  const effectiveHours = todayAtt?.effectiveHours ?? 0;
  const rawLogs: any[] = todayAtt?.rawLogs || [];

  const checkInTime = todayLog?.checkIn
    ? new Date(todayLog.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const checkOutTime = todayLog?.checkOut
    ? new Date(todayLog.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="personal-content" style={{ paddingBottom: 16 }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 14, color: '#6b7280', fontSize: 13.5 }}>
            Đang tải dữ liệu làm việc…
          </p>
        </div>
      ) : (
        <>
          {/* ── Khối 1: Việc cần thực hiện ── */}
          <div className="personal-section-card">
            <div className="personal-section-title">
              <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1f2937' }}>
                Việc cần thực hiện {toDoList.length > 0 && `(${toDoList.length})`}
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <FilterOutlined style={{ color: '#9ca3af', fontSize: 15 }} />
                <button
                  style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}
                  onClick={() => setCollapseTasks(!collapseTasks)}
                >
                  {collapseTasks ? <PlusOutlined /> : <MinusOutlined />}
                </button>
              </div>
            </div>

            {!collapseTasks && (
              toDoList.length === 0 ? (
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: '22px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 32, color: '#cbd5e1' }} />
                  <span style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.4 }}>
                    Thật tuyệt. Bạn đã xử lý hết công việc!
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {toDoList.map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>
                        {item.type} - {item.employee?.name || 'Nhân viên'}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Mã: {item.code} • Lý do: {item.reason || '--'}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* ── Khối 2: Đề xuất của bạn ── */}
          <div className="personal-section-card">
            <div className="personal-section-title">
              <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1f2937' }}>
                Đề xuất của bạn {myRequests.length > 0 && `(${myRequests.length})`}
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <FilterOutlined style={{ color: '#9ca3af', fontSize: 15 }} />
                <button
                  style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}
                  onClick={() => setCollapseRequests(!collapseRequests)}
                >
                  {collapseRequests ? <PlusOutlined /> : <MinusOutlined />}
                </button>
              </div>
            </div>

            {!collapseRequests && (
              myRequests.length === 0 ? (
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: '22px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: '1px solid #f1f5f9',
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 32, color: '#cbd5e1' }} />
                  <span style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.4 }}>
                    Đề xuất của bạn đã được xử lý hết.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {myRequests.slice(0, 5).map((item: any) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: 13,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {item.type}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>
                          Mã: {item.code}
                        </div>
                      </div>
                      <Tag color={item.status === 'APPROVED' ? 'green' : item.status === 'REJECTED' ? 'red' : 'orange'}>
                        {item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'REJECTED' ? 'Từ chối' : 'Chờ duyệt'}
                      </Tag>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>

          {/* ── Khối 3: Việc bạn giao, theo dõi ── */}
          <div className="personal-section-card">
            <div className="personal-section-title">
              <span style={{ fontSize: 14.5, fontWeight: 700, color: '#1f2937' }}>
                Việc bạn giao, theo dõi
              </span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <FilterOutlined style={{ color: '#9ca3af', fontSize: 15 }} />
                <button
                  style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}
                  onClick={() => setCollapseDelegated(!collapseDelegated)}
                >
                  {collapseDelegated ? <PlusOutlined /> : <MinusOutlined />}
                </button>
              </div>
            </div>

            {!collapseDelegated && (
              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 10,
                  padding: '22px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  border: '1px solid #f1f5f9',
                }}
              >
                <FileTextOutlined style={{ fontSize: 32, color: '#cbd5e1' }} />
                <span style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.4 }}>
                  Công việc bạn theo dõi đã được xử lý hết.
                </span>
              </div>
            )}
          </div>

          {/* ── Khối 4: Widget Chấm công ngày hôm nay ── */}
          <div className="personal-section-card" style={{ padding: '16px 14px' }}>
            {/* Widget Date Header with interactive navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                {formattedDateStr}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <LeftOutlined
                  style={{ fontSize: 13, color: '#64748b', cursor: 'pointer', padding: 2 }}
                  onClick={handlePrevDay}
                  title="Ngày trước"
                />
                <RightOutlined
                  style={{ fontSize: 13, color: '#64748b', cursor: 'pointer', padding: 2 }}
                  onClick={handleNextDay}
                  title="Ngày sau"
                />
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <CalendarOutlined
                    style={{ fontSize: 15, color: '#64748b', cursor: 'pointer', padding: 2 }}
                    onClick={() => setDatePickerOpen(!datePickerOpen)}
                    title="Chọn ngày"
                  />
                  {datePickerOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 24,
                        right: 0,
                        zIndex: 200,
                        background: '#ffffff',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        borderRadius: 8,
                        padding: 4,
                      }}
                    >
                      <DatePicker
                        open
                        value={selectedDate}
                        onChange={handleDateChange}
                        onOpenChange={(open) => setDatePickerOpen(open)}
                        size="small"
                      />
                    </div>
                  )}
                </div>
                <button
                  style={{ border: 'none', background: 'none', color: '#9ca3af', cursor: 'pointer', padding: 0 }}
                  onClick={() => setCollapseAttendance(!collapseAttendance)}
                >
                  {collapseAttendance ? <PlusOutlined /> : <MinusOutlined />}
                </button>
              </div>
            </div>

            {!collapseAttendance && (
              <>
                {/* 3 Interactive Color Cards (Giờ vào, Giờ ra, Công) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {/* Card 1: Giờ vào (Pink/Red tint) */}
                  <div
                    className="attendance-card-clickable"
                    onClick={() => setDetailModalOpen(true)}
                    style={{
                      background: '#fff1f2',
                      borderRadius: 10,
                      padding: '12px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid #ffe4e6',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>Giờ vào</span>
                      <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 13 }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '8px 0 6px 0' }}>
                      {checkInTime}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>!</span> {todayLog?.checkIn ? 'Đã check-in' : 'Chưa check in'}
                    </div>
                  </div>

                  {/* Card 2: Giờ ra (Yellow tint) */}
                  <div
                    className="attendance-card-clickable"
                    onClick={() => setDetailModalOpen(true)}
                    style={{
                      background: '#fffbeb',
                      borderRadius: 10,
                      padding: '12px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid #fef3c7',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>Giờ ra</span>
                      <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 13 }} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '8px 0 6px 0' }}>
                      {checkOutTime}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#d97706', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span>🕒</span> {todayLog?.checkOut ? 'Đã check-out' : 'Chưa check-out'}
                    </div>
                  </div>

                  {/* Card 3: Công (Blue tint) */}
                  <div
                    className="attendance-card-clickable"
                    onClick={() => setDetailModalOpen(true)}
                    style={{
                      background: '#f0f9ff',
                      borderRadius: 10,
                      padding: '12px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid #e0f2fe',
                    }}
                  >
                    <div style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>
                      Công
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0284c7', margin: '2px 0' }}>
                      {workDay}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 600 }}>
                      {String(Math.floor(effectiveHours)).padStart(2, '0')}:{String(Math.round((effectiveHours % 1) * 60)).padStart(2, '0')}p
                    </div>
                  </div>
                </div>

                {/* Subtext info */}
                <div
                  onClick={() => setDetailModalOpen(true)}
                  style={{
                    marginTop: 12,
                    fontSize: 12,
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <ClockCircleOutlined style={{ fontSize: 13, color: '#0284c7' }} />
                  <span style={{ textDecoration: 'underline dotted' }}>
                    {todayLog?.checkIn
                      ? `Ca: ${todayShift?.name || 'Chưa phân ca'} • Vào: ${checkInTime} • Xem chi tiết »`
                      : todayShift
                      ? `Ca: ${todayShift.name} (${todayShift.startTime} - ${todayShift.endTime}) • Xem chi tiết »`
                      : 'Chưa được phân ca làm việc • Bấm xem chi tiết »'}
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Modal Chi tiết Chấm công ngày (Real Backend Data) ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <ScheduleOutlined style={{ color: '#0284c7' }} />
            <span>Chi tiết chấm công ngày {formattedDateStr}</span>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        centered
        width={420}
        destroyOnClose
      >
        <div style={{ padding: '4px 0 12px 0' }}>
          {/* Shift Details Box */}
          <div
            style={{
              background: '#f8fafc',
              borderRadius: 10,
              padding: '12px 14px',
              border: '1px solid #e2e8f0',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Ca làm việc:</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: todayShift ? '#1e293b' : '#94a3b8' }}>
                {todayShift?.name || 'Chưa được phân ca'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Khung giờ ca:</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: todayShift ? '#0284c7' : '#94a3b8' }}>
                {todayShift?.startTime && todayShift?.endTime ? `${todayShift.startTime} - ${todayShift.endTime}` : '--:--'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Vị trí áp dụng:</span>
              <span style={{ fontSize: 13, color: '#334155' }}>
                <EnvironmentOutlined style={{ color: todayShift ? '#ef4444' : '#94a3b8', marginRight: 4 }} />
                {todayShift?.location || (todayShift ? (homeData?.employee?.gpsLocation || 'Chưa thiết lập') : 'Chưa được phân ca')}
              </span>
            </div>
          </div>

          {/* Grid Check-in / Check-out / Workday details */}
          <div className="personal-info-grid" style={{ marginBottom: 16 }}>
            <div className="personal-info-row">
              <span className="personal-info-label">Giờ vào thực tế:</span>
              <span className="personal-info-value" style={{ fontWeight: 700, color: todayLog?.checkIn ? '#16a34a' : '#94a3b8' }}>
                {checkInTime}
              </span>
            </div>
            {todayLog?.checkInLocation && (
              <div className="personal-info-row">
                <span className="personal-info-label">Địa điểm vào:</span>
                <span className="personal-info-value" style={{ fontSize: 12 }}>
                  {todayLog.checkInLocation}
                </span>
              </div>
            )}
            <div className="personal-info-row">
              <span className="personal-info-label">Giờ ra thực tế:</span>
              <span className="personal-info-value" style={{ fontWeight: 700, color: todayLog?.checkOut ? '#16a34a' : '#94a3b8' }}>
                {checkOutTime}
              </span>
            </div>
            {todayLog?.checkOutLocation && (
              <div className="personal-info-row">
                <span className="personal-info-label">Địa điểm ra:</span>
                <span className="personal-info-value" style={{ fontSize: 12 }}>
                  {todayLog.checkOutLocation}
                </span>
              </div>
            )}
            <div className="personal-info-row">
              <span className="personal-info-label">Đi muộn / Về sớm:</span>
              <span className="personal-info-value">
                {!todayLog?.checkIn && !todayLog?.checkOut ? (
                  <Tag color="default">Chưa chấm công</Tag>
                ) : (
                  <>
                    {todayAtt?.lateMinutes > 0 ? (
                      <Tag color="red">Muộn {todayAtt.lateMinutes}p</Tag>
                    ) : (
                      todayLog?.checkIn && <Tag color="green">Đúng giờ</Tag>
                    )}
                    {todayAtt?.earlyMinutes > 0 ? (
                      <Tag color="orange">Sớm {todayAtt.earlyMinutes}p</Tag>
                    ) : (
                      todayLog?.checkOut && <Tag color="green">Đúng giờ về</Tag>
                    )}
                    {!todayLog?.checkOut && todayLog?.checkIn && (
                      <Tag color="blue">Đang làm việc</Tag>
                    )}
                    {!todayLog?.checkIn && todayLog?.checkOut && (
                      <Tag color="orange">Thiếu chấm vào</Tag>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="personal-info-row">
              <span className="personal-info-label">Số công ghi nhận:</span>
              <span className="personal-info-value" style={{ color: '#0284c7', fontWeight: 800, fontSize: 15 }}>
                {workDay} công
              </span>
            </div>
            <div className="personal-info-row">
              <span className="personal-info-label">Thời gian làm việc:</span>
              <span className="personal-info-value" style={{ fontWeight: 600 }}>
                {String(Math.floor(effectiveHours)).padStart(2, '0')}:{String(Math.round((effectiveHours % 1) * 60)).padStart(2, '0')}p
              </span>
            </div>
          </div>

          {/* Raw Punches Log list from BiometricRawLog */}
          {rawLogs.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Lịch sử quẹt thẻ trong ngày ({rawLogs.length} lần):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                {rawLogs.map((log: any, idx: number) => (
                  <div
                    key={log.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f1f5f9',
                      padding: '6px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                      🕒 {log.timeStr}
                    </span>
                    <span style={{ color: '#64748b' }}>
                      {log.verifyMode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Punch GPS + Create Explanation Request */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            <Link href="/me/attendance/gps" style={{ textDecoration: 'none' }}>
              <Button
                type="primary"
                block
                size="large"
                icon={<EnvironmentOutlined />}
                onClick={() => setDetailModalOpen(false)}
                style={{
                  background: '#ff5722',
                  borderColor: '#ff5722',
                  borderRadius: 8,
                  height: 42,
                  fontWeight: 700,
                  fontSize: 14.5,
                }}
              >
                Chấm công GPS Di động
              </Button>
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Link href="/me/requests?type=EXPLANATION" style={{ textDecoration: 'none' }}>
                <Button
                  block
                  icon={<AuditOutlined />}
                  onClick={() => setDetailModalOpen(false)}
                  style={{ borderRadius: 8, height: 38 }}
                >
                  Đơn giải trình
                </Button>
              </Link>
              <Link href="/me/attendance" style={{ textDecoration: 'none' }}>
                <Button
                  block
                  type="default"
                  icon={<CalendarOutlined />}
                  onClick={() => setDetailModalOpen(false)}
                  style={{ borderRadius: 8, height: 38 }}
                >
                  Bảng công tháng
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── GPS Punch Modal ── */}
      <PersonalGpsPunchModal
        open={gpsPunchModalOpen}
        onClose={() => setGpsPunchModalOpen(false)}
        onSuccess={() => fetchHomeData(dateStr)}
      />
    </div>
  );
}

