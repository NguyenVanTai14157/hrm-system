'use client';

import React, { useState } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, DatePicker, Select, Switch, message } from 'antd';
import { PlusOutlined, CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface HolidayRecord {
  id: string;
  name: string;
  type: 'HOLIDAY' | 'EVENT' | 'ABNORMAL';
  startDate: string;
  endDate: string;
  totalDays: number;
  hasSalary: boolean;
  salaryRate: string;
  symbol: string;
}

const MOCK_HOLIDAYS: HolidayRecord[] = [
  {
    id: '1',
    name: 'Tết Dương Lịch 2026',
    type: 'HOLIDAY',
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    totalDays: 1,
    hasSalary: true,
    salaryRate: '100% Lương chuẩn (300% nếu làm OT)',
    symbol: 'L',
  },
  {
    id: '2',
    name: 'Tết Nguyên Đán Bính Ngọ 2026',
    type: 'HOLIDAY',
    startDate: '2026-02-15',
    endDate: '2026-02-21',
    totalDays: 7,
    hasSalary: true,
    salaryRate: '100% Lương chuẩn (300% nếu làm OT)',
    symbol: 'L',
  },
  {
    id: '3',
    name: 'Giỗ Tổ Hùng Vương (10/3 Âm lịch)',
    type: 'HOLIDAY',
    startDate: '2026-04-26',
    endDate: '2026-04-26',
    totalDays: 1,
    hasSalary: true,
    salaryRate: '100% Lương chuẩn',
    symbol: 'L',
  },
  {
    id: '4',
    name: 'Ngày Giải phóng & Quốc tế Lao động (30/4 - 1/5)',
    type: 'HOLIDAY',
    startDate: '2026-04-30',
    endDate: '2026-05-01',
    totalDays: 2,
    hasSalary: true,
    salaryRate: '100% Lương chuẩn',
    symbol: 'L',
  },
  {
    id: '5',
    name: 'Du lịch Teambuilding Công ty 2026',
    type: 'EVENT',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    totalDays: 3,
    hasSalary: true,
    salaryRate: '100% Lương chuẩn (Sự kiện công ty)',
    symbol: 'SK',
  }
];

export function HolidaysScreen() {
  const [holidays, setHolidays] = useState<HolidayRecord[]>(MOCK_HOLIDAYS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Tên Ngày nghỉ / Sự kiện',
      key: 'name',
      render: (record: HolidayRecord) => (
        <div>
          <strong style={{ color: '#0f172a', display: 'block' }}>{record.name}</strong>
          <span style={{ fontSize: 12, color: '#64748b' }}>Ký hiệu công: <Tag color="magenta">{record.symbol}</Tag></span>
        </div>
      ),
    },
    {
      title: 'Phân loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        if (type === 'HOLIDAY') return <Tag color="red">Nghỉ Lễ Quốc Gia</Tag>;
        if (type === 'EVENT') return <Tag color="purple">Sự kiện Công ty / Nghỉ bù</Tag>;
        return <Tag color="orange">Nghỉ Bất thường</Tag>;
      },
    },
    {
      title: 'Khoảng thời gian',
      key: 'dates',
      render: (record: HolidayRecord) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: '#2563eb' }} />
          <span>{record.startDate} $\rightarrow$ {record.endDate} (<strong>{record.totalDays} ngày</strong>)</span>
        </Space>
      ),
    },
    {
      title: 'Hưởng lương',
      dataIndex: 'hasSalary',
      key: 'hasSalary',
      render: (has: boolean) => (
        has ? <Tag color="green" icon={<CheckOutlined />}>Có hưởng lương</Tag> : <Tag color="default">Không hưởng lương</Tag>
      ),
    },
    {
      title: 'Mức lương & Hệ số OT',
      dataIndex: 'salaryRate',
      key: 'salaryRate',
      render: (rate: string) => <span style={{ fontSize: 12, color: '#475569' }}>{rate}</span>,
    },
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>🎌 Quản lý Danh sách Ngày nghỉ lễ & Nghỉ bù năm 2026</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Tự động điền ký hiệu `L` vào Bảng công chính & tính hệ số lương $200\% - 300\%$ nếu nhân viên làm việc vào ngày Lễ.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#e83e8c', borderColor: '#e83e8c' }}
          onClick={() => setModalOpen(true)}
        >
          Thêm ngày nghỉ lễ mới
        </Button>
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Table dataSource={holidays} columns={columns} rowKey="id" pagination={false} />
      </Card>

      <Modal
        title="Thêm Ngày nghỉ lễ / Nghỉ bù mới"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        mask={{ closable: false }}
        onOk={() => {
          form.validateFields().then(values => {
            const newH: HolidayRecord = {
              id: Date.now().toString(),
              name: values.name,
              type: values.type,
              startDate: values.dates[0].format('YYYY-MM-DD'),
              endDate: values.dates[1].format('YYYY-MM-DD'),
              totalDays: values.dates[1].diff(values.dates[0], 'day') + 1,
              hasSalary: values.hasSalary ?? true,
              salaryRate: '100% Lương chuẩn',
              symbol: values.symbol || 'L',
            };
            setHolidays([...holidays, newH]);
            setModalOpen(false);
            form.resetFields();
            message.success('Đã thêm ngày nghỉ lễ mới');
          });
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }} initialValues={{ hasSalary: true, symbol: 'L', type: 'HOLIDAY' }}>
          <Form.Item name="name" label="Tên ngày nghỉ / Sự kiện" rules={[{ required: true }]}>
            <Input placeholder="VD: Quốc Khánh 2/9" />
          </Form.Item>
          <Form.Item name="type" label="Phân loại" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="HOLIDAY">Nghỉ Lễ Quốc Gia</Select.Option>
              <Select.Option value="EVENT">Sự kiện Công ty / Nghỉ bù</Select.Option>
              <Select.Option value="ABNORMAL">Nghỉ Bất thường</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dates" label="Khoảng thời gian nghỉ" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="symbol" label="Ký hiệu công điền vào bảng công" rules={[{ required: true }]}>
            <Input placeholder="VD: L" />
          </Form.Item>
          <Form.Item name="hasSalary" label="Cờ hưởng lương" valuePropName="checked">
            <Switch checkedChildren="Có hưởng lương" unCheckedChildren="Không hưởng lương" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
