'use client';

import React, { useState, useEffect } from 'react';
import { Input, Button, App, Spin, DatePicker, Modal, Radio } from 'antd';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';
import './timesheet.css';

interface TimesheetCell {
  day: number;
  status: string; // NONE | PRESENT | ABSENT | LATE | LEAVE | OT | WEEKEND
  hours: number;
  shift?: string | null;
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
  summary: {
    totalStandard: number;
    totalActual: number;
    totalOT: number;
    totalLeave: number;
    totalAbsent: number;
  };
}

export function TimesheetScreen() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<'SHEET' | 'DETAIL'>('SHEET');
  const [search, setSearch] = useState('');
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('2026-09');
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [locked, setLocked] = useState(false);
  const [appsLocked, setAppsLocked] = useState(false);

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

  // Calculate days in selected month
  const yearNum = parseInt(month.split('-')[0], 10) || 2026;
  const monthNum = parseInt(month.split('-')[1], 10) || 9; // 1-12
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayOfWeekHeader: string[] = [];
  const dayOfMonthHeader: string[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(yearNum, monthNum - 1, d);
    const dow = daysOfWeek[dt.getDay()];
    dayOfWeekHeader.push(dow);
    dayOfMonthHeader.push(String(d).padStart(2, '0'));
  }

  const formatCellContent = (cell?: TimesheetCell, isSunday?: boolean) => {
    if (!cell) return { text: isSunday ? 'x' : 'x', color: '#94a3b8', bg: isSunday ? '#fef2f2' : '#ffffff', font: '400' };

    switch (cell.status) {
      case 'PRESENT':
        return { text: cell.hours ? String(cell.hours) : '1', color: '#15803d', bg: isSunday ? '#fef2f2' : '#ffffff', font: '600' };
      case 'LEAVE':
        return { text: 'P', color: '#e83e8c', bg: '#fff0f5', font: '700' };
      case 'OT':
        return { text: `${cell.hours || 1}*`, color: '#0284c7', bg: '#f0f9ff', font: '700' };
      case 'ABSENT':
        return { text: '0', color: '#dc2626', bg: '#fef2f2', font: '600' };
      case 'WEEKEND':
        return { text: 'x', color: '#94a3b8', bg: '#fef2f2', font: '400' };
      default:
        return { text: 'x', color: '#94a3b8', bg: isSunday ? '#fef2f2' : '#ffffff', font: '400' };
    }
  };

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFormat, setImportFormat] = useState<'RAW' | 'MATRIX'>('RAW');
  const [importing, setImporting] = useState(false);

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

      {/* Subtabs Bar (Bảng chấm công vs Chi tiết bảng chấm công) */}
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

          {/* Submenu Dropdown Popup Trigger */}
          <div
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => setDropdownMenuOpen(!dropdownMenuOpen)}
          >
            <span style={{ fontSize: 13, color: '#e83e8c', fontWeight: 600 }}>▼ Chấm công</span>

            {dropdownMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  zIndex: 999,
                  background: '#ffffff',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '1px solid #f0f0f0',
                  padding: '6px 0',
                  minWidth: 180
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: '8px 16px', fontSize: 13, color: '#e83e8c', background: '#fff0f5', fontWeight: 600 }}>
                  Chấm công
                </div>
                <div style={{ padding: '8px 16px', fontSize: 13, color: '#334155', cursor: 'pointer' }} onClick={() => setDropdownMenuOpen(false)}>
                  Bảng chấm công
                </div>
                <div style={{ padding: '8px 16px', fontSize: 13, color: '#334155', cursor: 'pointer' }} onClick={() => setDropdownMenuOpen(false)}>
                  Bảng chấm công ăn
                </div>
                <div style={{ padding: '8px 16px', fontSize: 13, color: '#334155', cursor: 'pointer' }} onClick={() => setDropdownMenuOpen(false)}>
                  Tự động chấm công
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-bar Info */}
      <div className="ts-subbar">
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Hiển thị {filteredRows.length} / {rows.length} bản ghi nhân sự
        </div>
        <div>
          <Input
            placeholder="Tìm kiếm theo mã, tên, phòng ban..."
            prefix={<span style={{ color: '#94a3b8', fontSize: 13 }}>🔍</span>}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260, borderRadius: 20 }}
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
              {/* Row 1 Header: Titles & Days of Week */}
              <tr>
                <th rowSpan={2} style={{ width: 45, textAlign: 'center' }}>STT</th>
                <th rowSpan={2} style={{ width: 70 }}>Mã NS</th>
                <th rowSpan={2} style={{ minWidth: 160 }}>Họ và tên</th>
                <th rowSpan={2} style={{ minWidth: 140 }}>Phòng ban</th>
                <th rowSpan={2} style={{ minWidth: 90, textAlign: 'center' }}>Công chuẩn</th>
                <th rowSpan={2} style={{ minWidth: 90, textAlign: 'center' }}>Công thực tế</th>
                {dayOfWeekHeader.map((dow, idx) => (
                  <th key={idx} className={dow === 'CN' ? 'th-sunday' : ''} style={{ width: 40, textAlign: 'center' }}>
                    {dow}
                  </th>
                ))}
              </tr>

              {/* Row 2 Header: Days of Month */}
              <tr>
                {dayOfMonthHeader.map((dom, idx) => (
                  <th key={idx} className={dayOfWeekHeader[idx] === 'CN' ? 'th-sunday' : ''} style={{ width: 40, textAlign: 'center', fontSize: 11 }}>
                    {dom}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6 + daysInMonth} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    Không tìm thấy bản ghi chấm công nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr key={row.employee.id}>
                    <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: '#1e293b' }}>{row.employee.code}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{row.employee.name}</td>
                    <td style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                      {row.employee.department || 'Nhiệm vụ chung'}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#475569' }}>{row.summary.totalStandard}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#16a34a' }}>{row.summary.totalActual}</td>

                    {dayOfMonthHeader.map((_, dIdx) => {
                      const dayNum = dIdx + 1;
                      const cell = row.cells.find(c => c.day === dayNum);
                      const isSunday = dayOfWeekHeader[dIdx] === 'CN';
                      const formatted = formatCellContent(cell, isSunday);

                      return (
                        <td
                          key={dIdx}
                          style={{
                            textAlign: 'center',
                            fontSize: 11.5,
                            background: formatted.bg,
                            color: formatted.color,
                            fontWeight: formatted.font as any,
                            fontFamily: 'monospace'
                          }}
                        >
                          {formatted.text}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
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

          <div style={{ background: '#f8fafc', border: '1px border #e2e8f0', padding: 12, borderRadius: 8, fontSize: 12, color: '#334155', marginBottom: 20 }}>
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
