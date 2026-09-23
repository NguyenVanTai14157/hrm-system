'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, Tag, Select, Modal, App } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

export function PersonalAttendanceScreen() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [activeTab, setActiveTab] = useState<'month' | 'week' | 'stats' | 'list'>('month');
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any | null>(null);

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/me/attendance', {
        params: { month: monthStr },
      });
      setAttendanceData(res.data);
    } catch {
      setAttendanceData(null);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const rawAttendance = attendanceData?.monthAttendance;
  const days: any[] = Array.isArray(rawAttendance)
    ? rawAttendance
    : Array.isArray(rawAttendance?.daysList)
    ? rawAttendance.daysList
    : [];
  const summary = rawAttendance?.summary || null;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sunday
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Align to Monday

  return (
    <div>
      {/* ── Sub Navigation Tabs ── */}
      <div className="personal-sub-tabs">
        <button
          className={`personal-tab-item ${activeTab === 'month' ? 'active' : ''}`}
          onClick={() => setActiveTab('month')}
        >
          Công tháng
        </button>
        <button
          className={`personal-tab-item ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}
        >
          Công tuần
        </button>
        <button
          className={`personal-tab-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Thống kê
        </button>
        <button
          className={`personal-tab-item ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Danh sách
        </button>
      </div>

      <div className="personal-content">
        {/* Month Selector Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            padding: '10px 16px',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Button type="text" icon={<LeftOutlined />} onClick={handlePrevMonth} />
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>
            Tháng {currentMonth}/{currentYear}
          </div>
          <Button type="text" icon={<RightOutlined />} onClick={handleNextMonth} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: '#6b7280', fontSize: 13.5 }}>
              Đang tải bảng công…
            </p>
          </div>
        ) : (
          <>
            {/* ── Tab 1: Month Calendar ── */}
            {activeTab === 'month' && (
              <>
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 14,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Day Headers (T2 - CN) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      textAlign: 'center',
                      background: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      padding: '8px 0',
                      fontWeight: 600,
                      fontSize: 12,
                      color: '#64748b',
                    }}
                  >
                    <div>T2</div>
                    <div>T3</div>
                    <div>T4</div>
                    <div>T5</div>
                    <div>T6</div>
                    <div>T7</div>
                    <div>CN</div>
                  </div>

                  {/* Grid cells */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      borderBottom: '1px solid #f1f5f9',
                    }}
                  >
                    {/* Empty cells before month start */}
                    {Array.from({ length: startOffset }).map((_, idx) => (
                      <div
                        key={`offset-${idx}`}
                        style={{
                          height: 60,
                          borderRight: '1px solid #f1f5f9',
                          borderBottom: '1px solid #f1f5f9',
                          background: '#fcfcfc',
                        }}
                      />
                    ))}

                    {/* Days of month */}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const dayData = days.find((d: any) => d.day === dayNum) || {
                        day: dayNum,
                        workDay: 0,
                        status: 'NONE',
                      };
                      const isToday =
                        now.getDate() === dayNum &&
                        now.getMonth() + 1 === currentMonth &&
                        now.getFullYear() === currentYear;

                      const hasShift = (dayData.shifts && dayData.shifts.length > 0) || dayData.shiftName;

                      return (
                        <div
                          key={`day-${dayNum}`}
                          onClick={() => setSelectedDay(dayData)}
                          style={{
                            height: 60,
                            borderRight: '1px solid #f1f5f9',
                            borderBottom: '1px solid #f1f5f9',
                            padding: '4px 2px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            backgroundColor: isToday ? '#dbeafe' : '#ffffff',
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: isToday ? 700 : 500,
                              color: isToday ? '#1d4ed8' : '#334155',
                            }}
                          >
                            {dayNum}
                          </span>

                          <div style={{ fontSize: 11, fontWeight: 600 }}>
                            {dayData.workDay > 0 ? (
                              <span style={{ color: '#16a34a' }}>{dayData.workDay}</span>
                            ) : hasShift ? (
                              <span style={{ color: '#94a3b8' }}>0</span>
                            ) : (
                              <span style={{ color: '#cbd5e1' }}>-</span>
                            )}
                          </div>

                          {dayData.checkIn && (
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#22c55e',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ── Tab 2: Week View ── */}
            {activeTab === 'week' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {days
                  .filter((d: any) => {
                    const todayDay = now.getDate();
                    return Math.abs(d.day - todayDay) <= 3;
                  })
                  .map((dayData: any) => (
                    <div
                      key={`week-${dayData.day}`}
                      onClick={() => setSelectedDay(dayData)}
                      style={{
                        background: '#ffffff',
                        borderRadius: 10,
                        padding: '12px 14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                          Ngày {dayData.day}/{currentMonth}
                          {dayData.shiftName && (
                            <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b', marginLeft: 8 }}>
                              ({dayData.shiftName})
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                          Vào: {dayData.checkIn || '--:--'} • Ra: {dayData.checkOut || '--:--'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Tag color={dayData.workDay > 0 ? 'green' : 'default'}>
                          {dayData.workDay || 0} công
                        </Tag>
                        {dayData.effectiveHours > 0 && (
                          <div style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>
                            {dayData.effectiveHours}h
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* ── Tab 3: Detailed Stats ── */}
            {activeTab === 'stats' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
                    📊 Thống kê công tháng {currentMonth}/{currentYear}
                  </div>
                  <div className="personal-info-grid">
                    <div className="personal-info-row">
                      <span className="personal-info-label">Tổng số ngày công:</span>
                      <span className="personal-info-value" style={{ color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                        {summary?.totalWorkday ?? 0} công
                      </span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Tổng giờ làm việc:</span>
                      <span className="personal-info-value" style={{ fontWeight: 600 }}>
                        {summary?.totalEffectiveHours ?? 0} giờ
                      </span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Số ngày đi làm:</span>
                      <span className="personal-info-value">
                        {summary?.totalDaysWithWork ?? 0} ngày
                      </span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Tổng phút đi muộn:</span>
                      <span className="personal-info-value" style={{ color: (summary?.totalLateMinutes ?? 0) > 0 ? '#ef4444' : '#16a34a' }}>
                        {summary?.totalLateMinutes ?? 0} phút
                      </span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Tổng phút về sớm:</span>
                      <span className="personal-info-value" style={{ color: (summary?.totalEarlyMinutes ?? 0) > 0 ? '#f59e0b' : '#16a34a' }}>
                        {summary?.totalEarlyMinutes ?? 0} phút
                      </span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Khóa bảng công:</span>
                      <span className="personal-info-value">
                        {summary?.isLocked ? <Tag color="red">Đã khóa</Tag> : <Tag color="blue">Đang mở</Tag>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 4: Day-by-Day List ── */}
            {activeTab === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
                {days.map((dayData: any) => (
                  <div
                    key={`list-${dayData.day}`}
                    onClick={() => setSelectedDay(dayData)}
                    style={{
                      background: '#ffffff',
                      borderRadius: 10,
                      padding: '10px 12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>
                        {dayData.day}/{currentMonth}/{currentYear}
                        {dayData.shiftName && (
                          <span style={{ fontSize: 11.5, color: '#64748b', marginLeft: 6 }}>
                            • {dayData.shiftName}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        Vào: {dayData.checkIn || '--:--'} • Ra: {dayData.checkOut || '--:--'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: dayData.workDay > 0 ? '#16a34a' : '#94a3b8', fontSize: 13 }}>
                        {dayData.workDay || 0} công
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary Card (Visible on Month tab) */}
            {activeTab === 'month' && (
              <div className="personal-section-card">
                <div className="personal-section-title">
                  <span>Tổng hợp công tháng {currentMonth}</span>
                  <ClockCircleOutlined style={{ color: '#0284c7' }} />
                </div>
                <div className="personal-info-grid">
                  <div className="personal-info-row">
                    <span className="personal-info-label">Tổng số ngày công</span>
                    <span className="personal-info-value" style={{ color: '#16a34a', fontWeight: 700 }}>
                      {summary?.totalWorkday ?? days.reduce((acc: number, d: any) => acc + (d.workDay || 0), 0)} công
                    </span>
                  </div>
                  <div className="personal-info-row">
                    <span className="personal-info-label">Ca làm việc hôm nay</span>
                    <span className="personal-info-value">
                      {attendanceData?.today?.shift?.name || 'Chưa phân ca'}
                    </span>
                  </div>
                  <div className="personal-info-row">
                    <span className="personal-info-label">Chấm công hôm nay</span>
                    <span className="personal-info-value">
                      {attendanceData?.today?.log?.checkIn
                        ? `Vào: ${new Date(attendanceData.today.log.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                        : 'Chưa chấm công'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Day Detail Modal */}
      <Modal
        title={`Chi tiết ngày ${selectedDay?.day}/${currentMonth}/${currentYear}`}
        open={Boolean(selectedDay)}
        onCancel={() => setSelectedDay(null)}
        footer={null}
        centered
        width={360}
      >
        {selectedDay && (
          <div style={{ padding: '8px 0' }}>
            <div className="personal-info-grid">
              <div className="personal-info-row">
                <span className="personal-info-label">Ca làm việc</span>
                <span className="personal-info-value">
                  {selectedDay.shiftName || selectedDay.primaryShift?.name || 'Không có ca'}
                </span>
              </div>
              <div className="personal-info-row">
                <span className="personal-info-label">Giờ vào</span>
                <span className="personal-info-value">{selectedDay.checkIn || '--:--'}</span>
              </div>
              <div className="personal-info-row">
                <span className="personal-info-label">Giờ ra</span>
                <span className="personal-info-value">{selectedDay.checkOut || '--:--'}</span>
              </div>
              <div className="personal-info-row">
                <span className="personal-info-label">Số công ghi nhận</span>
                <span className="personal-info-value" style={{ color: '#16a34a', fontWeight: 700 }}>
                  {selectedDay.workDay || 0} công
                </span>
              </div>
              {selectedDay.checkInLocation && (
                <div className="personal-info-row">
                  <span className="personal-info-label">Vị trí vào</span>
                  <span className="personal-info-value">{selectedDay.checkInLocation}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
