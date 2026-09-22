'use client';

import React, { useState } from 'react';
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, Tooltip } from 'antd';
import { SearchOutlined, DownloadOutlined, InfoCircleOutlined, CalendarOutlined } from '@ant-design/icons';

interface FurloughRecord {
  id: string;
  code: string;
  name: string;
  department: string;
  joinDate: string;
  yearOpen: number;       // Tồn đầu phép năm
  yearUsed: number;       // Phép năm đã dùng
  seniorityOpen: number;  // Phép thâm niên
  accumulationOpen: number; // Phép năm cũ chuyển sang
  accumulationExpired: number; // Phép năm cũ hết hạn (31/03)
  totalClosed: number;    // Phép tồn còn lại
}

const MOCK_FURLOUGH_DATA: FurloughRecord[] = [
  {
    id: '1',
    code: 'NV0016',
    name: 'Nguyễn Thị Kim Nhi',
    department: 'KIỂM SOÁT NỘI BỘ',
    joinDate: '2021-03-15',
    yearOpen: 9,
    yearUsed: 2,
    seniorityOpen: 1, // Đủ 5 năm +1 ngày
    accumulationOpen: 3,
    accumulationExpired: 0,
    totalClosed: 11,
  },
  {
    id: '2',
    code: 'NV0099',
    name: 'Nguyễn Trần Nam Anh',
    department: 'KHO HÀNG',
    joinDate: '2023-06-01',
    yearOpen: 9,
    yearUsed: 4,
    seniorityOpen: 0,
    accumulationOpen: 1,
    accumulationExpired: 1, // Đã hết hạn ngày 31/03
    totalClosed: 5,
  },
  {
    id: '3',
    code: 'NV0102',
    name: 'Nguyễn Thị Phúc Thảo',
    department: 'KHO HÀNG',
    joinDate: '2024-01-10',
    yearOpen: 9,
    yearUsed: 1,
    seniorityOpen: 0,
    accumulationOpen: 0,
    accumulationExpired: 0,
    totalClosed: 8,
  }
];

export function FurloughScreen() {
  const [data, setData] = useState<FurloughRecord[]>(MOCK_FURLOUGH_DATA);

  const columns = [
    {
      title: 'Mã NV',
      dataIndex: 'code',
      key: 'code',
      width: 90,
      render: (code: string) => <strong style={{ color: '#2563eb' }}>{code}</strong>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <strong style={{ color: '#0f172a' }}>{name}</strong>,
    },
    {
      title: 'Phòng ban',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Ngày vào làm',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{date}</span>,
    },
    {
      title: 'Phép năm 2026',
      dataIndex: 'yearOpen',
      key: 'yearOpen',
      align: 'center' as const,
      render: (val: number) => <Tag color="blue">{val} ngày</Tag>,
    },
    {
      title: 'Phép thâm niên (+1/5năm)',
      dataIndex: 'seniorityOpen',
      key: 'seniorityOpen',
      align: 'center' as const,
      render: (val: number) => <Tag color="purple">+{val} ngày</Tag>,
    },
    {
      title: 'Phép lũy kế 2025',
      dataIndex: 'accumulationOpen',
      key: 'accumulationOpen',
      align: 'center' as const,
      render: (val: number) => <span>{val} ngày</span>,
    },
    {
      title: 'Phép đã hết hạn (31/03)',
      dataIndex: 'accumulationExpired',
      key: 'accumulationExpired',
      align: 'center' as const,
      render: (val: number) => (
        val > 0 ? <Tag color="red">-{val} ngày</Tag> : <span style={{ color: '#cbd5e1' }}>0</span>
      ),
    },
    {
      title: 'Phép đã dùng',
      dataIndex: 'yearUsed',
      key: 'yearUsed',
      align: 'center' as const,
      render: (val: number) => <Tag color="orange">{val} ngày</Tag>,
    },
    {
      title: 'TỔNG PHÉP CÒN LẠI',
      dataIndex: 'totalClosed',
      key: 'totalClosed',
      align: 'center' as const,
      render: (val: number) => (
        <Tag color="green" style={{ fontSize: 13, fontWeight: 800, padding: '2px 10px' }}>
          {val} ngày
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>🌴 Bảng Tổng hợp Phép năm 2026</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Tự động tích lũy $+1$ ngày phép/tháng, cộng phép thâm niên & áp dụng quy tắc trừ phép: <i>Phép lũy kế $\rightarrow$ Phép năm $\rightarrow$ Phép thâm niên</i>.
          </p>
        </div>
        <Button icon={<DownloadOutlined />}>Xuất file tổng hợp phép</Button>
      </div>

      <Card bodyStyle={{ padding: '12px 16px' }} style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <Space wrap>
          <Input prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Tìm kiếm nhân sự..." style={{ width: 220 }} />
          <Select defaultValue="ALL" style={{ width: 180 }}>
            <Select.Option value="ALL">Tất cả phòng ban</Select.Option>
            <Select.Option value="KSNB">KIỂM SOÁT NỘI BỘ</Select.Option>
            <Select.Option value="KHO">KHO HÀNG</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
