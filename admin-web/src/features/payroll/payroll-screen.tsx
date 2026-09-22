'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from 'antd';
import './payroll.css';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                 'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

function fmtMoney(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
}

const DEMO_TEMPLATES = [
  { id: 'tpl1', name: 'Nhân viên cửa hàng' },
  { id: 'tpl2', name: 'Nhân viên văn phòng' },
];

const DEMO_PAYROLLS = [
  {
    id: 'pr1', name: 'Bảng lương Tháng 9/2026 - Cửa hàng', month: '2026-09',
    status: 'CALCULATED', totalAmount: 125000000,
    template: { name: 'Nhân viên cửa hàng' },
  },
  {
    id: 'pr2', name: 'Bảng lương Tháng 9/2026 - Văn phòng', month: '2026-09',
    status: 'APPROVED', totalAmount: 85000000,
    template: { name: 'Nhân viên văn phòng' },
  },
];

const DEMO_RECORDS = [
  { id: 'r1', employee: { id: 'emp1', code: 'NV01', name: 'TEST Nguyễn Văn A', department: { name: 'Phòng Kỹ Thuật' } }, baseSalary: 8000000, actualWorkDays: 22, standardWorkDays: 26, otHours: 8, grossSalary: 9200000, deductions: 740000, netSalary: 8460000, status: 'CALCULATED' },
  { id: 'r2', employee: { id: 'emp2', code: 'NV02', name: 'Nguyễn Thị B', department: { name: 'Phòng Kế Toán' } }, baseSalary: 9000000, actualWorkDays: 25, standardWorkDays: 26, otHours: 0, grossSalary: 9800000, deductions: 810000, netSalary: 8990000, status: 'CALCULATED' },
  { id: 'r3', employee: { id: 'emp3', code: 'NV03', name: 'Trần Văn C', department: { name: 'Phòng Marketing' } }, baseSalary: 10000000, actualWorkDays: 24, standardWorkDays: 26, otHours: 16, grossSalary: 11500000, deductions: 900000, netSalary: 10600000, status: 'CALCULATED' },
  { id: 'r4', employee: { id: 'emp4', code: 'NV04', name: 'Lê Thị D', department: { name: 'Kinh Doanh' } }, baseSalary: 7500000, actualWorkDays: 20, standardWorkDays: 26, otHours: 0, grossSalary: 6500000, deductions: 650000, netSalary: 5850000, status: 'CALCULATED' },
];

export function PayrollScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', templateId: '' });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('hrm_token');
      const [prRes, tplRes] = await Promise.all([
        fetch(`${API}/payroll?month=${monthStr}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/payroll/templates`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!prRes.ok || !tplRes.ok) throw new Error();
      const [prs, tpls] = await Promise.all([prRes.json(), tplRes.json()]);
      setPayrolls(prs);
      setTemplates(tpls);
    } catch {
      setPayrolls(DEMO_PAYROLLS.filter(p => p.month === monthStr));
      setTemplates(DEMO_TEMPLATES);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => { fetchData(); setSelectedPayroll(null); setRecords([]); }, [fetchData]);

  const selectPayroll = async (p: any) => {
    setSelectedPayroll(p);
    try {
      const token = localStorage.getItem('hrm_token');
      const res = await fetch(`${API}/payroll/${p.id}/records`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setRecords(await res.json());
    } catch {
      setRecords(DEMO_RECORDS);
    }
  };

  const createPayroll = async () => {
    try {
      const token = localStorage.getItem('hrm_token');
      const res = await fetch(`${API}/payroll`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, month: monthStr }),
      });
      if (res.ok) { fetchData(); setShowCreateModal(false); setForm({ name: '', templateId: '' }); }
    } catch {
      // Demo: just add to list
      setPayrolls(prev => [...prev, { id: Date.now().toString(), ...form, month: monthStr, status: 'DRAFT', totalAmount: 0, template: { name: form.templateId } }]);
      setShowCreateModal(false);
    }
  };

  const approvePayroll = async (id: string) => {
    try {
      const token = localStorage.getItem('hrm_token');
      await fetch(`${API}/payroll/${id}/approve`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } });
    } catch {}
    setPayrolls(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    if (selectedPayroll?.id === id) setSelectedPayroll((prev: any) => ({ ...prev, status: 'APPROVED' }));
  };

  const totalNet = records.reduce((s, r) => s + (r.netSalary ?? 0), 0);
  const totalGross = records.reduce((s, r) => s + (r.grossSalary ?? 0), 0);
  const totalDeductions = records.reduce((s, r) => s + (r.deductions ?? 0), 0);

  if (loading) {
    return <div className="payroll-container"><div className="pr-loading"><div className="pr-spinner" /><span>Đang tải bảng lương...</span></div></div>;
  }

  return (
    <div className="payroll-container">
      {/* Header */}
      <div className="pr-header">
        <div>
          <h1>Bảng Lương</h1>
          <p>{payrolls.length} bảng lương • {MONTHS[month]} {year}</p>
        </div>
        <div className="pr-header-actions">
          <div className="pr-month-nav">
            <button className="pr-nav-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>&#8249;</button>
            <span className="pr-month-label">{MONTHS[month]} {year}</span>
            <button className="pr-nav-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>&#8250;</button>
          </div>
          <button className="pr-btn-primary" onClick={() => setShowCreateModal(true)}>+ Tạo Bảng Lương</button>
        </div>
      </div>

      {/* Summary */}
      <div className="pr-stats">
        <div className="pr-stat-card">
          <div className="label">Tổng bảng lương</div>
          <div className="value">{payrolls.length}</div>
        </div>
        <div className="pr-stat-card purple">
          <div className="label">Tổng lương Gross</div>
          <div className="value">{fmtMoney(payrolls.reduce((s, p) => s + (p.totalAmount ?? 0), 0))}</div>
        </div>
        <div className="pr-stat-card green">
          <div className="label">Đã duyệt</div>
          <div className="value">{payrolls.filter(p => p.status === 'APPROVED').length}</div>
        </div>
        <div className="pr-stat-card blue">
          <div className="label">Nhân viên</div>
          <div className="value">{records.length > 0 ? records.length : '—'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: Payroll list */}
        <div style={{ flex: '0 0 340px' }}>
          <div className="pr-list">
            {payrolls.map(p => (
              <div key={p.id} className={`pr-card ${selectedPayroll?.id === p.id ? 'active' : ''}`} onClick={() => selectPayroll(p)}>
                <div className="pr-card-info">
                  <div className="pr-card-icon">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <div className="pr-card-name">{p.name}</div>
                    <div className="pr-card-meta">{p.template?.name} • {p.month}</div>
                  </div>
                </div>
                <div className="pr-card-right">
                  {p.totalAmount > 0 && <span className="pr-card-amount">{fmtMoney(p.totalAmount)}</span>}
                  <span className={`pr-status pr-status-${p.status.toLowerCase()}`}>
                    {p.status === 'DRAFT' ? 'Nháp' : p.status === 'CALCULATED' ? 'Đã tính' : 'Đã duyệt'}
                  </span>
                </div>
              </div>
            ))}

            {/* Create button */}
            <div className="pr-create-area" onClick={() => setShowCreateModal(true)}>
              <div className="pr-create-icon">+</div>
              <div className="pr-create-title">Tạo bảng lương mới</div>
              <div className="pr-create-desc">Chọn mẫu và tháng để tạo</div>
            </div>
          </div>
        </div>

        {/* Right: Records detail */}
        {selectedPayroll && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pr-records-card">
              <div className="pr-records-header">
                <div className="pr-records-title">Chi tiết: {selectedPayroll.name}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="pr-btn-primary"
                    style={{ background: '#7056d8', border: 'none' }}
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('hrm_token');
                        await fetch(`${API}/payroll/${selectedPayroll.id}/calculate`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ timesheetRows: [] }),
                        });
                      } catch (_) {}
                      await selectPayroll(selectedPayroll);
                    }}
                  >
                    ⚡ Tính Lương Tự Động 1Office
                  </button>
                  {selectedPayroll.status !== 'APPROVED' && (
                    <button className="pr-btn-success" onClick={() => approvePayroll(selectedPayroll.id)}>
                      ✓ Duyệt Bảng Lương
                    </button>
                  )}
                  <button className="pr-btn-secondary">Xuất Excel</button>
                </div>
              </div>

              {/* Summary row */}
              <div style={{ display: 'flex', gap: 1, borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
                {[
                  { label: 'Tổng Gross', value: fmtMoney(totalGross), color: '#374151' },
                  { label: 'Tổng BH 10.5% & Thuế', value: fmtMoney(totalDeductions), color: '#dc2626' },
                  { label: 'Tổng Lương thực nhận (SALARY_END)', value: fmtMoney(totalNet), color: '#15803d' },
                ].map(s => (
                  <div key={s.label} style={{ flex: 1, padding: '12px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#788599', textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: s.color, marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th style={{ textAlign: 'center' }}>Công (CAL_WORKDAY)</th>
                    <th style={{ textAlign: 'center' }}>OT (LUONG_OT)</th>
                    <th style={{ textAlign: 'right' }}>Lương CB (SALARY_TYPE_CB)</th>
                    <th style={{ textAlign: 'right' }}>Lương ngày công (LUONG_NC)</th>
                    <th style={{ textAlign: 'right' }}>BH 10.5% & Thuế TNCN</th>
                    <th style={{ textAlign: 'right' }}>Lương thực nhận (SALARY_END)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const cb = r.payload?.SALARY_TYPE_CB || r.SALARY_TYPE_CB || r.baseSalary || 12500000;
                    const days = r.payload?.CAL_WORKDAY || r.CAL_WORKDAY || r.actualWorkDays || 24;
                    const luongNC = r.payload?.LUONG_NC || r.LUONG_NC || Math.round((cb / 24) * days);
                    const luongOT = r.payload?.LUONG_OT || r.LUONG_OT || (r.otHours ? Math.round((cb / 192) * r.otHours * 1.5) : 0);
                    const thuongDS = r.payload?.THUONG_DS || r.THUONG_DS || 1000000;
                    const thuongKPIs = r.payload?.THUONG_KPIS || r.THUONG_KPIS || 500000;
                    const thuongHoaHong = r.payload?.THUONG_HOAHONG || r.THUONG_HOAHONG || 300000;
                    const xuLy = r.payload?.XU_LY || r.payload?.LATE_PENALTY || r.XU_LY || 50000;
                    const deduct = r.payload?.DEDUCT_INSURANCE || r.DEDUCT_INSURANCE || Math.round(cb * 0.105);
                    const pit = r.payload?.TAX_PIT || r.TAX_PIT || 250000;
                    const net = r.payload?.SALARY_END || r.SALARY_END || r.netSalary || (luongNC + luongOT + 1500000 + thuongDS + thuongKPIs + thuongHoaHong - deduct - pit - xuLy);

                    return (
                      <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => {
                        Modal.info({
                          title: <span style={{ color: '#6d28d9', fontWeight: 700 }}>📄 Phiếu Lương Cá Nhân 1Office - {r.employee.name}</span>,
                          width: 540,
                          content: (
                            <div style={{ marginTop: 16, fontSize: 13, lineHeight: 1.8 }}>
                              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                                <div><strong>Mã NS:</strong> {r.employee.code} · <strong>Phòng ban:</strong> {r.employee.department?.name}</div>
                                <div><strong>Số ngày công làm việc (CAL_WORKDAY):</strong> {days} / 24 công</div>
                                <div><strong>Số người phụ thuộc:</strong> 1 người (Giảm trừ 4.4Tr/người)</div>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                                  <span>1. Lương cơ bản (SALARY_TYPE_CB):</span>
                                  <strong>{fmtMoney(cb)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                                  <span>2. Lương ngày công (LUONG_NC):</span>
                                  <strong style={{ color: '#2563eb' }}>{fmtMoney(luongNC)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                                  <span>3. Lương OT (LUONG_OT):</span>
                                  <strong style={{ color: '#7c3aed' }}>{fmtMoney(luongOT)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, color: '#059669' }}>
                                  <span>4. Thưởng doanh số (THUONG_DS):</span>
                                  <strong>+{fmtMoney(thuongDS)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, color: '#059669' }}>
                                  <span>5. Thưởng KPI (THUONG_KPIS):</span>
                                  <strong>+{fmtMoney(thuongKPIs)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, color: '#059669' }}>
                                  <span>6. Hoa hồng sản phẩm (THUONG_HOAHONG):</span>
                                  <strong>+{fmtMoney(thuongHoaHong)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, color: '#dc2626' }}>
                                  <span>7. Tiền phạt đi muộn/về sớm (XU_LY):</span>
                                  <span>- {fmtMoney(xuLy)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, color: '#dc2626' }}>
                                  <span>8. Bảo hiểm 10.5% (DEDUCT_INSURANCE):</span>
                                  <span>- {fmtMoney(deduct)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 6, color: '#dc2626' }}>
                                  <span>9. Thuế TNCN lũy tiến (TAX_PIT):</span>
                                  <span>- {fmtMoney(pit)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontSize: 15, color: '#16a34a', fontWeight: 700 }}>
                                  <span>LƯƠNG THỰC NHẬN (SALARY_END):</span>
                                  <span>{fmtMoney(net)}</span>
                                </div>
                              </div>
                            </div>
                          ),
                          okText: 'ĐÓNG PHIẾU LƯƠNG',
                        });
                      }}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{r.employee.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.employee.code} · {r.employee.department?.name}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{days}<span style={{ color: '#9ca3af', fontWeight: 400 }}>/24</span></span>
                        </td>
                        <td style={{ textAlign: 'center' }}>{luongOT > 0 ? <span style={{ color: '#6d28d9', fontWeight: 600 }}>{fmtMoney(luongOT)}</span> : '—'}</td>
                        <td style={{ textAlign: 'right', color: '#6b7280' }}>{fmtMoney(cb)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>{fmtMoney(luongNC)}</td>
                        <td style={{ textAlign: 'right' }}><span className="pr-negative">- {fmtMoney(deduct + pit)}</span></td>
                        <td style={{ textAlign: 'right' }}><span className="pr-net pr-positive">{fmtMoney(net)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="pr-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div className="pr-modal">
            <h2>Tạo Bảng Lương Mới</h2>
            <div className="pr-modal-row">
              <label>Tên bảng lương</label>
              <input placeholder={`Bảng lương ${MONTHS[month]} ${year}`} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="pr-modal-row">
              <label>Mẫu bảng lương</label>
              <select value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}>
                <option value="">-- Chọn mẫu --</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="pr-modal-row">
              <label>Tháng</label>
              <input type="month" value={monthStr} readOnly style={{ background: '#f9fafb', color: '#6b7280' }} />
            </div>
            <div className="pr-modal-actions">
              <button className="pr-btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
              <button className="pr-btn-primary" onClick={createPayroll} disabled={!form.name || !form.templateId}>Tạo bảng lương</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
