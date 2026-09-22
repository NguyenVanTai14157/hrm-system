'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Steps, Space, Spin, message } from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface StatsData {
  totalGross: number;
  netPayout: number;
  totalInsurance: number;
  totalPIT: number;
  totalEmployees: number;
  payrollStatus: string;
  latestPayrollName: string | null;
  latestPayrollMonth: string | null;
}

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'decimal' }).format(amount) + ' đ';

const statusStepMap: Record<string, number> = {
  NONE: -1,
  DRAFT: 0,
  CALCULATED: 1,
  APPROVED: 3,
};

export function PayrollDashboardScreen() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/payroll/stats')
      .then((res) => {
        if (res.data) setStats(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hasPayroll = stats && stats.payrollStatus !== 'NONE' && stats.latestPayrollName;
  const currentStep = statusStepMap[stats?.payrollStatus ?? 'NONE'] ?? -1;

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Heading */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            HRM / Tiền lương
          </span>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '4px 0 0', color: '#0f172a' }}>
            💰 Dashboard Tổng quan Quản lý Tiền lương
          </h1>
        </div>
        <Space>
          <Link href="/hrm/payroll">
            <Button icon={<DollarOutlined />}>Bảng tính lương tháng</Button>
          </Link>
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            style={{ background: '#d97706', borderColor: '#d97706' }}
            onClick={() => message.info('Mở trang Bảng lương để tính lương')}
          >
            Tính lại lương tự động
          </Button>
          <Button icon={<SendOutlined />} onClick={() => message.info('Tính năng gửi Payslip sẽ được bổ sung sau')}>
            Gửi Phiếu lương (Payslip)
          </Button>
        </Space>
      </div>

      <Spin spinning={loading} description="Đang tải dữ liệu...">
        {!hasPayroll && !loading && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            borderRadius: 12,
            marginBottom: 20,
            color: '#d48806',
            fontSize: 14,
          }}>
            ⚠️ <strong>Chưa có bảng lương nào được tạo.</strong> Vui lòng vào{' '}
            <Link href="/hrm/payroll" style={{ color: '#d97706', fontWeight: 600 }}>Bảng tính lương</Link>{' '}
            để tạo bảng lương mới.
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #fffbe6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                  Quỹ lương {stats?.latestPayrollMonth ? `tháng ${stats.latestPayrollMonth.split('-')[1]}/${stats.latestPayrollMonth.split('-')[0]}` : ''}
                </span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706', marginTop: 4 }}>
                  {formatVND(stats?.totalGross ?? 0)}
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {hasPayroll ? `${stats?.totalEmployees ?? 0} nhân sự` : 'Chưa có dữ liệu'}
                </span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'grid', placeItems: 'center', color: '#d97706' }}>
                <DollarOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #ecfdf5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Lương Thực nhận (NET)</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>
                  {formatVND(stats?.netPayout ?? 0)}
                </div>
                <span style={{ fontSize: 11, color: '#059669' }}>Chi trả qua Ngân hàng</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#d1fae5', display: 'grid', placeItems: 'center', color: '#059669' }}>
                <BankOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #eff6ff)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Khấu trừ BHXH (10.5%)</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', marginTop: 4 }}>
                  {formatVND(stats?.totalInsurance ?? 0)}
                </div>
                <span style={{ fontSize: 11, color: '#2563eb' }}>BHXH 8% + BHYT 1.5% + BHTN 1%</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dbeafe', display: 'grid', placeItems: 'center', color: '#2563eb' }}>
                <SafetyCertificateOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>

          <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #ffffff, #fff0f5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Thuế TNCN (PIT)</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#e83e8c', marginTop: 4 }}>
                  {formatVND(stats?.totalPIT ?? 0)}
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Thuế lũy tiến 5% - 35%</span>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ffe4e6', display: 'grid', placeItems: 'center', color: '#e83e8c' }}>
                <DollarOutlined style={{ fontSize: 20 }} />
              </div>
            </div>
          </Card>
        </div>

        {/* Workflow Steps Card */}
        {hasPayroll && (
          <Card
            title={`🔒 Tiến độ Phê duyệt — ${stats?.latestPayrollName ?? 'Bảng lương'}`}
            size="small"
            style={{ borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}
          >
            <Steps
              current={currentStep}
              items={[
                {
                  title: 'Tạo bản nháp (DRAFT)',
                  description: 'HR khởi tạo bảng lương',
                  status: currentStep >= 0 ? 'finish' : 'wait',
                },
                {
                  title: 'Tự động tính (CALCULATED)',
                  description: 'Chốt công & phụ cấp ăn',
                  status: currentStep >= 1 ? 'finish' : 'wait',
                },
                {
                  title: 'Trưởng phòng HR Duyệt',
                  description: 'Kiểm tra khấu trừ thuế/BHXH',
                  status: currentStep >= 2 ? 'finish' : 'wait',
                },
                {
                  title: 'Khóa Bảng lương (APPROVED)',
                  description: 'Đóng băng & Gửi Payslip',
                  status: currentStep >= 3 ? 'finish' : 'wait',
                },
              ]}
            />
          </Card>
        )}

        {/* Summary */}
        {hasPayroll && (
          <Card
            title="📊 Tổng hợp Thành phần Lương"
            size="small"
            style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Lương thực nhận (NET):</span>
                <strong style={{ color: '#059669' }}>{formatVND(stats?.netPayout ?? 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Khấu trừ BHXH (10.5%):</span>
                <strong style={{ color: '#2563eb' }}>{formatVND(stats?.totalInsurance ?? 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>Thuế Thu nhập Cá nhân (PIT):</span>
                <strong style={{ color: '#e83e8c' }}>{formatVND(stats?.totalPIT ?? 0)}</strong>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <strong>TỔNG CỘNG GROSS:</strong>
                <strong style={{ color: '#d97706' }}>{formatVND(stats?.totalGross ?? 0)}</strong>
              </div>
            </div>
          </Card>
        )}
      </Spin>
    </div>
  );
}
