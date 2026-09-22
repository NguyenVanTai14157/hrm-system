'use client';

import React, { useState } from 'react';
import { Table, Tabs, Card, Select, Input, Button, Tag, Space, Tooltip, DatePicker } from 'antd';
import { SearchOutlined, DownloadOutlined, FilterOutlined, SettingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface MealRecord {
  key: string;
  code: string;
  name: string;
  department: string;
  position: string;
  jobTitle: string;
  days: Record<number, { ca: number; ot: number }>;
  totalCa: number;
  totalOt: number;
  totalMeals: number;
}

const MOCK_MEAL_DATA: MealRecord[] = [
  {
    key: '1',
    code: 'NV0016',
    name: 'Nguyễn Thị Kim Nhi',
    department: 'KIỂM SOÁT NỘI BỘ',
    position: 'Chuyên viên KSNB',
    jobTitle: 'Chuyên viên',
    days: {
      1: { ca: 1, ot: 0 }, 2: { ca: 1, ot: 0 }, 3: { ca: 1, ot: 1 }, 4: { ca: 1, ot: 0 }, 5: { ca: 1, ot: 0 },
      8: { ca: 1, ot: 0 }, 9: { ca: 1, ot: 0 }, 10: { ca: 1, ot: 0 }, 11: { ca: 1, ot: 1 }, 12: { ca: 1, ot: 0 },
      15: { ca: 1, ot: 0 }, 16: { ca: 1, ot: 0 }, 17: { ca: 1, ot: 0 }, 18: { ca: 1, ot: 0 },
    },
    totalCa: 14,
    totalOt: 2,
    totalMeals: 16,
  },
  {
    key: '2',
    code: 'NV0099',
    name: 'Nguyễn Trần Nam Anh',
    department: 'KHO HÀNG',
    position: 'Nhân viên Kho',
    jobTitle: 'Nhân viên',
    days: {
      1: { ca: 1, ot: 1 }, 2: { ca: 1, ot: 1 }, 3: { ca: 1, ot: 0 }, 4: { ca: 1, ot: 1 }, 5: { ca: 1, ot: 0 },
      8: { ca: 1, ot: 0 }, 9: { ca: 1, ot: 1 }, 10: { ca: 1, ot: 0 }, 11: { ca: 1, ot: 0 }, 12: { ca: 1, ot: 1 },
    },
    totalCa: 10,
    totalOt: 5,
    totalMeals: 15,
  },
  {
    key: '3',
    code: 'NV0102',
    name: 'Nguyễn Thị Phúc Thảo',
    department: 'KHO HÀNG',
    position: 'Thủ kho',
    jobTitle: 'Chuyên viên',
    days: {
      1: { ca: 1, ot: 0 }, 2: { ca: 1, ot: 0 }, 3: { ca: 1, ot: 0 }, 4: { ca: 1, ot: 0 }, 5: { ca: 1, ot: 0 },
      8: { ca: 1, ot: 0 }, 9: { ca: 1, ot: 0 }, 10: { ca: 1, ot: 0 }, 11: { ca: 1, ot: 0 }, 12: { ca: 1, ot: 0 },
    },
    totalCa: 10,
    totalOt: 0,
    totalMeals: 10,
  }
];

export function MealScreen() {
  const [activeTab, setActiveTab] = useState<'ca' | 'ot' | 'total'>('total');
  const [month, setMonth] = useState('2026-09');
  const [searchText, setSearchText] = useState('');

  const daysInMonth = 30; // September has 30 days
  const dayColumns = Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
    const isWeekend = day % 7 === 6 || day % 7 === 0;
    return {
      title: (
        <div style={{ textTransform: 'uppercase', fontSize: 11, textAlign: 'center' }}>
          <span style={{ color: isWeekend ? '#ef4444' : '#64748b' }}>T{day % 7 === 0 ? 'CN' : (day % 7) + 1}</span>
          <br />
          <strong>{String(day).padStart(2, '0')}</strong>
        </div>
      ),
      dataIndex: ['days', day],
      key: `day_${day}`,
      width: 55,
      align: 'center' as const,
      render: (val: { ca: number; ot: number } | undefined) => {
        if (isWeekend && !val) return <span style={{ color: '#cbd5e1' }}>-</span>;
        const caVal = val?.ca ?? 0;
        const otVal = val?.ot ?? 0;

        if (activeTab === 'ca') {
          return caVal > 0 ? <span style={{ color: '#059669', fontWeight: 600 }}>1|1</span> : <span style={{ color: '#94a3b8' }}>0|1</span>;
        }
        if (activeTab === 'ot') {
          return otVal > 0 ? <span style={{ color: '#2563eb', fontWeight: 600 }}>{otVal}</span> : <span style={{ color: '#cbd5e1' }}>0</span>;
        }
        // Total
        const total = caVal + otVal;
        return total > 0 ? (
          <Tag color={otVal > 0 ? 'blue' : 'green'} style={{ margin: 0, padding: '0 4px', fontSize: 11, fontWeight: 600 }}>
            {caVal}|{total}
          </Tag>
        ) : (
          <span style={{ color: '#cbd5e1' }}>0|1</span>
        );
      },
    };
  });

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 50,
      fixed: 'left' as const,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã NV',
      dataIndex: 'code',
      key: 'code',
      width: 90,
      fixed: 'left' as const,
      render: (code: string) => <strong style={{ color: '#2563eb' }}>{code}</strong>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      width: 170,
      fixed: 'left' as const,
      render: (name: string) => <strong style={{ color: '#1e293b' }}>{name}</strong>,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
      width: 150,
    },
    ...dayColumns,
    {
      title: 'Tổng suất Ca',
      dataIndex: 'totalCa',
      key: 'totalCa',
      width: 100,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (val: number) => <Tag color="green" style={{ fontWeight: 700 }}>{val}</Tag>,
    },
    {
      title: 'Tổng suất OT',
      dataIndex: 'totalOt',
      key: 'totalOt',
      width: 100,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (val: number) => <Tag color="blue" style={{ fontWeight: 700 }}>{val}</Tag>,
    },
    {
      title: 'TỔNG SUẤT ĂN',
      dataIndex: 'totalMeals',
      key: 'totalMeals',
      width: 110,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (val: number) => <Tag color="magenta" style={{ fontWeight: 800, fontSize: 13, padding: '2px 8px' }}>{val} suất</Tag>,
    },
  ];

  return (
    <div className="meal-screen" style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>🍱 Bảng chấm công ăn tháng {month}</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Tự động ghi nhận số suất ăn đài thọ dựa theo công thực tế (≥ 0.5 công) & liên thông biến `ALLOW_MEAL` sang Bảng lương.
          </p>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />}>Xuất Excel</Button>
          <Button icon={<SettingOutlined />} type="primary" style={{ background: '#e83e8c', borderColor: '#e83e8c' }}>
            Cấu hình mức ăn
          </Button>
        </Space>
      </div>

      {/* Metric summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Tổng nhân sự đài thọ</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>28 người</div>
        </Card>
        <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#ecfdf5' }}>
          <span style={{ color: '#059669', fontSize: 12 }}>Suất ăn ca chính</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#059669', marginTop: 4 }}>384 suất</div>
        </Card>
        <Card size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#eff6ff' }}>
          <span style={{ color: '#2563eb', fontSize: 12 }}>Suất ăn hỗ trợ OT</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>42 suất</div>
        </Card>
        <Card size="small" style={{ borderRadius: 12, border: '1px solid #fbcfe8', background: '#fff0f5' }}>
          <span style={{ color: '#e83e8c', fontSize: 12 }}>Tổng chi phí ăn ca (35k/suất)</span>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#e83e8c', marginTop: 4 }}>14.910.000 đ</div>
        </Card>
      </div>

      {/* Tabs & Filters */}
      <Card bodyStyle={{ padding: '12px 16px' }} style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as any)}
            style={{ marginBottom: -12 }}
            items={[
              { key: 'total', label: '🍱 Công ăn tổng hợp' },
              { key: 'ca', label: '☀️ Công ăn theo ca chính' },
              { key: 'ot', label: '🌙 Công ăn làm thêm (OT)' },
            ]}
          />
          <Space>
            <Input
              prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
              placeholder="Tìm theo tên/mã NV..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
            />
            <Select defaultValue="ALL" style={{ width: 180 }}>
              <Select.Option value="ALL">Tất cả phòng ban</Select.Option>
              <Select.Option value="KSNB">KIỂM SOÁT NỘI BỘ</Select.Option>
              <Select.Option value="KHO">KHO HÀNG</Select.Option>
              <Select.Option value="MKT">MARKETING</Select.Option>
            </Select>
            <DatePicker picker="month" defaultValue={dayjs('2026-09')} onChange={(d) => setMonth(d ? d.format('YYYY-MM') : '2026-09')} />
          </Space>
        </div>
      </Card>

      {/* Timesheet Meal Table */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Table
          dataSource={MOCK_MEAL_DATA}
          columns={columns}
          scroll={{ x: 2200, y: 550 }}
          pagination={false}
          bordered
          size="middle"
        />
      </Card>
    </div>
  );
}
