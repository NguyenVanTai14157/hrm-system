'use client';

import React, { useState } from 'react';
import { Table, Card, Button, Tag, Space, Input, Modal, Form, Select, Badge, message } from 'antd';
import { PlusOutlined, SearchOutlined, SyncOutlined, ApiOutlined, CheckCircleOutlined, DisconnectOutlined } from '@ant-design/icons';

interface DeviceRecord {
  id: string;
  title: string;
  machineId: string;
  ipMachine: string;
  deviceId: string;
  place: string;
  typeof: 'ALL' | 'IN' | 'OUT';
  status: 'UPDATED' | 'PENDING' | 'DISCONNECTED';
  lastTimeUpdate: string;
}

const MOCK_DEVICES: DeviceRecord[] = [
  {
    id: '1',
    title: 'Máy FaceID Vân Tay - Tầng 1 (Cổng chính)',
    machineId: 'Hanet AI Camera',
    ipMachine: '192.168.1.201:8080',
    deviceId: 'HN-2026-X88',
    place: 'Trụ sở 14 Lê Duy Đình - Đà Nẵng',
    typeof: 'ALL',
    status: 'UPDATED',
    lastTimeUpdate: '2026-09-18 22:58:14',
  },
  {
    id: '2',
    title: 'Máy Quẹt Thẻ / Vân Tay - Kho Hàng',
    machineId: 'Ronald Jack K40',
    ipMachine: '192.168.2.105:4370',
    deviceId: 'RJ-K40-994',
    place: 'Kho Tổng Hòa Cầm - Đà Nẵng',
    typeof: 'IN',
    status: 'UPDATED',
    lastTimeUpdate: '2026-09-18 22:45:00',
  },
  {
    id: '3',
    title: 'Máy Cửa Hàng 126 Nguyễn Thị Minh Khai',
    machineId: 'Hikvision FaceID',
    ipMachine: '115.79.42.18:8000',
    deviceId: 'HK-DS-K1T341',
    place: 'Cửa hàng 126 Nguyễn Thị Minh Khai',
    typeof: 'ALL',
    status: 'PENDING',
    lastTimeUpdate: '2026-09-18 21:30:22',
  }
];

export function DevicesScreen() {
  const [devices, setDevices] = useState<DeviceRecord[]>(MOCK_DEVICES);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'Tên định danh thiết bị',
      key: 'title',
      render: (record: DeviceRecord) => (
        <div>
          <strong style={{ color: '#0f172a', display: 'block' }}>{record.title}</strong>
          <span style={{ fontSize: 12, color: '#64748b' }}>Loại máy: {record.machineId} | SN: {record.deviceId}</span>
        </div>
      ),
    },
    {
      title: 'Địa chỉ IP / DDNS',
      dataIndex: 'ipMachine',
      key: 'ipMachine',
      render: (ip: string) => <Tag color="blue" style={{ fontFamily: 'monospace' }}>{ip}</Tag>,
    },
    {
      title: 'Địa điểm lắp đặt',
      dataIndex: 'place',
      key: 'place',
    },
    {
      title: 'Hướng quét',
      dataIndex: 'typeof',
      key: 'typeof',
      render: (type: string) => {
        if (type === 'IN') return <Tag color="cyan">Chỉ Check-IN</Tag>;
        if (type === 'OUT') return <Tag color="orange">Chỉ Check-OUT</Tag>;
        return <Tag color="purple">Vào & Ra (ALL)</Tag>;
      },
    },
    {
      title: 'Trạng thái đồng bộ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        if (status === 'UPDATED') return <Badge status="success" text={<strong style={{ color: '#059669' }}>Đã đồng bộ</strong>} />;
        if (status === 'PENDING') return <Badge status="processing" text={<span style={{ color: '#2563eb' }}>Đang kết nối...</span>} />;
        return <Badge status="error" text={<span style={{ color: '#ef4444' }}>Mất kết nối</span>} />;
      },
    },
    {
      title: 'Lần cập nhật cuối',
      dataIndex: 'lastTimeUpdate',
      key: 'lastTimeUpdate',
      render: (time: string) => <span style={{ fontSize: 12, color: '#64748b' }}>{time}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (record: DeviceRecord) => (
        <Space>
          <Button
            size="small"
            icon={<SyncOutlined />}
            onClick={() => message.info(`Đã phát lệnh kéo dữ liệu từ máy ${record.deviceId}`)}
          >
            Đồng bộ log
          </Button>
        </Space>
      ),
    }
  ];

  return (
    <div style={{ padding: '16px 24px', background: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0f172a' }}>📟 Quản lý Danh sách Máy chấm công</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Tự động đồng bộ dữ liệu Real-time qua Webhook/API hoặc Cronjob kéo log 15 phút/lần từ thiết bị chấm công.
          </p>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} onClick={() => message.success('Đã làm mới danh sách thiết bị')}>
            Đồng bộ toàn bộ máy
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{ background: '#2563eb', borderColor: '#2563eb' }}
            onClick={() => setModalOpen(true)}
          >
            Thêm máy chấm công
          </Button>
        </Space>
      </div>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <Table dataSource={devices} columns={columns} rowKey="id" pagination={false} />
      </Card>

      <Modal
        title="Thêm máy chấm công mới"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        mask={{ closable: false }}
        onOk={() => {
          form.validateFields().then(values => {
            const newDev: DeviceRecord = {
              id: Date.now().toString(),
              title: values.title,
              machineId: values.machineId,
              ipMachine: values.ipMachine,
              deviceId: values.deviceId,
              place: values.place,
              typeof: values.typeof,
              status: 'UPDATED',
              lastTimeUpdate: 'Vừa xong',
            };
            setDevices([...devices, newDev]);
            setModalOpen(false);
            form.resetFields();
            message.success('Đã thêm máy chấm công mới');
          });
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Tên định danh máy" rules={[{ required: true }]}>
            <Input placeholder="VD: Máy vân tay Tầng 2" />
          </Form.Item>
          <Form.Item name="machineId" label="Chủng loại thiết bị" rules={[{ required: true }]}>
            <Select placeholder="Chọn chủng loại">
              <Select.Option value="Hanet AI Camera">Hanet AI Camera FaceID</Select.Option>
              <Select.Option value="Ronald Jack K40">Ronald Jack K40</Select.Option>
              <Select.Option value="Hikvision FaceID">Hikvision FaceID</Select.Option>
              <Select.Option value="ZK Device">ZKTeco Device</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="ipMachine" label="Địa chỉ IP / Domain DDNS" rules={[{ required: true }]}>
            <Input placeholder="VD: 192.168.1.200:8080" />
          </Form.Item>
          <Form.Item name="deviceId" label="Mã Serial / Device ID" rules={[{ required: true }]}>
            <Input placeholder="VD: SN-2026-889" />
          </Form.Item>
          <Form.Item name="place" label="Địa điểm lắp đặt" rules={[{ required: true }]}>
            <Input placeholder="VD: Trụ sở chính 14 Lê Duy Đình" />
          </Form.Item>
          <Form.Item name="typeof" label="Hướng quẹt công" rules={[{ required: true }]}>
            <Select placeholder="Chọn hướng">
              <Select.Option value="ALL">Vào & Ra (ALL)</Select.Option>
              <Select.Option value="IN">Chỉ Check-IN</Select.Option>
              <Select.Option value="OUT">Chỉ Check-OUT</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
