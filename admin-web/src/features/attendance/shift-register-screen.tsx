'use client';

import React, { useState } from 'react';
import { Table, Card, Button, Tag, Space, Select, Input, Modal, Form, DatePicker, message, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface ShiftRegisterRecord {
  id: string;
  code: string;
  name: string;
  department: string;
  type: 'Làm thêm ca' | 'Đổi ca làm việc' | 'Đăng ký ca mới';
  date: string;
  currentShift: string;
  targetShift: string;
  reason: string;
  status: 'WAITING' | 'APPROVING' | 'APPROVED' | 'NO_APPROVED';
  approver: string;
  createdAt: string;
}

const MOCK_REGISTERS: ShiftRegisterRecord[] = [
  {
    id: '1',
    code: 'NV0016',
    name: 'Nguyễn Thị Kim Nhi',
    department: 'KIỂM SOÁT NỘI BỘ',
    type: 'Đổi ca làm việc',
    date: '2026-09-20',
    currentShift: 'Ca Hành chính (08:00 - 17:30)',
    targetShift: 'Ca Sáng (07:00 - 15:30)',
    reason: 'Có việc gia đình buổi chiều cần xoay ca',
    status: 'APPROVED',
    approver: 'Trần Văn Mạnh (TP)',
    createdAt: '2026-09-18 09:30',
  },
  {
    id: '2',
    code: 'NV0099',
    name: 'Nguyễn Trần Nam Anh',
    department: 'KHO HÀNG',
    type: 'Làm thêm ca',
    date: '2026-09-21',
    currentShift: 'Ca Hành chính (08:00 - 17:30)',
    targetShift: 'Ca Đêm (18:00 - 22:00 OT)',
    reason: 'Hỗ trợ kiểm kê kho cuối tháng',
    status: 'WAITING',
    approver: 'Phạm Hồng Nhung (GĐ)',
    createdAt: '2026-09-18 14:15',
  },
  {
    id: '3',
    code: 'NV0102',
    name: 'Nguyễn Thị Phúc Thảo',
    department: 'KHO HÀNG',
    type: 'Đăng ký ca mới',
    date: '2026-09-22',
    currentShift: 'Nghỉ N',
    targetShift: 'Ca Hành chính (08:00 - 17:30)',
    reason: 'Đăng ký làm tăng cường',
    status: 'APPROVING',
    approver: 'Lê Hoàng Nam (HR)',
    createdAt: '2026-09-18 16:00',
  }
];

export function ShiftRegisterScreen() {
  const [data, setData] = useState<ShiftRegisterRecord[]>(MOCK_REGISTERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleApprove = (id: string, status: 'APPROVED' | 'NO_APPROVED') => {
    setData(prev =>
      prev.map(item => (item.id === id ? { ...item, status } : item))
    );
    message.success(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} đơn đăng ký ca`);
  };

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: string) => <strong style={{ color: '#2563eb' }}>#DKC-{id}</strong>,
    },
    {
      title: 'Nhân sự đăng ký',
      key: 'emp',
      width: 220,
      render: (record: ShiftRegisterRecord) => (
        <div>
          <strong style={{ color: '#0f172a', display: 'block' }}>{record.name}</strong>
          <span style={{ fontSize: 12, color: '#64748b' }}>{record.code} - {record.department}</span>
        </div>
      ),
    },
    {
      title: 'Loại đơn',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'Đổi ca làm việc' ? 'purple' : type === 'Làm thêm ca' ? 'blue' : 'green'}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Ngày áp dụng',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <strong>{date}</strong>,
    },
    {
      title: 'Ca hiện tại $\rightarrow$ Ca mới',
      key: 'shifts',
      render: (record: ShiftRegisterRecord) => (
        <div style={{ fontSize: 12 }}>
          <span style={{ color: '#94a3b8', textDecoration: 'line-through' }}>{record.currentShift}</span>
          <br />
          <strong style={{ color: '#059669' }}>$\rightarrow$ {record.targetShift}</strong>
        </div>
      ),
    },
    {
      title: 'Lý do đăng ký',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => <span style={{ fontSize: 12, color: '#475569' }}>{reason}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'APPROVED') return <Tag color="green" icon={<CheckOutlined />}>Đã duyệt</Tag>;
        if (status === 'NO_APPROVED') return <Tag color="red" icon={<CloseOutlined />}>Từ chối</Tag>;
        if (status === 'APPROVING') return <Tag color="processing" icon={<ClockCircleOutlined />}>Đang duyệt</Tag>;
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Chờ duyệt</Tag>;
      },
    },
    {
      title: 'Người duyệt',
      dataIndex: 'approver',
      key: 'approver',
      render: (approver: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{approver}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      render: (record: ShiftRegisterRecord) => (
        record.status === 'WAITING' || record.status === 'APPROVING' ? (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              style={{ background: '#059669', borderColor: '#059669' }}
              onClick={() => handleApprove(record.id, 'APPROVED')}
            >
              Duyệt
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleApprove(record.id, 'NO_APPROVED')}
            >
              Từ chối
            </Button>
          </Space>
        ) : (
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Đã xử lý</span>
        )
      ),
    }
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>📝 Bảng Đăng ký ca & Đổi ca làm việc</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Tự động cập nhật và ghi đè vào Bảng phân ca chính ngay khi Đơn đăng ký ca được duyệt (APPROVED).
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ background: '#e83e8c', borderColor: '#e83e8c' }}
          onClick={() => setModalOpen(true)}
        >
          Tạo đơn đăng ký / đổi ca
        </Button>
      </div>

      <Card bodyStyle={{ padding: '12px 16px' }} style={{ borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
        <Space>
          <Input prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Tìm đơn theo mã NV / tên..." style={{ width: 250 }} />
          <Select defaultValue="ALL" style={{ width: 180 }}>
            <Select.Option value="ALL">Tất cả loại đơn</Select.Option>
            <Select.Option value="DOI">Đổi ca làm việc</Select.Option>
            <Select.Option value="OT">Làm thêm ca</Select.Option>
            <Select.Option value="MOI">Đăng ký ca mới</Select.Option>
          </Select>
          <Select defaultValue="ALL_STATUS" style={{ width: 160 }}>
            <Select.Option value="ALL_STATUS">Tất cả trạng thái</Select.Option>
            <Select.Option value="WAITING">Chờ duyệt</Select.Option>
            <Select.Option value="APPROVED">Đã duyệt</Select.Option>
            <Select.Option value="NO_APPROVED">Từ chối</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={false} />
      </Card>

      <Modal
        title="Tạo đơn Đăng ký ca / Đổi ca"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        mask={{ closable: false }}
        onOk={() => {
          form.validateFields().then(values => {
            const newItem: ShiftRegisterRecord = {
              id: Date.now().toString().slice(-4),
              code: 'NV0016',
              name: 'Nguyễn Thị Kim Nhi',
              department: 'KIỂM SOÁT NỘI BỘ',
              type: values.type,
              date: values.date.format('YYYY-MM-DD'),
              currentShift: 'Ca Hành chính (08:00 - 17:30)',
              targetShift: values.targetShift,
              reason: values.reason,
              status: 'WAITING',
              approver: 'Trưởng phòng KSNB',
              createdAt: dayjs().format('YYYY-MM-DD HH:mm'),
            };
            setData([newItem, ...data]);
            setModalOpen(false);
            form.resetFields();
            message.success('Đã gửi đơn đăng ký ca thành công');
          });
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="type" label="Loại đơn" rules={[{ required: true }]}>
            <Select placeholder="Chọn loại đơn">
              <Select.Option value="Đổi ca làm việc">Đổi ca làm việc</Select.Option>
              <Select.Option value="Làm thêm ca">Làm thêm ca (OT)</Select.Option>
              <Select.Option value="Đăng ký ca mới">Đăng ký ca mới</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Ngày áp dụng" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="targetShift" label="Ca làm việc mong muốn" rules={[{ required: true }]}>
            <Select placeholder="Chọn ca mong muốn">
              <Select.Option value="Ca Sáng (07:00 - 15:30)">Ca Sáng (07:00 - 15:30)</Select.Option>
              <Select.Option value="Ca Hành chính (08:00 - 17:30)">Ca Hành chính (08:00 - 17:30)</Select.Option>
              <Select.Option value="Ca Tối (15:00 - 23:00)">Ca Tối (15:00 - 23:00)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="reason" label="Lý do đăng ký" rules={[{ required: true }]}>
            <Input.TextArea placeholder="Nhập lý do chi tiết..." rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
