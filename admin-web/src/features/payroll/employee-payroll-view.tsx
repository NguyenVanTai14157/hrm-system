'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Select, Tag, Modal, Divider, message, Spin } from 'antd';
import {
  BarChartOutlined,
  MinusOutlined,
  PlusOutlined,
  CalendarOutlined,
  PrinterOutlined,
  DownloadOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

interface MonthSalary {
  month: number;
  label: string;
  monthKey: string;
  hasData: boolean;
  netSalary: number;
  grossSalary: number;
  baseSalary: number;
  workDays: number;
  standardWorkDays: number;
  components: Array<{ id: string; name: string; type: string; amount: number }>;
  status: 'PAID' | 'DRAFT' | 'APPROVED' | 'EMPTY';
}

export function EmployeePayrollView() {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.username || 'Nhân viên';
  const employeeId = user?.employeeId;

  const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbPayrollList, setDbPayrollList] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<MonthSalary | null>(null);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      if (!employeeId) {
        setDbPayrollList([]);
        return;
      }
      const res = await apiClient.get(`/payroll/my-payroll?employeeId=${employeeId}&year=${selectedYear}`);
      setDbPayrollList(res.data || []);
    } catch (_) {
      setDbPayrollList([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedYear]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Map 12 months with real database records
  const monthsData: MonthSalary[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthStr = String(month).padStart(2, '0');
    const monthKey = `${selectedYear}-${monthStr}`;

    // Find database record for this month
    const found = dbPayrollList.find((p) => p.month === monthKey && p.record);

    if (found && found.record) {
      const rec = found.record;
      return {
        month,
        label: `Tháng ${month}`,
        monthKey,
        hasData: true,
        netSalary: rec.netSalary || 0,
        grossSalary: rec.grossSalary || 0,
        baseSalary: rec.baseSalary || 0,
        workDays: rec.totalActualDays || 0,
        standardWorkDays: rec.totalStandardDays || 24,
        components: rec.components || [],
        status: found.status || 'APPROVED',
      };
    }

    return {
      month,
      label: `Tháng ${month}`,
      monthKey,
      hasData: false,
      netSalary: 0,
      grossSalary: 0,
      baseSalary: 0,
      workDays: 0,
      standardWorkDays: 24,
      components: [],
      status: 'EMPTY',
    };
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 8px 40px' }}>
      {/* 1Office Top Heading matching Screenshot 3: test1 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          {displayName}
        </h1>
      </div>

      {/* Sub-tabs: Của bạn | Tất cả and Year Picker on right */}
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
            onClick={() => setActiveTab('mine')}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 4px',
              fontSize: 14,
              fontWeight: activeTab === 'mine' ? 700 : 500,
              color: activeTab === 'mine' ? '#ef4444' : '#64748b',
              borderBottom: activeTab === 'mine' ? '2.5px solid #ef4444' : '2.5px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Của bạn
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 4px',
              fontSize: 14,
              fontWeight: activeTab === 'all' ? 700 : 500,
              color: activeTab === 'all' ? '#ef4444' : '#64748b',
              borderBottom: activeTab === 'all' ? '2.5px solid #ef4444' : '2.5px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Tất cả
          </button>
        </div>

        {/* Year Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6 }}>
          <CalendarOutlined style={{ color: '#64748b' }} />
          <Select
            value={selectedYear}
            onChange={setSelectedYear}
            size="small"
            style={{ width: 120 }}
            options={[
              { value: 2026, label: 'Chọn năm 2026' },
              { value: 2025, label: 'Chọn năm 2025' },
              { value: 2024, label: 'Chọn năm 2024' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : activeTab === 'mine' ? (
        /* Main Card matching Screenshot 3: Lương thực nhận 2026 */
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Card Header with BarChart icon and collapse button */}
          <div
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: collapsed ? 'none' : '1px solid #f1f5f9',
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>
              Lương thực nhận {selectedYear}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BarChartOutlined style={{ fontSize: 16, color: '#64748b' }} />
              <Button
                type="text"
                size="small"
                icon={collapsed ? <PlusOutlined /> : <MinusOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ color: '#94a3b8' }}
              />
            </div>
          </div>

          {!collapsed && (
            /* 12 Months Grid matching Screenshot 3 */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                borderTop: '1px solid #f1f5f9',
              }}
            >
              {monthsData.map((item, index) => {
                const isRightBorder = (index + 1) % 4 !== 0;
                const isBottomBorder = index < 8;

                return (
                  <div
                    key={item.month}
                    onClick={() => setSelectedPayslip(item)}
                    style={{
                      padding: '24px 20px',
                      borderRight: isRightBorder ? '1px solid #f1f5f9' : 'none',
                      borderBottom: isBottomBorder ? '1px solid #f1f5f9' : 'none',
                      minHeight: 120,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    title={item.hasData ? `Xem phiếu lương ${item.label}` : `${item.label} chưa có dữ liệu`}
                  >
                    {/* Month Label */}
                    <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 14 }}>
                      {item.label}
                    </div>

                    {/* Green Tag "Lương thực nhận" matching Screenshot 3 */}
                    <div
                      style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        borderRadius: 4,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        borderLeft: '3px solid #16a34a',
                      }}
                    >
                      <span style={{ fontSize: 11, color: '#166534' }}>Lương thực nhận</span>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                        {item.hasData ? formatCurrency(item.netSalary) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Tab "Tất cả": History table of all payroll cycles from Real Database */
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
            Lịch sử tất cả kỳ lương của bạn ({selectedYear})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Kỳ lương</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Công chuẩn / Thực tế</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Tổng thu nhập</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Thực nhận</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Trạng thái</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {monthsData.map((m) => (
                  <tr key={m.month} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#0f172a' }}>
                      {m.label}/{selectedYear}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center', color: '#64748b' }}>
                      {m.hasData ? `${m.workDays} / ${m.standardWorkDays}` : '--'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                      {m.hasData ? formatCurrency(m.grossSalary) : '--'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#16a34a' }}>
                      {m.hasData ? formatCurrency(m.netSalary) : '-'}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {m.hasData ? (
                        <Tag color="success" style={{ borderRadius: 6 }}>Đã chốt lương</Tag>
                      ) : (
                        <Tag style={{ borderRadius: 6, color: '#94a3b8' }}>Chưa có dữ liệu</Tag>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {m.hasData ? (
                        <Button size="small" onClick={() => setSelectedPayslip(m)} style={{ borderRadius: 6 }}>
                          Xem phiếu
                        </Button>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Personal Payslip Detail Modal */}
      <Modal
        open={!!selectedPayslip}
        onCancel={() => setSelectedPayslip(null)}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => window.print()}>
            In phiếu lương
          </Button>,
          <Button key="download" icon={<DownloadOutlined />} onClick={() => message.success('Đang tạo tệp PDF phiếu lương...')}>
            Xuất PDF
          </Button>,
          <Button key="close" type="primary" onClick={() => setSelectedPayslip(null)}>
            Đóng
          </Button>,
        ]}
        width={720}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarCircleOutlined style={{ color: '#16a34a', fontSize: 18 }} />
            <span>PHIẾU LƯƠNG CHI TIẾT - {selectedPayslip?.label.toUpperCase()}/{selectedYear}</span>
          </div>
        }
      >
        {selectedPayslip && (
          <div style={{ padding: '10px 0', fontSize: 13 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{displayName}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>Mã NV: {employeeId ? 'Đã liên kết' : '--'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Trạng thái kỳ lương</div>
                <Tag color={selectedPayslip.hasData ? 'success' : 'default'} style={{ borderRadius: 6, marginTop: 4 }}>
                  {selectedPayslip.hasData ? 'Đã chi trả' : 'Chưa có dữ liệu'}
                </Tag>
              </div>
            </div>

            {selectedPayslip.hasData ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: '#15803d', fontWeight: 700, margin: '0 0 8px' }}>CHI TIẾT CÁC THÀNH PHẦN LƯƠNG TỪ HỆ THỐNG</h4>
                  {selectedPayslip.components.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed #e2e8f0' }}>
                      <span>{c.name}:</span>
                      <strong>{c.type === 'NUMBER' ? c.amount : formatCurrency(c.amount)}</strong>
                    </div>
                  ))}
                </div>

                <Divider style={{ margin: '14px 0' }} />

                <div style={{ background: '#ecfdf5', padding: '14px 18px', borderRadius: 8, border: '1px solid #a7f3d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>LƯƠNG THỰC NHẬN (NET):</span>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>
                    {formatCurrency(selectedPayslip.netSalary)}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                Kỳ lương {selectedPayslip.label}/{selectedYear} chưa được phòng Kế toán duyệt và chốt dữ liệu.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
