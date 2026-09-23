'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, Tag, message } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

export function PersonalCalendarScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/me/calendar?month=${monthStr}`);
      setData(res.data);
    } catch {
      message.error('Không thể tải lịch biểu.');
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const myShifts: any[] = data?.myShifts || [];
  const companyEvents: any[] = data?.companyEvents || [];

  return (
    <div className="personal-content" style={{ paddingBottom: 24 }}>
      {/* ── Month Selector ── */}
      <div
        className="personal-section-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
        }}
      >
        <Button icon={<LeftOutlined />} size="small" onClick={handlePrevMonth} />
        <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
          Tháng {currentMonth}/{currentYear}
        </div>
        <Button icon={<RightOutlined />} size="small" onClick={handleNextMonth} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" />
          <p style={{ marginTop: 12, color: '#64748b' }}>Đang tải lịch làm việc & sự kiện…</p>
        </div>
      ) : (
        <>
          {/* ── Sự kiện công ty & Lịch họp ── */}
          <div className="personal-section-card">
            <div className="personal-section-title">
              <span>Sự kiện & Lịch họp chung</span>
              <CalendarOutlined style={{ color: '#0284c7' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {companyEvents.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13.5 }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#0284c7', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ClockCircleOutlined /> {ev.time}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <EnvironmentOutlined /> {ev.location}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Lịch ca làm việc cá nhân trong tháng ── */}
          <div className="personal-section-card">
            <div className="personal-section-title">
              <span>Lịch phân ca cá nhân ({myShifts.length} ngày)</span>
              <ClockCircleOutlined style={{ color: '#10b981' }} />
            </div>

            {myShifts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>
                Chưa có phân ca làm việc trong tháng này.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myShifts.map((shift) => (
                  <div
                    key={shift.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: '#f0fdf4',
                      border: '1px solid #dcfce7',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#166534', fontSize: 13 }}>
                        {shift.shiftName}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>
                        Ngày: {new Date(shift.date).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                    <Tag color="green">
                      {shift.startTime} - {shift.endTime}
                    </Tag>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
