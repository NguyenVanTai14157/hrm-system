'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Modal, Button, Select, Input, message } from 'antd';
import {
  SwapOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/components/auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';
import './attendance.css';

// Dynamic color mapping for shift codes
const SHIFT_COLOR_MAP: Record<string, { bg: string; color: string }> = {
  green: { bg: '#dcfce7', color: '#15803d' },
  blue: { bg: '#dbeafe', color: '#1d4ed8' },
  gold: { bg: '#fef9c3', color: '#a16207' },
  purple: { bg: '#f3e8ff', color: '#7c3aed' },
  orange: { bg: '#ffedd5', color: '#c2410c' },
  red: { bg: '#fee2e2', color: '#dc2626' },
  cyan: { bg: '#cffafe', color: '#0891b2' },
};

interface ShiftInfo {
  id: string;
  code: string;
  name: string;
  color: string;
  startTime?: string;
  endTime?: string;
}

interface EmployeeRow {
  id: string;
  code: string;
  name: string;
  department: string;
  avatar: string;
}

interface CellSelection {
  emp: EmployeeRow;
  day: number;
  dateStr: string;
  shiftInfo: ShiftInfo | null;
}

export function ShiftAssignmentScreen() {
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Record<number, ShiftInfo>>>({});
  const [shiftMap, setShiftMap] = useState<Record<string, ShiftInfo>>({});
  const [allShifts, setAllShifts] = useState<ShiftInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Interactive Click Cell states (1Office Quick Actions)
  const [selectedCell, setSelectedCell] = useState<CellSelection | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Swap Form state
  const [swapTargetEmpId, setSwapTargetEmpId] = useState<string>('');
  const [swapTargetShiftId, setSwapTargetShiftId] = useState<string>('');
  const [swapReason, setSwapReason] = useState<string>('');

  // Leave Form state
  const [leaveType, setLeaveType] = useState<string>('Nghỉ phép năm');
  const [leaveReason, setLeaveReason] = useState<string>('');
  const [submittingApp, setSubmittingApp] = useState<boolean>(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                      'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const dayNames = ['CN','T2','T3','T4','T5','T6','T7'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [shiftsRes, assignRes] = await Promise.all([
        apiClient.get('/attendance/shifts'),
        apiClient.get(`/attendance/shift-assignments?month=${monthStr}`),
      ]);

      const shiftsData = (shiftsRes.data || []) as any[];
      const sMap: Record<string, ShiftInfo> = {};
      const sList: ShiftInfo[] = [];
      for (const s of shiftsData) {
        const item: ShiftInfo = {
          id: s.id,
          code: s.code,
          name: s.name,
          color: s.color || 'green',
          startTime: s.startTime,
          endTime: s.endTime,
        };
        sMap[s.id] = item;
        sList.push(item);
      }
      setShiftMap(sMap);
      setAllShifts(sList);

      const assignData = (assignRes.data || []) as any[];
      const empMap: Record<string, EmployeeRow> = {};
      const gridMap: Record<string, Record<number, ShiftInfo>> = {};

      for (const a of assignData) {
        const empId = a.employee?.id || a.employeeId;
        if (!empId) continue;

        if (!empMap[empId] && a.employee) {
          empMap[empId] = {
            id: empId,
            code: a.employee.code || '',
            name: a.employee.name || '',
            department: a.employee.department?.name || '',
            avatar: a.employee.name ? a.employee.name.charAt(a.employee.name.length - 1) : '?',
          };
        }

        const day = new Date(a.date).getDate();
        const shiftInfo = a.shift
          ? {
              id: a.shift.id,
              code: a.shift.code,
              name: a.shift.name,
              color: a.shift.color || 'green',
              startTime: a.shift.startTime,
              endTime: a.shift.endTime,
            }
          : sMap[a.shiftId];

        if (shiftInfo) {
          if (!gridMap[empId]) gridMap[empId] = {};
          gridMap[empId][day] = shiftInfo;
        }
      }

      setEmployees(Object.values(empMap).sort((a, b) => a.name.localeCompare(b.name)));
      setAssignments(gridMap);
    } catch (err) {
      console.error(err);
      message.error('Không thể tải dữ liệu bảng phân ca');
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const usedShifts = new Map<string, ShiftInfo>();
  for (const empAssign of Object.values(assignments)) {
    for (const shift of Object.values(empAssign)) {
      usedShifts.set(shift.id, shift);
    }
  }

  // Handle cell click (1Office prompt mechanism)
  const handleCellClick = (emp: EmployeeRow, day: number, shiftInfo: ShiftInfo | null) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedCell({ emp, day, dateStr, shiftInfo });
    setDetailModalOpen(true);
  };

  // Submit Swap Request
  const handleSendSwapRequest = async () => {
    if (!selectedCell) return;
    if (!swapTargetEmpId) {
      message.warning('Vui lòng chọn đồng nghiệp muốn đổi ca');
      return;
    }
    setSubmittingApp(true);
    try {
      const targetEmp = employees.find((e) => e.id === swapTargetEmpId);
      const targetShift = allShifts.find((s) => s.id === swapTargetShiftId);

      await apiClient.post('/applications', {
        employeeId: selectedCell.emp.id,
        type: 'Đơn đổi ca',
        reason: swapReason || 'Đề xuất đổi ca làm việc theo lịch',
        payload: {
          date: selectedCell.dateStr,
          currentShift: selectedCell.shiftInfo?.name || 'Ca hiện tại',
          targetEmployeeId: swapTargetEmpId,
          targetEmployeeName: targetEmp?.name || '',
          targetShiftId: swapTargetShiftId || '',
          targetShiftName: targetShift?.name || '',
          reason: swapReason,
        },
      });
      message.success('✅ Đã gửi đơn đổi ca thành công!');
      setSwapModalOpen(false);
      setDetailModalOpen(false);
      setSelectedCell(null);
      setSwapReason('');
      setSwapTargetEmpId('');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể gửi đơn đổi ca');
    } finally {
      setSubmittingApp(false);
    }
  };

  // Submit Leave Request
  const handleSendLeaveRequest = async () => {
    if (!selectedCell) return;
    setSubmittingApp(true);
    try {
      await apiClient.post('/applications', {
        employeeId: selectedCell.emp.id,
        type: 'Đơn xin nghỉ phép',
        reason: `${leaveType}: ${leaveReason || 'Nghỉ theo kế hoạch cá nhân'}`,
        payload: {
          date: selectedCell.dateStr,
          leaveType,
          reason: leaveReason,
        },
      });
      message.success('✅ Đã gửi đơn xin nghỉ phép thành công!');
      setLeaveModalOpen(false);
      setDetailModalOpen(false);
      setSelectedCell(null);
      setLeaveReason('');
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Không thể gửi đơn xin nghỉ phép');
    } finally {
      setSubmittingApp(false);
    }
  };

  return (
    <div className="att-container">
      {/* Top Header */}
      <div className="att-header">
        <div>
          <h2 className="att-title">Bảng phân ca làm việc</h2>
          <p className="att-subtitle">
            {isAdmin
              ? 'Lịch phân ca chi tiết toàn bộ nhân sự theo tháng.'
              : 'Lịch làm việc của bạn và đồng nghiệp. Bấm trực tiếp vào ô ca để tạo Đơn đổi ca hoặc Đơn xin nghỉ.'}
          </p>
        </div>
        <div className="att-actions">
          <div className="att-month-nav">
            <button className="att-btn-nav" onClick={prevMonth}>‹</button>
            <span className="att-current-month">{monthNames[month]} {year}</span>
            <button className="att-btn-nav" onClick={nextMonth}>›</button>
          </div>
          <button className="att-btn-secondary" onClick={() => message.info('Xuất Excel bảng phân ca...')}>
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Empty state */}
      {employees.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ color: '#1e293b', marginBottom: 8 }}>Chưa có dữ liệu phân ca trong tháng này</h3>
          <p>
            Vào <strong>Phân ca làm việc</strong> → Bấm <strong>"Phân ca cho Nhân viên"</strong> để gán ca cho nhân viên hoặc phòng ban.
          </p>
        </div>
      )}

      {employees.length > 0 && (
        <>
          {/* Legend */}
          <div className="att-legend">
            {Array.from(usedShifts.values()).map((s) => {
              const colors = SHIFT_COLOR_MAP[s.color] || SHIFT_COLOR_MAP['green'];
              return (
                <span key={s.id} className="att-legend-item">
                  <span className="att-badge" style={{ background: colors.bg, color: colors.color }}>{s.code}</span>
                  <span>{s.name}</span>
                </span>
              );
            })}
            <span className="att-legend-item">
              <span className="att-badge" style={{ background: '#fee2e2', color: '#991b1b' }}>CN</span>
              <span>Cuối tuần</span>
            </span>
          </div>

          {/* Table */}
          <div className="att-table-card">
            <div className="att-table-scroll">
              <table className="att-table">
                <thead>
                  <tr>
                    <th className="sticky-col">Nhân viên</th>
                    {days.map((day) => {
                      const d = new Date(year, month, day);
                      const dow = d.getDay();
                      const isWeekend = dow === 0 || dow === 6;
                      return (
                        <th key={day} className={isWeekend ? 'att-th-weekend' : ''}>
                          <div className="att-th-day">{day}</div>
                          <div className="att-th-dow">{dayNames[dow]}</div>
                        </th>
                      );
                    })}
                    <th className="att-th-summary">Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => {
                    const empAssign = assignments[emp.id] || {};
                    const totalShifts = Object.keys(empAssign).length;
                    const isCurrentUser = user?.employeeId === emp.id;

                    return (
                      <tr key={emp.id} style={{ background: isCurrentUser ? '#faf5ff' : undefined }}>
                        <td className="sticky-col">
                          <div className="att-employee-row">
                            <div className="att-avatar" style={{ background: isCurrentUser ? '#7c3aed' : undefined }}>
                              {emp.avatar}
                            </div>
                            <div>
                              <div className="att-employee-name">
                                {emp.name} {isCurrentUser && <Tag color="purple" style={{ fontSize: 10, borderRadius: 4, marginLeft: 4 }}>Tôi</Tag>}
                              </div>
                              <div className="att-employee-meta">{emp.code} · {emp.department}</div>
                            </div>
                          </div>
                        </td>
                        {days.map((day) => {
                          const d = new Date(year, month, day);
                          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                          const shiftInfo = empAssign[day];
                          const colors = shiftInfo ? SHIFT_COLOR_MAP[shiftInfo.color] || SHIFT_COLOR_MAP['green'] : null;

                          return (
                            <td
                              key={day}
                              className={isWeekend ? 'att-td-weekend' : ''}
                              style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                              onClick={() => handleCellClick(emp, day, shiftInfo || null)}
                              title="Bấm để xem chi tiết ca, tạo đơn đổi ca hoặc xin nghỉ"
                            >
                              {shiftInfo ? (
                                <span
                                  className="att-badge"
                                  style={{
                                    background: colors!.bg,
                                    color: colors!.color,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    display: 'inline-block',
                                    transition: 'transform 0.1s'
                                  }}
                                >
                                  {shiftInfo.code}
                                </span>
                              ) : (
                                <span className="att-empty-cell" style={{ color: '#cbd5e1' }}>—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="att-td-summary">
                          <span className="att-total-badge">{totalShifts}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 1Office Cell Detail Modal (Popup chi tiết ca làm việc) */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#e83e8c' }} />
            <span>Chi tiết ca làm việc</span>
          </div>
        }
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={420}
      >
        {selectedCell && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 10 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                {selectedCell.emp.name} ({selectedCell.emp.code})
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Phòng ban: <strong>{selectedCell.emp.department || 'Cửa hàng 126'}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Ngày làm việc: <strong>Ngày {selectedCell.day} / {month + 1} / {year}</strong>
              </div>
            </div>

            <div style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Ca được phân:</div>
              {selectedCell.shiftInfo ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                      {selectedCell.shiftInfo.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                      ⏰ Giờ làm: {selectedCell.shiftInfo.startTime || '08:00'} - {selectedCell.shiftInfo.endTime || '16:00'}
                    </div>
                  </div>
                  <Tag color={selectedCell.shiftInfo.color || 'blue'} style={{ fontSize: 13, padding: '4px 10px', borderRadius: 6, fontWeight: 700 }}>
                    {selectedCell.shiftInfo.code}
                  </Tag>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>
                  Ngày này nhân viên chưa được phân ca (hoặc nghỉ tuần).
                </div>
              )}
            </div>

            {/* Quick Actions (Chuẩn 1Office AI) */}
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <Button
                icon={<SwapOutlined />}
                block
                style={{
                  background: '#eff6ff',
                  borderColor: '#bfdbfe',
                  color: '#1d4ed8',
                  fontWeight: 600,
                  height: 38,
                  borderRadius: 8
                }}
                onClick={() => {
                  setSwapModalOpen(true);
                  setDetailModalOpen(false);
                }}
              >
                Tạo đơn đổi ca
              </Button>
              <Button
                icon={<FileTextOutlined />}
                block
                style={{
                  background: '#fef2f2',
                  borderColor: '#fecaca',
                  color: '#dc2626',
                  fontWeight: 600,
                  height: 38,
                  borderRadius: 8
                }}
                onClick={() => {
                  setLeaveModalOpen(true);
                  setDetailModalOpen(false);
                }}
              >
                Tạo đơn xin nghỉ
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Sub-modal: Tạo đơn đổi ca */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SwapOutlined style={{ color: '#2563eb' }} />
            <span>Tạo đơn đổi ca làm việc</span>
          </div>
        }
        open={swapModalOpen}
        onCancel={() => setSwapModalOpen(false)}
        onOk={handleSendSwapRequest}
        okText="Gửi đề xuất đổi ca"
        confirmLoading={submittingApp}
        width={480}
      >
        {selectedCell && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Người gửi đề xuất:
              </label>
              <Input value={`${selectedCell.emp.name} (${selectedCell.emp.code})`} disabled />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Ngày muốn đổi:
                </label>
                <Input value={selectedCell.dateStr} disabled />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Ca hiện tại:
                </label>
                <Input value={selectedCell.shiftInfo?.name || 'Chưa phân ca'} disabled />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Chọn đồng nghiệp muốn đổi ca <span style={{ color: '#ef4444' }}>*</span>:
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn nhân viên đổi ca..."
                value={swapTargetEmpId || undefined}
                onChange={setSwapTargetEmpId}
                options={employees
                  .filter((e) => e.id !== selectedCell.emp.id)
                  .map((e) => ({
                    value: e.id,
                    label: `${e.name} (${e.code}) - ${e.department}`,
                  }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Ca muốn làm:
              </label>
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn ca muốn nhận..."
                value={swapTargetShiftId || undefined}
                onChange={setSwapTargetShiftId}
                options={allShifts.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                }))}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Lý do đổi ca:
              </label>
              <Input.TextArea
                rows={2}
                placeholder="Nhập lý do đổi ca làm việc..."
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Sub-modal: Tạo đơn xin nghỉ phép */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#dc2626' }} />
            <span>Tạo đơn xin nghỉ phép</span>
          </div>
        }
        open={leaveModalOpen}
        onCancel={() => setLeaveModalOpen(false)}
        onOk={handleSendLeaveRequest}
        okText="Gửi đơn xin nghỉ"
        confirmLoading={submittingApp}
        width={480}
      >
        {selectedCell && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Người xin nghỉ:
              </label>
              <Input value={`${selectedCell.emp.name} (${selectedCell.emp.code})`} disabled />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Ngày xin nghỉ:
                </label>
                <Input value={selectedCell.dateStr} disabled />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Loại nghỉ:
                </label>
                <Select
                  style={{ width: '100%' }}
                  value={leaveType}
                  onChange={setLeaveType}
                  options={[
                    { value: 'Nghỉ phép năm', label: 'Nghỉ phép năm' },
                    { value: 'Nghỉ không lương', label: 'Nghỉ không lương' },
                    { value: 'Nghỉ ốm đau', label: 'Nghỉ ốm đau' },
                    { value: 'Nghỉ việc riêng (kết hôn, tang chế...)', label: 'Nghỉ việc riêng' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>
                Lý do xin nghỉ:
              </label>
              <Input.TextArea
                rows={3}
                placeholder="Nhập lý do xin nghỉ phép..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
