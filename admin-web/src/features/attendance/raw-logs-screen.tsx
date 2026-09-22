'use client';

import React, { useState } from 'react';
import { Table, Card, Button, Tag, Space, Input, Select, DatePicker, Upload, message } from 'antd';
import { SearchOutlined, DownloadOutlined, UploadOutlined, SyncOutlined, FieldTimeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface RawLogRecord {
  id: string;
  code: string;
  name: string;
  time: string;
  fromType: 'MACHINE' | 'GPS' | 'WIFI' | 'USER' | 'IMPORT';
  location: string;
  deviceId: string;
  verifyMode: string;
}

const MOCK_RAW_LOGS: RawLogRecord[] = [
  {
    id: 'LOG-1001',
    code: 'NV0016',
    name: 'Nguyễn Thị Kim Nhi',
    time: '2026-09-18 07:58:24',
    fromType: 'MACHINE',
    location: '14 Lê Duy Đình - Đà Nẵng',
    deviceId: 'HN-2026-X88',
    verifyMode: 'FaceID (Nhận diện khuôn mặt AI)',
  },
  {
    id: 'LOG-1002',
    code: 'NV0099',
    name: 'Nguyễn Trần Nam Anh',
    time: '2026-09-18 08:02:11',
    fromType: 'GPS',
    location: 'Định vị GPS Mobile (Vĩ độ: 16.0544, Kinh độ: 108.2022)',
    deviceId: 'Mobile App iOS',
    verifyMode: 'GPS Radius (Bán kính 50m)',
  },
  {
    id: 'LOG-1003',
    code: 'NV0102',
    name: 'Nguyễn Thị Phúc Thảo',
    time: '2026-09-18 08:04:45',
    fromType: 'WIFI',
    location: 'Wifi Công ty (IP: 118.69.182.10)',
    deviceId: 'Web Portal Desktop',
    verifyMode: 'Bắt IP Mạng nội bộ',
  },
  {
    id: 'LOG-1004',
    code: 'NV0054',
    name: 'Ngô Minh Đức',
    time: '2026-09-18 17:35:10',
    fromType: 'MACHINE',
    location: '14 Lê Duy Đình - Đà Nẵng',
    deviceId: 'HN-2026-X88',
    verifyMode: 'Vân tay chính chủ',
  },
  {
    id: 'LOG-1005',
    code: 'NV0090',
    name: 'Đặng Thị Mai',
    time: '2026-09-18 17:38:00',
    fromType: 'IMPORT',
    location: 'Nạp thủ công từ Excel',
    deviceId: 'Admin Import',
    verifyMode: 'Nạp file dữ liệu dự phòng',
  }
];

export function RawLogsScreen() {
  const [logs, setLogs] = useState<RawLogRecord[]>(MOCK_RAW_LOGS);

  const columns = [
    {
      title: 'Mã Log',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <strong style={{ color: '#64748b' }}>{id}</strong>,
    },
    {
      title: 'Nhân sự',
      key: 'emp',
      width: 220,
      render: (record: RawLogRecord) => (
        <div>
          <strong style={{ color: '#0f172a', display: 'block' }}>{record.name}</strong>
          <span style={{ fontSize: 12, color: '#2563eb' }}>{record.code}</span>
        </div>
      ),
    },
    {
      title: 'Thời gian Timestamp',
      dataIndex: 'time',
      key: 'time',
      width: 170,
      render: (time: string) => (
        <Space size={4}>
          <FieldTimeOutlined style={{ color: '#059669' }} />
          <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{time}</strong>
        </Space>
      ),
    },
    {
      title: 'Phương thức quẹt',
      dataIndex: 'fromType',
      key: 'fromType',
      width: 130,
      render: (type: string) => {
        if (type === 'MACHINE') return <Tag color="purple">Máy vân tay/FaceID</Tag>;
        if (type === 'GPS') return <Tag color="blue">Định vị GPS Mobile</Tag>;
        if (type === 'WIFI') return <Tag color="green">IP Wifi nội bộ</Tag>;
        if (type === 'IMPORT') return <Tag color="orange">File Excel</Tag>;
        return <Tag color="cyan">Thủ công</Tag>;
      },
    },
    {
      title: 'Địa điểm / Chi tiết phương thức',
      key: 'detail',
      render: (record: RawLogRecord) => (
        <div>
          <strong style={{ fontSize: 12, color: '#334155', display: 'block' }}>{record.location}</strong>
          <span style={{ fontSize: 11, color: '#64748b' }}>Thiết bị: {record.deviceId} ({record.verifyMode})</span>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>📑 Dữ liệu thô Máy chấm công (Raw Logs)</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Nhật ký lưu trữ toàn bộ các lượt quẹt thẻ, dập vân tay, nhận diện FaceID, GPS, Wifi với timestamp chính xác đến từng giây.
          </p>
        </div>
        <Space>
          <Upload showUploadList={false} beforeUpload={() => { message.success('Đã nạp thành công file Raw Logs Excel'); return false; }}>
            <Button icon={<UploadOutlined />}>Nạp file Excel dự phòng</Button>
          </Upload>
          <Button icon={<DownloadOutlined />}>Xuất dữ liệu thô</Button>
          <Button icon={<SyncOutlined />} type="primary" style={{ background: '#059669', borderColor: '#059669' }}>
            Tải log từ Webhook
          </Button>
        </Space>
      </div>

      <Card bodyStyle={{ padding: '12px 16px' }} style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <Space wrap>
          <Input prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Tìm theo mã NV / tên..." style={{ width: 220 }} />
          <Select defaultValue="ALL" style={{ width: 180 }}>
            <Select.Option value="ALL">Tất cả phương thức</Select.Option>
            <Select.Option value="MACHINE">Máy vân tay / FaceID</Select.Option>
            <Select.Option value="GPS">Định vị GPS Mobile</Select.Option>
            <Select.Option value="WIFI">Mạng IP Wifi</Select.Option>
            <Select.Option value="IMPORT">Excel Import</Select.Option>
          </Select>
          <DatePicker.RangePicker defaultValue={[dayjs('2026-09-01'), dayjs('2026-09-18')]} />
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Table dataSource={logs} columns={columns} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
}
