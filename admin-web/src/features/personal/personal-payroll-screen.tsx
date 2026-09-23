'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, Tag, Modal, Divider, Empty } from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  RightOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

export function PersonalPayrollScreen() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'payroll' | 'all'>('payroll');
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/me/payroll', {
        params: { year: selectedYear },
      });
      setPayrollData(res.data);
    } catch {
      setPayrollData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  const payrolls: any[] = payrollData?.payrolls || [];

  // 12 months array
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const monthKey = `${selectedYear}-${String(monthNum).padStart(2, '0')}`;
    const p = payrolls.find((item) => item.month === monthKey || item.payroll?.month === monthKey);
    return {
      monthNum,
      label: `Tháng ${monthNum}`,
      monthKey,
      data: p || null,
      netSalary: p?.netSalary || p?.totalSalary || 0,
      hasData: Boolean(p),
    };
  });

  const totalYearSalary = months.reduce((acc, m) => acc + (m.netSalary || 0), 0);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div>
      {/* ── Sub Navigation Tabs ── */}
      <div className="personal-sub-tabs">
        <button
          className={`personal-tab-item ${activeTab === 'payroll' ? 'active' : ''}`}
          onClick={() => setActiveTab('payroll')}
        >
          Bảng lương
        </button>
        <button
          className={`personal-tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả
        </button>
      </div>

      <div className="personal-content">
        {/* Total Salary Card (matching Image 4) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 14,
            padding: '20px 18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            border: '1px solid #fef3c7',
            backgroundClip: 'padding-box',
            backgroundImage: 'linear-gradient(to bottom right, #fffbeb, #ffffff)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#92400e' }}>
              Lương thực nhận {selectedYear}
            </span>
            <LineChartOutlined style={{ color: '#d97706', fontSize: 18 }} />
          </div>

          <div style={{ fontSize: 13, color: '#78350f', marginBottom: 4 }}>
            Tổng lương thực nhận
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#111827' }}>
            {formatVND(totalYearSalary)}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: '#6b7280', fontSize: 13.5 }}>
              Đang tải bảng lương…
            </p>
          </div>
        ) : (
          /* Months List */
          <div className="personal-section-card" style={{ padding: '6px 0' }}>
            {months.map((m) => (
              <div
                key={m.monthKey}
                onClick={() => m.hasData && setSelectedSlip(m.data)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: m.hasData ? 'pointer' : 'default',
                  transition: 'background-color 0.15s',
                }}
              >
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1f2937' }}>
                    {m.label}
                  </div>
                  {m.hasData && (
                    <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                      Thực nhận: <strong>{formatVND(m.netSalary)}</strong>
                    </div>
                  )}
                </div>

                <div>
                  {m.hasData ? (
                    <RightOutlined style={{ color: '#9ca3af', fontSize: 12 }} />
                  ) : (
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>Chưa có bảng lương</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detailed Payslip Modal */}
      <Modal
        title={`Phiếu lương ${selectedSlip?.payroll?.name || selectedSlip?.month || ''}`}
        open={Boolean(selectedSlip)}
        onCancel={() => setSelectedSlip(null)}
        footer={null}
        centered
        width={380}
      >
        {selectedSlip && (
          <div style={{ padding: '8px 0' }}>
            <div className="personal-info-grid">
              <div className="personal-info-row">
                <span className="personal-info-label">Lương cơ bản</span>
                <span className="personal-info-value">
                  {formatVND(selectedSlip.baseSalary || 0)}
                </span>
              </div>
              <div className="personal-info-row">
                <span className="personal-info-label">Số ngày công</span>
                <span className="personal-info-value">
                  {selectedSlip.workDays || selectedSlip.actualWorkdays || 0} công
                </span>
              </div>
              <div className="personal-info-row">
                <span className="personal-info-label">Tổng phụ cấp</span>
                <span className="personal-info-value" style={{ color: '#16a34a' }}>
                  +{formatVND(selectedSlip.allowanceTotal || 0)}
                </span>
              </div>
              <div className="personal-info-row">
                <span className="personal-info-label">Tổng khấu trừ / BH</span>
                <span className="personal-info-value" style={{ color: '#ef4444' }}>
                  -{formatVND(selectedSlip.deductionTotal || 0)}
                </span>
              </div>
              <Divider style={{ margin: '8px 0' }} />
              <div className="personal-info-row">
                <span className="personal-info-label" style={{ fontWeight: 700 }}>
                  THỰC LĨNH
                </span>
                <span
                  className="personal-info-value"
                  style={{ color: '#0284c7', fontSize: 16, fontWeight: 800 }}
                >
                  {formatVND(selectedSlip.netSalary || selectedSlip.totalSalary || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
