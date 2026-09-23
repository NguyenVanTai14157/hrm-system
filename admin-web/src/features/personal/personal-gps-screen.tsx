'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Spin, Button, Modal, App } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  DownOutlined,
  UpOutlined,
  CloseOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';
import './personal.css';

// Client-side Haversine Distance helper (meters)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function PersonalGpsScreen() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState(false);

  // Selected date in week strip (defaults to today)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [faqExpanded, setFaqExpanded] = useState(false);

  // GPS Geolocation state
  const [geoPosition, setGeoPosition] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [geoPermissionModalOpen, setGeoPermissionModalOpen] = useState(false);
  const [geoErrorMsg, setGeoErrorMsg] = useState<string | null>(null);

  // Live Backend Data
  const [homeData, setHomeData] = useState<any>(null);
  const [assignedLocations, setAssignedLocations] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any>(null);

  const dateStr = selectedDate.format('YYYY-MM-DD');
  const todayStr = dayjs().format('YYYY-MM-DD');
  const monthStr = selectedDate.format('YYYY-MM');

  // 1. Fetch live backend data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [homeRes, locsRes, monthRes] = await Promise.all([
        apiClient.get('/me/home', { params: { date: dateStr } }),
        apiClient.get('/me/attendance/gps-locations').catch(() => ({ data: [] })),
        apiClient.get('/me/attendance', { params: { month: monthStr } }).catch(() => ({ data: null })),
      ]);
      setHomeData(homeRes.data);
      const locs = (Array.isArray(locsRes.data) && locsRes.data.length > 0)
        ? locsRes.data
        : (homeRes.data?.todayAttendance?.assignedLocations || []);
      setAssignedLocations(locs);
      setMonthData(monthRes.data);
    } catch {
      setHomeData(null);
    } finally {
      setLoading(false);
    }
  }, [dateStr, monthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. Acquire GPS Location
  const acquireGPS = (onSuccessCallback?: (coords: { latitude: number; longitude: number; accuracy: number }) => void) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoErrorMsg('Trình duyệt không hỗ trợ định vị GPS Geolocation.');
      setGeoPermissionModalOpen(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setGeoPosition(coords);
        setGeoPermissionModalOpen(false);
        setGeoErrorMsg(null);
        if (onSuccessCallback) {
          onSuccessCallback(coords);
        }
      },
      (err) => {
        setGeoPermissionModalOpen(true);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoErrorMsg('Quyền truy cập định vị GPS chưa được bật, vui lòng mở quyền truy cập.');
        } else if (err.code === err.TIMEOUT) {
          setGeoErrorMsg('Hết thời gian chờ tín hiệu GPS. Vui lòng bật định vị và thử lại.');
        } else {
          setGeoErrorMsg('Không thể lấy vị trí GPS từ thiết bị. Vui lòng kiểm tra quyền vị trí.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // 3. Handle GPS Punch action
  const handleGpsPunch = async () => {
    acquireGPS(async (coords) => {
      setPunching(true);
      try {
        const res = await apiClient.post('/me/attendance/checkin', {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        message.success(res.data?.message || 'Chấm công GPS thành công!');
        await fetchData();
      } catch (err: any) {
        const errMsg = err.response?.data?.message || 'Chấm công GPS thất bại, vui lòng thử lại.';
        message.error(errMsg);
      } finally {
        setPunching(false);
      }
    });
  };

  // 4. Handle Wifi Punch (Secondary)
  const handleWifiPunch = () => {
    message.info('Tính năng chấm công Wifi đang xác thực điểm phát sóng văn phòng.');
  };

  // Shift & attendance data from real backend
  const todayAtt = homeData?.todayAttendance;
  const todayLog = todayAtt?.log;
  const todayShift = todayAtt?.shift || todayAtt?.shifts?.[0];
  const employee = homeData?.employee;
  const rawLogs: any[] = todayAtt?.rawLogs || [];

  // Compute 7 days of the selected week (Mon - Sun)
  const startOfWeek = selectedDate.startOf('week').add(1, 'day'); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const dayObj = startOfWeek.add(i, 'day');
    const dayNum = dayObj.date();
    const dayIso = dayObj.format('YYYY-MM-DD');
    const isSelected = dayObj.isSame(selectedDate, 'day');
    const isToday = dayObj.isSame(dayjs(), 'day');

    // Find attendance log for this day from monthData
    const monthDaysList = monthData?.monthAttendance?.daysList || [];
    const matchedDay = monthDaysList.find((d: any) => d.day === dayNum);

    let hasLog = false;
    let logType: 'green' | 'yellow' | 'blue' | null = null;

    if (matchedDay) {
      if (matchedDay.workDay > 0 && matchedDay.checkOut) {
        hasLog = true;
        logType = 'green';
      } else if (matchedDay.checkIn || matchedDay.status === 'MISSING_CHECKOUT' || matchedDay.lateMinutes > 0) {
        hasLog = true;
        logType = 'yellow';
      }
    }

    if (isSelected) {
      logType = 'blue';
    }

    const dayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return {
      dayObj,
      dayNum,
      dayIso,
      header: dayHeaders[i],
      isSelected,
      isToday,
      hasLog,
      logType,
      matchedDay,
    };
  });

  return (
    <div className="personal-content" style={{ padding: '12px 16px 24px 16px' }}>
      {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: '#64748b', fontSize: 13.5 }}>
              Đang đồng bộ dữ liệu vị trí & ca làm việc…
            </p>
          </div>
        ) : (
          <>
            {/* ── 1. Hero Artwork Illustration (Matching Image 1 & 2) ── */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px 0 16px 0',
              }}
            >
              <svg width="240" height="190" viewBox="0 0 240 190" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Soft Glow Circles */}
                <circle cx="120" cy="95" r="70" fill="#EBF2FE" />
                <circle cx="65" cy="55" r="4" fill="#3B82F6" opacity="0.6" />
                <circle cx="195" cy="80" r="5" fill="#E2E8F0" />
                <circle cx="45" cy="120" r="4.5" fill="#FF5722" />
                <circle cx="205" cy="105" r="3" fill="#FF5722" />

                {/* Smartphone Device Mockup */}
                <g filter="drop-shadow(0px 8px 16px rgba(15, 23, 42, 0.1))">
                  <rect x="75" y="20" width="80" height="150" rx="14" fill="#1E293B" />
                  <rect x="78" y="24" width="74" height="142" rx="11" fill="#FFFFFF" />
                  {/* Top speaker notch */}
                  <rect x="104" y="27" width="22" height="3" rx="1.5" fill="#CBD5E1" />

                  {/* Green Verified Circle inside Phone */}
                  <circle cx="115" cy="55" r="13" fill="#E8F8F0" />
                  <circle cx="115" cy="55" r="10" fill="#22C55E" />
                  <path d="M112 55L114.2 57.2L118 53" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Calendar Grid on Phone Screen */}
                  <rect x="85" y="74" width="60" height="42" rx="4" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
                  {/* Dot matrix inside phone calendar */}
                  <circle cx="93" cy="82" r="2" fill="#E2E8F0" />
                  <circle cx="102" cy="82" r="2" fill="#E2E8F0" />
                  <circle cx="111" cy="82" r="2" fill="#E2E8F0" />
                  <circle cx="120" cy="82" r="2" fill="#E2E8F0" />
                  <circle cx="129" cy="82" r="2" fill="#E2E8F0" />
                  <circle cx="137" cy="82" r="2" fill="#E2E8F0" />

                  <circle cx="93" cy="90" r="2" fill="#F43F5E" />
                  <circle cx="102" cy="90" r="2" fill="#E2E8F0" />
                  <circle cx="111" cy="90" r="2" fill="#3B82F6" />
                  <circle cx="120" cy="90" r="2" fill="#E2E8F0" />
                  <circle cx="129" cy="90" r="2" fill="#F43F5E" />
                  <circle cx="137" cy="90" r="2" fill="#E2E8F0" />

                  <circle cx="93" cy="98" r="2" fill="#E2E8F0" />
                  <circle cx="102" cy="98" r="2" fill="#E2E8F0" />
                  <circle cx="111" cy="98" r="2" fill="#E2E8F0" />
                  <circle cx="120" cy="98" r="2" fill="#E2E8F0" />
                  <circle cx="129" cy="98" r="2" fill="#E2E8F0" />
                  <circle cx="137" cy="98" r="2" fill="#E2E8F0" />
                </g>

                {/* Left Floating Wifi Badge */}
                <g filter="drop-shadow(0px 4px 8px rgba(37, 99, 235, 0.2))">
                  <circle cx="48" cy="96" r="19" fill="#2563EB" />
                  {/* Wifi Icon */}
                  <path d="M41 91C44.5 88 51.5 88 55 91" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <path d="M43.5 94.5C46 92.5 50 92.5 52.5 94.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="48" cy="98" r="1.5" fill="#FFFFFF" />
                </g>

                {/* Right Floating Orange Map Pin */}
                <g filter="drop-shadow(0px 6px 12px rgba(239, 68, 68, 0.25))">
                  <path
                    d="M178 40C171.373 40 166 45.3726 166 52C166 61.5 178 74 178 74C178 74 190 61.5 190 52C190 45.3726 184.627 40 178 40Z"
                    fill="#FF5722"
                  />
                  <circle cx="178" cy="51" r="4.5" fill="#FFFFFF" />
                </g>

                {/* Front Floating 3D Desk Calendar */}
                <g filter="drop-shadow(0px 6px 14px rgba(15, 23, 42, 0.12))">
                  {/* Calendar Paper Stand */}
                  <path d="M102 108L92 145H168L158 108H102Z" fill="#F1F5F9" />
                  <rect x="98" y="104" width="64" height="42" rx="5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
                  {/* Spiral Rings */}
                  <path d="M112 100V107" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M148 100V107" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

                  {/* Calendar Grid Lines */}
                  <line x1="104" y1="117" x2="156" y2="117" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="104" y1="126" x2="156" y2="126" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="104" y1="135" x2="156" y2="135" stroke="#E2E8F0" strokeWidth="1" />

                  <line x1="114" y1="110" x2="114" y2="142" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="124" y1="110" x2="124" y2="142" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="134" y1="110" x2="134" y2="142" stroke="#E2E8F0" strokeWidth="1" />
                  <line x1="144" y1="110" x2="144" y2="142" stroke="#E2E8F0" strokeWidth="1" />

                  {/* Red Circled Today Date */}
                  <circle cx="134" cy="126" r="6.5" stroke="#FF5722" strokeWidth="1.8" fill="none" />
                </g>
              </svg>
            </div>

            {/* ── 2. Action Buttons (1Office Standard) ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {/* Primary: CHẤM CÔNG GPS! */}
              <button
                onClick={handleGpsPunch}
                disabled={punching}
                style={{
                  background: '#ff5722',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  borderRadius: 8,
                  height: 48,
                  width: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 8px rgba(255, 87, 34, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {punching ? 'ĐANG XÁC THỰC GPS…' : 'CHẤM CÔNG GPS!'}
              </button>

              {/* Secondary: CHẤM CÔNG WIFI! */}
              <button
                onClick={handleWifiPunch}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#94a3b8',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  borderRadius: 8,
                  height: 44,
                  width: '100%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                CHẤM CÔNG WIFI!
              </button>
            </div>

            {/* ── 3. Collapsible FAQ Help Link ── */}
            <div style={{ textAlign: 'center', margin: '14px 0 6px 0' }}>
              <button
                onClick={() => setFaqExpanded(!faqExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1d4ed8',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 4,
                }}
              >
                <span>Vì sao tôi chưa chấm công được?</span>
                {faqExpanded ? <UpOutlined style={{ fontSize: 11 }} /> : <DownOutlined style={{ fontSize: 11 }} />}
              </button>

              {faqExpanded && (
                <div
                  style={{
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginTop: 8,
                    textAlign: 'left',
                    fontSize: 12.5,
                    color: '#0369a1',
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Các nguyên nhân thường gặp:</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Chưa cấp quyền truy cập vị trí GPS cho trình duyệt web.</li>
                    <li>Thiết bị đang đứng ngoài bán kính quy định của địa điểm chấm công.</li>
                    <li>Chưa được phân ca làm việc hoặc ca hôm nay chưa được phê duyệt.</li>
                    <li>Bảng chấm công của tháng hiện tại đã được khóa sổ bởi HR.</li>
                    <li>Khoảng cách giữa 2 lần chấm công liên tiếp tối thiểu là 1 phút.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* ── 4. Card Thông Tin Ca & Địa Điểm Phân Công ── */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '16px',
                marginTop: 12,
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              {/* Header: Shift Name & Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
                    {todayShift?.name || 'Ca Hành Chính'}
                  </span>
                  <InfoCircleOutlined style={{ color: '#f59e0b', fontSize: 14 }} />
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClockCircleOutlined style={{ fontSize: 13 }} />
                  <span>{selectedDate.format('DD/MM/YYYY')}</span>
                </div>
              </div>

              {/* Subtitle: Department / Timesheet name */}
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                {employee?.department?.name ? `Bảng công ${employee.department.name}` : 'Bảng công toàn bộ công ty'}
              </div>

              {/* Shift Hours Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 13 }} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                  {todayShift ? `${todayShift.startTime} - ${todayShift.endTime}` : '08:00 - 17:30'}
                </span>
              </div>

              {/* Assigned Locations List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {assignedLocations.length === 0 ? (
                  employee?.gpsLocation || todayShift?.location ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ marginTop: 2 }}>
                        <CheckCircleFilled style={{ color: '#10b981', fontSize: 18 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                          {employee?.gpsLocation || todayShift?.location}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          Bán kính: 2000 m
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
                      Chưa có địa điểm GPS phân công cho tài khoản này.
                    </div>
                  )
                ) : (
                  assignedLocations.map((loc, idx) => {
                    const dist = geoPosition
                      ? calculateHaversineDistance(
                          geoPosition.latitude,
                          geoPosition.longitude,
                          loc.latitude,
                          loc.longitude,
                        )
                      : null;
                    const isInside = dist !== null && dist <= loc.radius;

                    return (
                      <div key={loc.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ marginTop: 2 }}>
                          {isInside ? (
                            <CheckCircleFilled style={{ color: '#10b981', fontSize: 18 }} />
                          ) : (
                            <EnvironmentOutlined style={{ color: dist !== null ? '#f59e0b' : '#94a3b8', fontSize: 18 }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                            {loc.name || loc.address || 'Địa điểm chấm công'}
                          </div>
                          {loc.address && loc.address !== loc.name && (
                            <div style={{ fontSize: 12.5, color: '#475569', marginTop: 1 }}>
                              {loc.address}
                            </div>
                          )}
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Bán kính: {loc.radius} m
                            {dist !== null && (
                              <span style={{ marginLeft: 6, color: isInside ? '#16a34a' : '#ef4444', fontWeight: 500 }}>
                                • Cách {dist}m {isInside ? '(Hợp lệ)' : '(Ngoài bán kính)'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── 5. Horizontal Week Strip (Matching Image 2) ── */}
            <div
              style={{
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0',
                margin: '16px -16px 0 -16px',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center' }}>
                {weekDays.map((d) => (
                  <div
                    key={d.dayIso}
                    onClick={() => setSelectedDate(d.dayObj)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                      {d.header}
                    </span>

                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: d.isSelected || d.isToday ? 700 : 500,
                        color: d.isSelected ? '#ff5722' : '#1e293b',
                        border: d.isSelected ? '2px solid #ff5722' : '2px solid transparent',
                        background: '#ffffff',
                      }}
                    >
                      {d.dayNum}
                    </div>

                    {/* Dot Indicator */}
                    <div style={{ height: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {d.isSelected ? (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7' }} />
                      ) : d.logType === 'yellow' ? (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
                      ) : d.logType === 'green' ? (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 6. Punch Details for Selected Date (Empty state or Real Log) ── */}
            <div style={{ padding: '24px 0 10px 0', textAlign: 'center' }}>
              {todayLog?.checkIn || todayLog?.checkOut || rawLogs.length > 0 ? (
                <div
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '14px 16px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
                    Dữ liệu chấm công ngày {selectedDate.format('DD/MM/YYYY')}:
                  </div>
                  <div className="personal-info-grid">
                    <div className="personal-info-row">
                      <span className="personal-info-label">Giờ vào:</span>
                      <span className="personal-info-value" style={{ fontWeight: 700, color: todayLog?.checkIn ? '#16a34a' : '#94a3b8' }}>
                        {todayLog?.checkIn
                          ? new Date(todayLog.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Giờ ra:</span>
                      <span className="personal-info-value" style={{ fontWeight: 700, color: todayLog?.checkOut ? '#16a34a' : '#94a3b8' }}>
                        {todayLog?.checkOut
                          ? new Date(todayLog.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                          : '--:--'}
                      </span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Số công ghi nhận:</span>
                      <span className="personal-info-value" style={{ color: '#0284c7', fontWeight: 800 }}>
                        {todayAtt?.workday ?? todayAtt?.workDay ?? 0} công
                      </span>
                    </div>
                  </div>

                  {rawLogs.length > 0 && (
                    <div style={{ marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                        Lịch sử quẹt thẻ ({rawLogs.length} lần):
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rawLogs.map((log: any, idx: number) => (
                          <div
                            key={log.id || idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              background: '#f8fafc',
                              padding: '6px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                            }}
                          >
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>🕒 {log.timeStr}</span>
                            <span style={{ color: '#64748b' }}>{log.location || 'GPS Di động'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0' }}>
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 12,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FileTextOutlined style={{ fontSize: 26, color: '#cbd5e1' }} />
                  </div>
                  <span style={{ fontSize: 14, color: '#64748b' }}>
                    Chưa có dữ liệu chấm công
                  </span>
                </div>
              )}
            </div>
          </>
        )}

      {/* ── 7. Modal Thông Báo Quyền GPS (Matching Image 3) ── */}
      <Modal
        open={geoPermissionModalOpen}
        onCancel={() => setGeoPermissionModalOpen(false)}
        footer={null}
        centered
        width={340}
        closable={true}
        closeIcon={<CloseOutlined style={{ fontSize: 16, color: '#475569' }} />}
      >
        <div style={{ textAlign: 'center', padding: '10px 4px 6px 4px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
            Thông báo
          </div>
          <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.5, marginBottom: 22 }}>
            {geoErrorMsg || 'Quyền truy cập định vị GPS chưa được bật, vui lòng mở quyền truy cập.'}
          </p>

          <Button
            type="primary"
            block
            size="large"
            onClick={() => {
              setGeoPermissionModalOpen(false);
              acquireGPS();
            }}
            style={{
              background: '#ff4d4f',
              borderColor: '#ff4d4f',
              borderRadius: 8,
              height: 44,
              fontSize: 14.5,
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            MỞ CÀI ĐẶT
          </Button>
        </div>
      </Modal>
    </div>
  );
}
