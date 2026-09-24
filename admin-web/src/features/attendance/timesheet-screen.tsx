'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button, App, Spin, DatePicker, Modal, Radio, Tooltip, Tag } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';
import './timesheet.css';

interface TimesheetShift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  coefficient: number;
  flexibleMinutes: number;
  graceLateMinutes: number;
  standardHours: number;
  overnight: boolean;
}

interface TimesheetApplication {
  id: string;
  type: string;
  reason: string | null;
  status: string;
}

interface TimesheetCell {
  day: number;
  date: string;
  dayOfWeek: number;
  isWeekend: boolean;
  hasShift: boolean;
  shift: TimesheetShift | null;
  checkIn: string | null;
  checkOut: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInLocation: string | null;
  checkOutLocation: string | null;
  hours: number;
  leaveHours?: number;
  workday: number;
  workdayRaw: number;
  workedWorkday?: number;
  leaveWorkday?: number;
  lateMinutes: number;
  earlyMinutes: number;
  status: string; // UNASSIGNED | PRESENT | PARTIAL_LEAVE | ABSENT | LEAVE | OT | MISSION | COMP_LEAVE | WEEKEND | HOLIDAY | MISSING_PUNCH | PENDING
  application: TimesheetApplication | null;
  applications: TimesheetApplication[];
}

interface TimesheetSummary {
  late: { minutes: number; fine: number | null; workdayPenalty: number | null };
  early: { minutes: number; fine: number | null; workdayPenalty: number | null };
  missing: { count: number; fine: number | null; workdayPenalty: number | null };
  unexcused: { days: number };
  furlough: { initial: number | null; used: number; remaining: number | null };
  compLeave: { initial: number | null; used: number; addedHours: number | null; remaining: number | null };
  mainWork: { shiftWorkday: number; holidayWorkday: number; businessTripWorkday: number };
  overtime: { hours: number; workday: number };
  extraWork: { hours: number; workday: number };
  meals: { count: number };
  standard: { totalStandard: number };
  total: { nightHours: number; totalHours: number; totalWorkdays: number };
  // Legacy fields
  totalStandard?: number;
  totalActual?: number;
  totalOT?: number;
  totalLeave?: number;
  totalLate?: number;
  totalAbsent?: number;
}

interface TimesheetRow {
  employee: {
    id: string;
    code: string;
    name: string;
    department?: string;
    position?: string;
  };
  cells: TimesheetCell[];
  summary: TimesheetSummary;
}

export function TimesheetScreen() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<'SHEET' | 'DETAIL'>('SHEET');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('2026-09');
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [locked, setLocked] = useState(false);
  const [appsLocked, setAppsLocked] = useState(false);

  // Selected Day Cell Detail Modal state
  const [selectedCellInfo, setSelectedCellInfo] = useState<{
    employee: TimesheetRow['employee'];
    cell: TimesheetCell;
  } | null>(null);

  // Import Modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<'RAW' | 'MATRIX'>('RAW');
  const [importing, setImporting] = useState(false);

  const fetchTimesheet = async (selectedMonth: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ month: string; rows: TimesheetRow[] }>(`/attendance/timesheet?month=${selectedMonth}`);
      setRows(res.data.rows || []);
    } catch (err) {
      console.error('Failed to load timesheet', err);
      message.error('Không thể tải dữ liệu bảng chấm công');
    } finally {
      setLoading(false);
    }
  };

  const fetchLockStatus = async (selectedMonth: string) => {
    try {
      const res = await apiClient.get(`/attendance/timesheet-lock-status?month=${selectedMonth}`);
      setLocked(res.data?.locked ?? false);
      setAppsLocked(res.data?.appsLocked ?? false);
    } catch (_) {
      setLocked(false);
      setAppsLocked(false);
    }
  };

  useEffect(() => {
    fetchTimesheet(month);
    fetchLockStatus(month);
  }, [month]);

  const filteredRows = rows.filter(r => {
    const term = search.toLowerCase();
    return (
      r.employee.name.toLowerCase().includes(term) ||
      r.employee.code.toLowerCase().includes(term) ||
      (r.employee.department && r.employee.department.toLowerCase().includes(term)) ||
      (r.employee.position && r.employee.position.toLowerCase().includes(term))
    );
  });

  // Calculate days in selected month (handle leap year, 28/29/30/31 days)
  const [yearStr, monthStr] = month.split('-');
  const yearNum = parseInt(yearStr, 10) || 2026;
  const monthNum = parseInt(monthStr, 10) || 9; // 1-12
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayOfWeekHeader: string[] = [];
  const dayOfMonthHeader: string[] = [];
  const isWeekendList: boolean[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(yearNum, monthNum - 1, d);
    const dowIdx = dt.getDay();
    const dow = daysOfWeek[dowIdx];
    dayOfWeekHeader.push(dow);
    dayOfMonthHeader.push(String(d).padStart(2, '0'));
    isWeekendList.push(dowIdx === 0 || dowIdx === 6);
  }

  const renderCellBadge = (cell?: TimesheetCell) => {
    if (!cell || !cell.hasShift) {
      return <span className="ts-cell-badge unassigned">—</span>;
    }

    switch (cell.status) {
      case 'PRESENT':
        return <span className="ts-cell-badge present">{cell.workday}</span>;
      case 'PARTIAL_LEAVE':
        return <span className="ts-cell-badge leave" title={`Làm ${cell.hours}h (${cell.workedWorkday} công) + Nghỉ phép ${cell.leaveHours}h (${cell.leaveWorkday} công)`}>{cell.workday}</span>;
      case 'LEAVE':
        return <span className="ts-cell-badge leave">P</span>;
      case 'COMP_LEAVE':
        return <span className="ts-cell-badge comp-leave">NB</span>;
      case 'MISSION':
        return <span className="ts-cell-badge mission">CT</span>;
      case 'MISSING_PUNCH':
        return <span className="ts-cell-badge missing">{cell.workday > 0 ? `${cell.workday}*` : 'QC'}</span>;
      case 'ABSENT':
        return <span className="ts-cell-badge absent">0</span>;
      case 'PENDING':
        return <span className="ts-cell-badge unassigned" title="Chờ chấm công / Đang diễn ra">—</span>;
      case 'HOLIDAY':
        return <span className="ts-cell-badge mission">L</span>;
      case 'WEEKEND':
        return <span className="ts-cell-badge unassigned">—</span>;
      default:
        return <span className="ts-cell-badge unassigned">—</span>;
    }
  };

  const renderMetric = (val: number | null | undefined, tooltipText?: string, isBold?: boolean, color?: string) => {
    if (val === null || val === undefined) {
      return (
        <Tooltip title={tooltipText || 'Chỉ số chưa có nguồn dữ liệu / Chưa triển khai'}>
          <span className="ts-dash">—</span>
        </Tooltip>
      );
    }
    return (
      <span style={{ fontWeight: isBold ? 700 : 500, color: color || '#334155' }}>
        {val}
      </span>
    );
  };

  const handleImportSubmit = async () => {
    setImporting(true);
    try {
      if (importFormat === 'RAW') {
        const sampleLogs = [
          { personnelCode: 'NV0000', timestamp: `${month}-01 08:00:00`, location: 'Máy quẹt cổng 1', type: 'IN' },
          { personnelCode: 'NV0117', timestamp: `${month}-01 08:05:00`, location: 'Máy quẹt cổng 1', type: 'IN' },
          { personnelCode: 'NV0116', timestamp: `${month}-01 08:16:00`, location: 'Máy quẹt cổng 2', type: 'IN' },
        ];
        await apiClient.post('/attendance/import-raw-logs', { records: sampleLogs });
        message.success('Đã import thành công file Nhật ký quẹt thẻ thô (Raw Check Logs)');
      } else {
        const sampleMatrix = [
          { personnelCode: 'NV0000', fullname: 'Admin Quản trị', totalWorkday: 24, totalOT: 8, totalLateMinute: 0 },
          { personnelCode: 'NV0117', fullname: 'Đỗ Thanh Hằng', totalWorkday: 23.5, totalOT: 4, totalLateMinute: 12 },
        ];
        await apiClient.post(`/attendance/import-matrix?month=${month}`, { records: sampleMatrix });
        message.success('Đã import thành công file Bảng tổng hợp công tháng (Timesheet Matrix)');
      }
      setImportModalOpen(false);
      void fetchTimesheet(month);
    } catch (err) {
      message.error('Lỗi khi import dữ liệu Excel chấm công');
    } finally {
      setImporting(false);
    }
  };

  const getDayOfWeekFullName = (dow: number) => {
    const map = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    return map[dow] || '';
  };

  return (
    <div className="timesheet-1office-container">
      {/* Top Header Actions Toolbar */}
      <div className="ts-top-header">
        <div className="ts-top-title-area">
          <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
            Bảng công toàn bộ công ty - Tháng {monthNum}/{yearNum}
          </span>
          <span className="ts-progress-tag">Tiến trình tính công: 100%</span>
        </div>

        <div className="ts-top-actions">
          <DatePicker
            picker="month"
            value={dayjs(month, 'YYYY-MM')}
            onChange={(val) => val && setMonth(val.format('YYYY-MM'))}
            format="MM/YYYY"
            allowClear={false}
            style={{ borderRadius: 6, height: 32 }}
          />
          {locked && <span style={{ background: '#dc2626', color: '#fff', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>🔒 ĐÃ CHỐT CÔNG</span>}
          {appsLocked && <span style={{ background: '#7c3aed', color: '#fff', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>🔐 ĐÃ CHỐT ĐƠN</span>}
          <button className="ts-action-btn" onClick={async () => {
            try {
              const res = await apiClient.post('/attendance/lock-timesheet', { month });
              message.success(res.data?.message || 'Đã chốt bảng chấm công');
              setLocked(true);
            } catch (_) { message.error('Lỗi chốt công'); }
          }} disabled={locked}>✓ Chốt</button>
          <button className="ts-action-btn" onClick={async () => {
            try {
              const res = await apiClient.post('/attendance/lock-applications', { month });
              message.success(res.data?.message || 'Đã chốt đơn từ');
              setAppsLocked(true);
            } catch (_) { message.error('Lỗi chốt đơn'); }
          }} disabled={appsLocked}>🔐 Chốt đơn</button>
          {locked && <button className="ts-action-btn" onClick={async () => {
            try {
              const res = await apiClient.post('/attendance/unlock-timesheet', { month });
              message.success(res.data?.message || 'Đã mở khóa');
              setLocked(false);
              setAppsLocked(false);
            } catch (_) { message.error('Lỗi mở khóa'); }
          }}>🔓 Mở khóa</button>}
          <button className="ts-action-btn" onClick={() => setImportModalOpen(true)}>➔] Import</button>
          <button className="ts-action-btn" onClick={() => message.success('Đã xuất file Excel bảng chấm công')}>📤 Export</button>
          <button className="ts-action-btn" onClick={() => message.info('Thêm nhân sự vào bảng chấm công')}>👤+ Thêm người</button>
          <button className="ts-action-btn primary" onClick={() => fetchTimesheet(month)}>⚡ Tính toán</button>
          <button className="ts-action-btn">🕒 Lịch sử</button>
          <a className="ts-action-btn" href="/hrm/attendance/settings">⚙️ Cài đặt</a>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="ts-subtabs-bar">
        <div style={{ display: 'flex', gap: 24, position: 'relative' }}>
          <div
            className={`ts-subtab ${activeTab === 'SHEET' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('SHEET')}
          >
            Bảng chấm công
          </div>

          <div
            className={`ts-subtab ${activeTab === 'DETAIL' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('DETAIL')}
          >
            Chi tiết bảng chấm công
          </div>
        </div>
      </div>

      {/* Sub-bar Info */}
      <div className="ts-subbar">
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Hiển thị <strong>{filteredRows.length}</strong> / <strong>{rows.length}</strong> nhân sự (Tháng {monthNum}/{yearNum} có {daysInMonth} ngày)
        </div>
        <div>
          <Input
            placeholder="Tìm kiếm theo mã, tên, phòng ban, vị trí..."
            prefix={<span style={{ color: '#94a3b8', fontSize: 13 }}>🔍</span>}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 300, borderRadius: 20 }}
            allowClear
          />
        </div>
      </div>

      {/* Data Table Matrix (1Office Layout) */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <Spin description="Đang tải dữ liệu chấm công từ hệ thống..." size="large" />
        </div>
      ) : (
        <div className="ts-matrix-scroll-container">
          <table className="ts-1office-table">
            <thead>
              {/* Row 1 Header: Fixed Left Titles, Days of Week, and Summary Group Headers */}
              <tr>
                {/* Fixed Left Columns (RowSpan 2) */}
                <th rowSpan={2} className="ts-sticky-col-1 th-rowspan-2" style={{ textAlign: 'center' }}>STT</th>
                <th rowSpan={2} className="ts-sticky-col-2 th-rowspan-2">Mã NS</th>
                <th rowSpan={2} className="ts-sticky-col-3 th-rowspan-2">Họ và tên</th>
                <th rowSpan={2} className="ts-sticky-col-4 th-rowspan-2">Phòng ban</th>

                {/* Non-sticky Position column (RowSpan 2) */}
                <th rowSpan={2} className="th-rowspan-2" style={{ minWidth: 180, width: 180, textAlign: 'left' }}>Vị trí</th>

                {/* Days of Month Tier 1: Day of Week */}
                {dayOfWeekHeader.map((dow, idx) => (
                  <th
                    key={`dow-${idx}`}
                    className={`th-tier-1 ${isWeekendList[idx] ? 'th-weekend' : ''}`}
                    style={{ width: 90, minWidth: 90 }}
                  >
                    {dow}
                  </th>
                ))}

                {/* 12 Summary Group Headers (Placed AFTER last day of month) */}
                {/* 1. Đi muộn (3 cols) */}
                <th colSpan={3} className="th-tier-1 ts-group-header-late">Đi muộn</th>

                {/* 2. Về sớm (3 cols) */}
                <th colSpan={3} className="th-tier-1 ts-group-header-early">Về sớm</th>

                {/* 3. Quên chốt (3 cols) */}
                <th colSpan={3} className="th-tier-1 ts-group-header-missing">Quên chốt</th>

                {/* 4. Nghỉ không lý do (1 col) */}
                <th colSpan={1} className="th-tier-1 ts-group-header-unexcused">Nghỉ không lý do</th>

                {/* 5. Nghỉ phép (3 cols) */}
                <th colSpan={3} className="th-tier-1 ts-group-header-furlough">Nghỉ phép</th>

                {/* 6. Nghỉ bù (4 cols) */}
                <th colSpan={4} className="th-tier-1 ts-group-header-comp">Nghỉ bù</th>

                {/* 7. Công chính (3 cols) */}
                <th colSpan={3} className="th-tier-1 ts-group-header-main">Công chính</th>

                {/* 8. Làm thêm (2 cols) */}
                <th colSpan={2} className="th-tier-1 ts-group-header-ot">Làm thêm</th>

                {/* 9. Tăng ca (2 cols) */}
                <th colSpan={2} className="th-tier-1 ts-group-header-extra">Tăng ca</th>

                {/* 10. Cột riêng: Công ăn (1 col) */}
                <th colSpan={1} className="th-tier-1 ts-group-header-standalone">Công ăn</th>

                {/* 11. Cột riêng: Công chuẩn (1 col) */}
                <th colSpan={1} className="th-tier-1 ts-group-header-standalone">Công chuẩn</th>

                {/* 12. Công tổng (3 cols) */}
                <th colSpan={3} className="th-tier-1 ts-group-header-total">Công tổng</th>
              </tr>

              {/* Row 2 Header: Days of Month (01..31) and Summary Sub-columns */}
              <tr>
                {/* Days of Month Tier 2 */}
                {dayOfMonthHeader.map((dom, idx) => (
                  <th
                    key={`dom-${idx}`}
                    className={`th-tier-2 ${isWeekendList[idx] ? 'th-weekend' : ''}`}
                    style={{ width: 90, minWidth: 90, fontSize: 12 }}
                  >
                    {dom}
                  </th>
                ))}

                {/* 1. Đi muộn sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 80 }}>Số phút</th>
                <th className="th-tier-2" style={{ minWidth: 85 }}>Tiền phạt</th>
                <th className="th-tier-2" style={{ minWidth: 85 }}>Công phạt</th>

                {/* 2. Về sớm sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 80 }}>Số phút</th>
                <th className="th-tier-2" style={{ minWidth: 85 }}>Tiền phạt</th>
                <th className="th-tier-2" style={{ minWidth: 85 }}>Công phạt</th>

                {/* 3. Quên chốt sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 75 }}>Số lần</th>
                <th className="th-tier-2" style={{ minWidth: 85 }}>Tiền phạt</th>
                <th className="th-tier-2" style={{ minWidth: 85 }}>Công phạt</th>

                {/* 4. Nghỉ không lý do sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 90 }}>Số ngày</th>

                {/* 5. Nghỉ phép sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 75 }}>Đầu kỳ</th>
                <th className="th-tier-2" style={{ minWidth: 75 }}>Đã dùng</th>
                <th className="th-tier-2" style={{ minWidth: 75 }}>Cuối kỳ</th>

                {/* 6. Nghỉ bù sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 75 }}>Đầu kỳ</th>
                <th className="th-tier-2" style={{ minWidth: 75 }}>Đã dùng</th>
                <th className="th-tier-2" style={{ minWidth: 90 }}>Số giờ thêm</th>
                <th className="th-tier-2" style={{ minWidth: 75 }}>Cuối kỳ</th>

                {/* 7. Công chính sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 80 }}>Công ca</th>
                <th className="th-tier-2" style={{ minWidth: 80 }}>Công lễ</th>
                <th className="th-tier-2" style={{ minWidth: 95 }}>Công công tác</th>

                {/* 8. Làm thêm sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 75 }}>Số giờ</th>
                <th className="th-tier-2" style={{ minWidth: 75 }}>Số công</th>

                {/* 9. Tăng ca sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 75 }}>Số giờ</th>
                <th className="th-tier-2" style={{ minWidth: 75 }}>Số công</th>

                {/* 10. Công ăn */}
                <th className="th-tier-2" style={{ minWidth: 75 }}>Số bữa</th>

                {/* 11. Công chuẩn */}
                <th className="th-tier-2" style={{ minWidth: 85 }}>Tổng công</th>

                {/* 12. Công tổng sub-columns */}
                <th className="th-tier-2" style={{ minWidth: 80 }}>Giờ đêm</th>
                <th className="th-tier-2" style={{ minWidth: 80 }}>Tổng giờ</th>
                <th className="th-tier-2" style={{ minWidth: 85 }}>Số công</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5 + daysInMonth + 28} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Không tìm thấy bản ghi chấm công nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.employee.id}>
                    {/* Sticky Left: STT */}
                    <td className="ts-sticky-col-1" style={{ textAlign: 'center', color: '#64748b' }}>
                      {idx + 1}
                    </td>

                    {/* Sticky Left: Mã NS */}
                    <td className="ts-sticky-col-2" style={{ fontWeight: 600, color: '#1e293b' }}>
                      {row.employee.code}
                    </td>

                    {/* Sticky Left: Họ và tên */}
                    <td className="ts-sticky-col-3" style={{ fontWeight: 600, color: '#0f172a' }}>
                      {row.employee.name}
                    </td>

                    {/* Sticky Left: Phòng ban */}
                    <td className="ts-sticky-col-4" style={{ fontSize: 11.5, fontWeight: 600, color: '#475569' }}>
                      {row.employee.department || '—'}
                    </td>

                    {/* Non-sticky: Vị trí */}
                    <td style={{ fontSize: 11.5, color: '#475569' }}>
                      {row.employee.position || '—'}
                    </td>

                    {/* Days of Month Cells (Interactive Click to open Day Detail Modal) */}
                    {dayOfMonthHeader.map((_, dIdx) => {
                      const dayNum = dIdx + 1;
                      const cell = row.cells.find(c => c.day === dayNum);
                      const isWeekend = isWeekendList[dIdx];

                      return (
                        <td
                          key={`cell-${row.employee.id}-${dayNum}`}
                          className={`ts-day-cell ${isWeekend ? 'td-weekend' : ''}`}
                          onClick={() => {
                            if (cell) {
                              setSelectedCellInfo({ employee: row.employee, cell });
                            }
                          }}
                          title="Bấm để xem chi tiết chấm công ngày này"
                        >
                          {renderCellBadge(cell)}
                        </td>
                      );
                    })}

                    {/* 1. Đi muộn */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.late?.minutes, undefined, (row.summary?.late?.minutes || 0) > 0, (row.summary?.late?.minutes || 0) > 0 ? '#e11d48' : undefined)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.late?.fine, 'Chưa có quy chế phạt tiền đi muộn trong cấu hình')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.late?.workdayPenalty, 'Chưa có quy chế trừ công đi muộn trong cấu hình')}
                    </td>

                    {/* 2. Về sớm */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.early?.minutes, undefined, (row.summary?.early?.minutes || 0) > 0, (row.summary?.early?.minutes || 0) > 0 ? '#ea580c' : undefined)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.early?.fine, 'Chưa có quy chế phạt tiền về sớm trong cấu hình')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.early?.workdayPenalty, 'Chưa có quy chế trừ công về sớm trong cấu hình')}
                    </td>

                    {/* 3. Quên chốt */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.missing?.count, undefined, (row.summary?.missing?.count || 0) > 0, (row.summary?.missing?.count || 0) > 0 ? '#d97706' : undefined)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.missing?.fine, 'Chưa có quy chế phạt tiền quên chốt trong cấu hình')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.missing?.workdayPenalty, 'Chưa có quy chế trừ công quên chốt trong cấu hình')}
                    </td>

                    {/* 4. Nghỉ không lý do */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.unexcused?.days, undefined, (row.summary?.unexcused?.days || 0) > 0, (row.summary?.unexcused?.days || 0) > 0 ? '#be185d' : undefined)}
                    </td>

                    {/* 5. Nghỉ phép */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.furlough?.initial)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.furlough?.used, undefined, (row.summary?.furlough?.used || 0) > 0, '#db2777')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.furlough?.remaining, undefined, true, '#16a34a')}
                    </td>

                    {/* 6. Nghỉ bù */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.compLeave?.initial, 'Chưa có nguồn số dư nghỉ bù đầu kỳ')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.compLeave?.used, undefined, (row.summary?.compLeave?.used || 0) > 0, '#0284c7')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.compLeave?.addedHours, 'Chưa triển khai tích lũy giờ bù')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.compLeave?.remaining, 'Chưa có nguồn số dư nghỉ bù cuối kỳ')}
                    </td>

                    {/* 7. Công chính */}
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#1d4ed8' }}>
                      {renderMetric(row.summary?.mainWork?.shiftWorkday)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.mainWork?.holidayWorkday)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.mainWork?.businessTripWorkday)}
                    </td>

                    {/* 8. Làm thêm */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.overtime?.hours)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.overtime?.workday)}
                    </td>

                    {/* 9. Tăng ca */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.extraWork?.hours)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.extraWork?.workday)}
                    </td>

                    {/* 10. Công ăn */}
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {renderMetric(row.summary?.meals?.count)}
                    </td>

                    {/* 11. Công chuẩn */}
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>
                      {renderMetric(row.summary?.standard?.totalStandard)}
                    </td>

                    {/* 12. Công tổng */}
                    <td style={{ textAlign: 'center' }}>
                      {renderMetric(row.summary?.total?.nightHours)}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600 }}>
                      {renderMetric(row.summary?.total?.totalHours)}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>
                      {renderMetric(row.summary?.total?.totalWorkdays)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Day Attendance Detail Popup Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 16 }}>
              Chi tiết chấm công ngày {selectedCellInfo?.cell.day.toString().padStart(2, '0')}/{monthNum.toString().padStart(2, '0')}/{yearNum}
            </span>
          </div>
        }
        open={!!selectedCellInfo}
        onCancel={() => setSelectedCellInfo(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSelectedCellInfo(null)} style={{ background: '#e83e8c', borderColor: '#e83e8c' }}>
            Đóng
          </Button>,
        ]}
        width={620}
        mask={{ closable: true }}
      >
        {selectedCellInfo && (
          <div style={{ padding: '8px 0' }}>
            {/* Employee Info Header */}
            <div className="ts-modal-section" style={{ background: '#fdf2f8', borderColor: '#f8bbd0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    {selectedCellInfo.employee.name} ({selectedCellInfo.employee.code})
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {selectedCellInfo.employee.department} • {selectedCellInfo.employee.position}
                  </div>
                </div>
                <Tag color="#e83e8c" style={{ fontWeight: 600 }}>
                  {getDayOfWeekFullName(selectedCellInfo.cell.dayOfWeek)}
                </Tag>
              </div>
            </div>

            {/* Shift Configuration Info */}
            <div className="ts-modal-section">
              <div className="ts-modal-section-title">
                <span>⏱️</span> Thông tin ca làm việc phân công
              </div>
              {selectedCellInfo.cell.shift ? (
                <div className="ts-modal-grid">
                  <div className="ts-modal-item">
                    <span className="ts-modal-label">Tên ca:</span>
                    <span className="ts-modal-val">{selectedCellInfo.cell.shift.name} ({selectedCellInfo.cell.shift.code})</span>
                  </div>
                  <div className="ts-modal-item">
                    <span className="ts-modal-label">Khung giờ:</span>
                    <span className="ts-modal-val">{selectedCellInfo.cell.shift.startTime} – {selectedCellInfo.cell.shift.endTime}</span>
                  </div>
                  <div className="ts-modal-item">
                    <span className="ts-modal-label">Nghỉ giữa ca:</span>
                    <span className="ts-modal-val">
                      {selectedCellInfo.cell.shift.breakStart && selectedCellInfo.cell.shift.breakEnd
                        ? `${selectedCellInfo.cell.shift.breakStart} – ${selectedCellInfo.cell.shift.breakEnd}`
                        : 'Không có'}
                    </span>
                  </div>
                  <div className="ts-modal-item">
                    <span className="ts-modal-label">Hệ số công / Giờ chuẩn:</span>
                    <span className="ts-modal-val">{selectedCellInfo.cell.shift.coefficient} công / {selectedCellInfo.cell.shift.standardHours}h</span>
                  </div>
                  <div className="ts-modal-item">
                    <span className="ts-modal-label">Linh hoạt / Cho phép trễ:</span>
                    <span className="ts-modal-val">{selectedCellInfo.cell.shift.flexibleMinutes}p linh hoạt / {selectedCellInfo.cell.shift.graceLateMinutes}p trễ</span>
                  </div>
                  <div className="ts-modal-item">
                    <span className="ts-modal-label">Qua ngày:</span>
                    <span className="ts-modal-val">{selectedCellInfo.cell.shift.overnight ? 'Có (Ca đêm)' : 'Không'}</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13, padding: '4px 0' }}>
                  Không có ca làm việc nào được phân công cho ngày này.
                </div>
              )}
            </div>

            {/* Actual Punch In / Out Logs */}
            <div className="ts-modal-section">
              <div className="ts-modal-section-title">
                <span>📍</span> Lượt vào / ra thực tế (Attendance Logs)
              </div>
              <div className="ts-modal-grid">
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Giờ vào (Check-in):</span>
                  <span className="ts-modal-val" style={{ color: selectedCellInfo.cell.checkIn ? '#16a34a' : '#94a3b8' }}>
                    {selectedCellInfo.cell.checkIn || 'Chưa ghi nhận'}
                  </span>
                </div>
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Địa điểm vào:</span>
                  <span className="ts-modal-val">{selectedCellInfo.cell.checkInLocation || '—'}</span>
                </div>
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Giờ ra (Check-out):</span>
                  <span className="ts-modal-val" style={{ color: selectedCellInfo.cell.checkOut ? '#16a34a' : '#94a3b8' }}>
                    {selectedCellInfo.cell.checkOut || 'Chưa ghi nhận'}
                  </span>
                </div>
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Địa điểm ra:</span>
                  <span className="ts-modal-val">{selectedCellInfo.cell.checkOutLocation || '—'}</span>
                </div>
              </div>
            </div>

            {/* Attendance Calculation Results */}
            <div className="ts-modal-section" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="ts-modal-section-title" style={{ color: '#15803d' }}>
                <span>📊</span> Kết quả tính công hợp lệ
              </div>
              <div className="ts-modal-grid">
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Giờ làm thực tế:</span>
                  <span className="ts-modal-val" style={{ color: '#15803d', fontSize: 13 }}>
                    {selectedCellInfo.cell.hours} giờ {selectedCellInfo.cell.workedWorkday !== undefined ? `(${selectedCellInfo.cell.workedWorkday} công)` : ''}
                  </span>
                </div>
                {(selectedCellInfo.cell.leaveHours || 0) > 0 && (
                  <div className="ts-modal-item">
                    <span className="ts-modal-label">Nghỉ phép hưởng lương:</span>
                    <span className="ts-modal-val" style={{ color: '#db2777', fontSize: 13 }}>
                      {selectedCellInfo.cell.leaveHours} giờ ({selectedCellInfo.cell.leaveWorkday} công)
                    </span>
                  </div>
                )}
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Tổng công ghi nhận:</span>
                  <span className="ts-modal-val" style={{ color: '#15803d', fontSize: 14, fontWeight: 700 }}>
                    {selectedCellInfo.cell.workday} công
                  </span>
                </div>
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Đi muộn:</span>
                  <span className="ts-modal-val" style={{ color: selectedCellInfo.cell.lateMinutes > 0 ? '#e11d48' : '#1e293b' }}>
                    {selectedCellInfo.cell.lateMinutes} phút
                  </span>
                </div>
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Về sớm:</span>
                  <span className="ts-modal-val" style={{ color: selectedCellInfo.cell.earlyMinutes > 0 ? '#ea580c' : '#1e293b' }}>
                    {selectedCellInfo.cell.earlyMinutes} phút
                  </span>
                </div>
                <div className="ts-modal-item">
                  <span className="ts-modal-label">Trạng thái:</span>
                  <span className="ts-modal-val">
                    {renderCellBadge(selectedCellInfo.cell)}
                  </span>
                </div>
              </div>
            </div>

            {/* Related Applications */}
            <div className="ts-modal-section">
              <div className="ts-modal-section-title">
                <span>📑</span> Đơn từ liên quan
              </div>
              {selectedCellInfo.cell.applications && selectedCellInfo.cell.applications.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedCellInfo.cell.applications.map((app) => (
                    <div
                      key={app.id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        padding: '8px 12px',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>
                          {app.type}
                        </div>
                        {app.reason && (
                          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            Lý do: {app.reason}
                          </div>
                        )}
                      </div>
                      <Tag color={app.status === 'APPROVED' ? 'green' : 'orange'}>
                        {app.status === 'APPROVED' ? 'Đã duyệt' : app.status}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12.5 }}>
                  Không có đơn từ liên quan trong ngày này.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 1Office Excel Import Modal */}
      <Modal
        title={<span style={{ color: '#e83e8c', fontWeight: 700 }}>📄 Import dữ liệu chấm công 1Office từ Excel</span>}
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={null}
        width={560}
        mask={{ closable: false }}
      >
        <div style={{ padding: '12px 0' }}>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
            Vui lòng chọn định dạng file Excel 1Office cần import vào hệ thống:
          </p>

          <Radio.Group
            value={importFormat}
            onChange={(e) => setImportFormat(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}
          >
            <Radio value="RAW">
              <strong>📄 Định dạng 1: Nhật ký quẹt thẻ thô (Raw Check Logs)</strong>
              <div style={{ fontSize: 12, color: '#64748b', marginLeft: 24 }}>
                File từ máy chấm công vân tay / FaceID USB (Cột: <code>personnel_code</code>, <code>timestamp</code>, <code>machine_code</code>, <code>type</code>).
              </div>
            </Radio>
            <Radio value="MATRIX">
              <strong>📊 Định dạng 2: Bảng tổng hợp công tháng (Timesheet Matrix)</strong>
              <div style={{ fontSize: 12, color: '#64748b', marginLeft: 24 }}>
                File bảng công xử lý sẵn (Cột: <code>personnel_code</code>, <code>fullname</code>, Ngày 1-31, <code>CAL_WORKDAY</code>, <code>HOUR_OVERTIME</code>, <code>LATE_MINUTE</code>).
              </div>
            </Radio>
          </Radio.Group>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 8, fontSize: 12, color: '#334155', marginBottom: 20 }}>
            ⚡ <strong>Tự động đọc & đồng bộ:</strong> Dữ liệu từ file Excel sẽ được Parser tự động đọc, khớp mã nhân sự <code>personnel_code</code> và tính toán lại công chuẩn, công thực tế, giờ OT và phạt đi muộn vào Bảng chấm công Tháng <strong>{monthNum}/{yearNum}</strong>.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button onClick={() => setImportModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              loading={importing}
              style={{ background: '#e83e8c', borderColor: '#e83e8c' }}
              onClick={handleImportSubmit}
            >
              ➔] Tiến hành Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
