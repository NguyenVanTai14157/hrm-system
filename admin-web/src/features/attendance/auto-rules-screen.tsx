'use client';

import React, { useState } from 'react';
import { Table, Card, Button, Input, Select, Tag, Modal, Form, DatePicker, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, CheckCircleOutlined, StopOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface AutoRuleRecord {
  id: string;
  code: string;
  name: string;
  department: string;
  position: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED';
  note: string;
}

const MOCK_RULES: AutoRuleRecord[] = [
  {
    id: '1',
    code: 'NV0001',
    name: 'Trần Văn Mạnh',
    department: 'BAN GIÁM ĐỐC',
    position: 'Tổng Giám đốc',
    startDate: '2026-01-01',
    endDate: 'Vĩnh viễn',
    status: 'ACTIVE',
    note: 'Áp dụng tự động 1.0 công chuẩn/ngày có ca. Ưu tiên trừ công nếu có đơn nghỉ không lương.',
  },
  {
    id: '2',
    code: 'NV0003',
    name: 'Phạm Hồng Nhung',
    department: 'BAN GIÁM ĐỐC',
    position: 'Phó Tổng Giám đốc',
    startDate: '2026-01-01',
    endDate: 'Vĩnh viễn',
    status: 'ACTIVE',
    note: 'Tự động ghi nhận đủ công, không phạt đi muộn/về sớm.',
  },
  {
    id: '3',
    code: 'NV0045',
    name: 'Lê Hoàng Nam',
    department: 'MARKETING',
    position: 'Giám đốc Marketing',
    startDate: '2026-06-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    note: 'Áp dụng cho Sale thị trường đi công tác thường xuyên.',
  }
];

export function AutoRulesScreen() {
  const [rules, setRules] = useState<AutoRuleRecord[]>(MOCK_RULES);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Mã NV',
      dataIndex: 'code',
      key: 'code',
      width: 100,
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
      title: 'Chức danh / Vị trí',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Thời gian áp dụng',
      key: 'time',
      render: (record: AutoRuleRecord) => (
        <span>{record.startDate} $\rightarrow$ {record.endDate}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color="green" icon={<CheckCircleOutlined />}>Đang áp dụng</Tag>
      ),
    },
    {
      title: 'Ghi chú & Quy tắc ngoại lệ',
      dataIndex: 'note',
      key: 'note',
      width: 320,
      render: (note: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{note}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (record: AutoRuleRecord) => (
        <Popconfirm
          title="Ngừng áp dụng tự động chấm công?"
          onConfirm={() => {
            setRules(rules.filter(r => r.id !== record.id));
            message.success('Đã ngừng áp dụng tự động chấm công');
          }}
        >
          <Button type="link" danger size="small">Ngừng áp dụng</Button>
        </Popconfirm>
      ),
    }
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>⚡ Danh sách Nhân sự Tự động Chấm công</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Áp dụng cho Ban Giám đốc, Quản lý cấp cao & Sale thị trường. Tự động ghi nhận đủ công không cần bấm vân tay/GPS.
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#059669', borderColor: '#059669' }}
          onClick={() => setModalOpen(true)}
        >
          Thêm nhân sự tự động chấm công
        </Button>
      </div>

      <Card bodyStyle={{ padding: '12px 16px' }} style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <Space>
          <Input prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Tìm kiếm nhân sự..." style={{ width: 250 }} />
          <Select defaultValue="ALL" style={{ width: 200 }}>
            <Select.Option value="ALL">Tất cả phòng ban</Select.Option>
            <Select.Option value="BGD">BAN GIÁM ĐỐC</Select.Option>
            <Select.Option value="MKT">MARKETING</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Table dataSource={rules} columns={columns} rowKey="id" pagination={false} />
      </Card>

      <Modal
        title="Thêm nhân sự áp dụng Tự động Chấm công"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        mask={{ closable: false }}
        onOk={() => {
          form.validateFields().then(values => {
            const newRule: AutoRuleRecord = {
              id: Date.now().toString(),
              code: values.code,
              name: values.name,
              department: values.department,
              position: 'Cấp quản lý',
              startDate: values.dateRange[0].format('YYYY-MM-DD'),
              endDate: values.dateRange[1] ? values.dateRange[1].format('YYYY-MM-DD') : 'Vĩnh viễn',
              status: 'ACTIVE',
              note: values.note || 'Tự động ghi nhận đủ 1.0 công/ngày.',
            };
            setRules([...rules, newRule]);
            setModalOpen(false);
            form.resetFields();
            message.success('Thêm mới cấu hình tự động chấm công thành công');
          });
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="code" label="Mã Nhân viên" rules={[{ required: true }]}>
            <Input placeholder="VD: NV0088" />
          </Form.Item>
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="department" label="Phòng ban" rules={[{ required: true }]}>
            <Select placeholder="Chọn phòng ban">
              <Select.Option value="BAN GIÁM ĐỐC">BAN GIÁM ĐỐC</Select.Option>
              <Select.Option value="MARKETING">MARKETING</Select.Option>
              <Select.Option value="KHO HÀNG">KHO HÀNG</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="Khoảng thời gian áp dụng" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú quy tắc">
            <Input.TextArea placeholder="Mô tả quy tắc tự động công..." rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
