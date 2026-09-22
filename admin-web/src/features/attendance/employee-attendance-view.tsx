'use client';

import { useState, useEffect, useCallback } from 'react';
import { Select, Spin, Modal, Tag } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

interface ShiftItem {
  assignmentId?: string;
  shiftId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  hours: number;
  status?: string;
}

interface DayAttendance {
  day: number;
  date: string;
  dayName: string;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
  shifts: ShiftItem[];
  primaryShift: ShiftItem | null;
  shiftName: string;
  checkIn: string;
  checkOut: string;
  checkInFull?: string | null;
  checkOutFull?: string | null;
  checkInLocation?: string | null;
  checkOutLocation?: string | null;
  lateMinutes: number;
  earlyMinutes: number;
  workDay: number;
  leaveCode?: string | null;
  isUnexcused: boolean;
  standardWorkdays: number;
  standardHours: number;
  status: string;
  dayLeaveApp?: { id: string; type: string; reason?: string } | null;
}

export function EmployeeAttendanceView() {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.username || 'Nhân viên';
  const employeeId = user?.employeeId;

  // Date state
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);

  // Data state
  const [daysList, setDaysList] = useState<DayAttendance[]>([]);
  const [summary, setSummary] = useState({
    totalWorkday: 0,
    totalHours: 0,
    standardWorkdays: 0,
    standardHours: 0,
    unexcusedLeaveCount: 0,
    excusedLeaveCount: 0,
    totalLateMinutes: 0,
    leaveDaysRemaining: 12,
  });

  // Tab & Modal states
  const [activeTopTab, setActiveTopTab] = useState<'company' | 'list'>('company');
  const [activeStatSubTab, setActiveStatSubTab] = useState<'has_data' | 'no_data'>('has_data');
  const [selectedDay, setSelectedDay] = useState<DayAttendance | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const monthString = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      if (!employeeId) {
        setDaysList([]);
        return;
      }
      const monthParam = `${currentYear}-${monthString}`;
      const res = await apiClient.get(`/attendance/my-month?employeeId=${employeeId}&month=${monthParam}`);
      if (res.data) {
        setDaysList(res.data.daysList || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.error('Failed to load employee attendance month', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentYear, monthString]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Compute 7-column calendar matrix (Monday -> Sunday)
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayObj = new Date(currentYear, currentMonth - 1, 1);
  // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // In Vietnam / 1Office, week starts on Monday: Monday=0, ..., Sunday=6
  const startOffset = (firstDayObj.getDay() + 6) % 7;
  const totalSlots = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

  const handleCellClick = (dayData?: DayAttendance) => {
    if (!dayData) return;
    setSelectedDay(dayData);
    setModalOpen(true);
  };

  // Month selector options
  const monthOptions = [
    { value: `${currentYear}-08`, label: `08/${currentYear}`, m: 8, y: currentYear },
    { value: `${currentYear}-09`, label: `09/${currentYear}`, m: 9, y: currentYear },
    { value: `${currentYear}-10`, label: `10/${currentYear}`, m: 10, y: currentYear },
    { value: `${currentYear}-11`, label: `11/${currentYear}`, m: 11, y: currentYear },
    { value: `${currentYear}-12`, label: `12/${currentYear}`, m: 12, y: currentYear },
  ];

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 8px 40px' }}>
      {/* 1Office Top Heading matching Screenshot 3: TEST */}
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          {displayName}
        </h1>
      </div>

      {/* Top Tabs Bar & Month Selector matching Screenshot 3 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 24 }}>
          <button
            type="button"
            onClick={() => setActiveTopTab('company')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px 12px',
              fontSize: 13.5,
              fontWeight: activeTopTab === 'company' ? 700 : 500,
              color: activeTopTab === 'company' ? '#ef4444' : '#64748b',
              borderBottom: activeTopTab === 'company' ? '2.5px solid #ef4444' : '2.5px solid transparent',
              cursor: 'pointer',
            }}
          >
            Bảng công toàn bộ công ty
          </button>
          <button
            type="button"
            onClick={() => setActiveTopTab('list')}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px 4px 12px',
              fontSize: 13.5,
              fontWeight: activeTopTab === 'list' ? 700 : 500,
              color: activeTopTab === 'list' ? '#ef4444' : '#64748b',
              borderBottom: activeTopTab === 'list' ? '2.5px solid #ef4444' : '2.5px solid transparent',
              cursor: 'pointer',
            }}
          >
            Danh sách
          </button>
        </div>

        {/* Month Selector Dropdown */}
        <div style={{ paddingBottom: 6 }}>
          <Select
            value={`${currentYear}-${monthString}`}
            onChange={(val) => {
              const opt = monthOptions.find((o) => o.value === val);
              if (opt) {
                setCurrentMonth(opt.m);
                setCurrentYear(opt.y);
              }
            }}
            style={{ width: 120 }}
            suffixIcon={<CalendarOutlined style={{ color: '#94a3b8' }} />}
            options={monthOptions}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 100, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : (
        /* Main Layout: Left Calendar (72%) + Right Stats (28%) matching Screenshot 3 & 4 */
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20, alignItems: 'start' }}>
          {/* Left: 7-Column Calendar Grid matching 1Office */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            {/* Weekday Header Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                textAlign: 'center',
                padding: '10px 0',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#475569',
              }}
            >
              {weekdays.map((wd, idx) => (
                <div key={idx} style={{ color: idx === 6 ? '#ef4444' : '#475569' }}>
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
              }}
            >
              {Array.from({ length: totalSlots }).map((_, slotIdx) => {
                const dayNum = slotIdx - startOffset + 1;
                const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;
                const dayData = isValidDay ? daysList.find((d) => d.day === dayNum) : undefined;
                const hasShift = (dayData?.shifts?.length || 0) > 0;
                const isToday = dayData?.isToday || false;

                if (!isValidDay) {
                  return (
                    <div
                      key={slotIdx}
                      style={{
                        minHeight: 105,
                        background: '#fafafa',
                        borderRight: (slotIdx + 1) % 7 !== 0 ? '1px solid #f1f5f9' : 'none',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    />
                  );
                }

                return (
                  <div
                    key={slotIdx}
                    onClick={() => handleCellClick(dayData)}
                    style={{
                      minHeight: 105,
                      padding: '8px 10px',
                      background: isToday ? '#e0edff' : '#ffffff',
                      borderRight: (slotIdx + 1) % 7 !== 0 ? '1px solid #f1f5f9' : 'none',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isToday) e.currentTarget.style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isToday) e.currentTarget.style.background = '#ffffff';
                    }}
                    title={hasShift ? `Bấm để xem chi tiết ca ngày ${dayNum}` : undefined}
                  >
                    {/* Day Number (top-left) */}
                    <div style={{ fontSize: 12.5, fontWeight: isToday ? 700 : 500, color: isToday ? '#1d4ed8' : '#64748b' }}>
                      {dayNum}
                    </div>

                    {/* Content inside cell: Workday number & Shift details */}
                    {hasShift ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                        {/* Workday number matching Screenshot 3 (e.g. 0) */}
                        <div
                          style={{
                            fontSize: 17,
                            fontWeight: 800,
                            color: isToday ? '#2563eb' : '#3b82f6',
                            marginBottom: 4,
                          }}
                        >
                          {dayData?.leaveCode ? dayData.leaveCode : dayData?.workDay || 0}
                        </div>

                        {/* Shift Times & Names (supports multiple shifts) */}
                        {dayData?.shifts.map((s, sIdx) => (
                          <div key={sIdx} style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.35 }}>
                            <div>{s.startTime} - {s.endTime}</div>
                            <div style={{ fontWeight: 500 }}>{s.code || s.name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ flex: 1 }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Thống kê T[MM], [YYYY] matching Screenshot 3 & 4 */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              padding: '18px 20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <h3 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: '0 0 16px' }}>
              Thống kê T{monthString}, {currentYear}
            </h3>

            {/* 2 Metric Cards: Công thực tế & Giờ làm thực tế */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {/* Card 1: Công thực tế 0/5 */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    fontSize: 17,
                  }}
                >
                  <CalendarOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Công thực tế</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {summary.totalWorkday}/{summary.standardWorkdays}
                  </div>
                </div>
              </div>

              {/* Card 2: Giờ làm thực tế 0/40 */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '14px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    fontSize: 17,
                  }}
                >
                  <ClockCircleOutlined />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>Giờ làm thực tế</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                    {summary.totalHours}/{summary.standardHours}
                  </div>
                </div>
              </div>
            </div>

            {/* Subtabs: Dữ liệu phát sinh | Dữ liệu không phát sinh */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                borderBottom: '1px solid #f1f5f9',
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveStatSubTab('has_data')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px 0 10px',
                  fontSize: 12.5,
                  fontWeight: activeStatSubTab === 'has_data' ? 700 : 500,
                  color: activeStatSubTab === 'has_data' ? '#ef4444' : '#64748b',
                  borderBottom: activeStatSubTab === 'has_data' ? '2px solid #ef4444' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                Dữ liệu phát sinh
              </button>
              <button
                type="button"
                onClick={() => setActiveStatSubTab('no_data')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px 0 10px',
                  fontSize: 12.5,
                  fontWeight: activeStatSubTab === 'no_data' ? 700 : 500,
                  color: activeStatSubTab === 'no_data' ? '#ef4444' : '#64748b',
                  borderBottom: activeStatSubTab === 'no_data' ? '2px solid #ef4444' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              >
                Dữ liệu không phát sinh
              </button>
            </div>

            {/* Stats Lines matching Screenshot 3 & 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#475569' }}>Số công chuẩn</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{summary.standardWorkdays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: '#475569' }}>Số công nghỉ không lý do</span>
                <span style={{ fontWeight: 700, color: summary.unexcusedLeaveCount > 0 ? '#ef4444' : '#0f172a' }}>
                  {summary.unexcusedLeaveCount}
                </span>
              </div>
              {summary.excusedLeaveCount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ color: '#475569' }}>Số công nghỉ có phép</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{summary.excusedLeaveCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup Chấm công, ngày DD/MM/YYYY matching 1Office Screenshot 4 */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
            Chấm công, ngày {selectedDay ? selectedDay.date.split('-').reverse().join('/') : ''}
          </div>
        }
        width={460}
        centered
        styles={{
          body: { paddingTop: 8 },
        }}
      >
        {selectedDay && (
          <div>
            {/* 3 Blocks: Giờ vào, Giờ ra, Công */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.1fr 1fr', gap: 10, margin: '16px 0 18px' }}>
              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: '1px solid #dbeafe' }}>
                <div style={{ fontSize: 11.5, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>Giờ vào</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8' }}>
                  {selectedDay.checkIn !== '--' ? selectedDay.checkIn : '--:--'}
                </div>
              </div>

              <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: '1px solid #dbeafe' }}>
                <div style={{ fontSize: 11.5, color: '#3b82f6', fontWeight: 600, marginBottom: 6 }}>Giờ ra</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1d4ed8' }}>
                  {selectedDay.checkOut !== '--' ? selectedDay.checkOut : '--:--'}
                </div>
              </div>

              <div style={{ background: '#f5f3ff', borderRadius: 8, padding: '12px 8px', textAlign: 'center', border: '1px solid #ddd6fe', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ height: 3, background: '#8b5cf6', borderRadius: 2, margin: '0 12px 6px' }} />
                <div style={{ fontSize: 17, fontWeight: 800, color: '#6d28d9' }}>
                  {selectedDay.leaveCode ? selectedDay.leaveCode : selectedDay.workDay || 0}
                </div>
              </div>
            </div>

            {/* Shift Details */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontWeight: 500 }}>
                {selectedDay.shifts.length > 0
                  ? `Ca làm việc ${selectedDay.shifts.map((s) => `${s.code} - ${s.name}`).join(' | ')}`
                  : 'Ca làm việc: Chưa có ca phân công'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Thời gian</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedDay.shifts.length > 0
                      ? selectedDay.shifts.map((s) => `${s.startTime} - ${s.endTime}`).join(', ')
                      : '--:-- - --:--'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Số giờ</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedDay.workDay > 0
                      ? (selectedDay.workDay * (selectedDay.standardHours / (selectedDay.standardWorkdays || 1)))
                      : 0}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Số công</span>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    {selectedDay.leaveCode ? selectedDay.leaveCode : selectedDay.workDay}
                  </span>
                </div>
                {selectedDay.checkInLocation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                    <span style={{ color: '#64748b' }}>Vị trí / Nguồn chốt</span>
                    <span style={{ fontWeight: 500, color: '#059669', fontSize: 12 }}>
                      {selectedDay.checkInLocation}
                    </span>
                  </div>
                )}
                {selectedDay.dayLeaveApp && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: 10 }}>
                    <span style={{ color: '#64748b' }}>Đơn từ đã duyệt</span>
                    <Tag color="blue">{selectedDay.dayLeaveApp.type}</Tag>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
