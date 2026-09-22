'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Avatar,
  Space,
  Popconfirm,
  App,
  Tooltip,
  Tag,
} from 'antd';
import {
  PlusCircleOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
  RightOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';
import { JobTitleModal } from './job-title-modal';

export function JobTitlesSettingsScreen() {
  const router = useRouter();
  const { message } = App.useApp();
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'jobTitles' | 'levels'>('jobTitles');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/employee-catalogs');
      if (Array.isArray(res.data)) {
        const list = res.data.filter((c: any) => c.kind === 'JOB_TITLE');
        setJobTitles(list);
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách chức vụ:', err);
      message.error('Không thể tải danh sách chức vụ');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/employee-catalogs/${id}`);
      message.success('✅ Đã xóa chức vụ thành công!');
      await fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa chức vụ này');
    }
  };

  const columns: any[] = [
    {
      title: 'Người tạo',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 90,
      align: 'center',
      render: (name: string) => (
        <Avatar
          style={{
            backgroundColor: '#10b981',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 13,
            width: 32,
            height: 32,
            lineHeight: '32px',
          }}
        >
          {name ? name.charAt(0).toUpperCase() : 'A'}
        </Avatar>
      ),
    },
    {
      title: 'Mã chức vụ',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (val: string) => (
        <span style={{ color: val ? '#1e293b' : '#94a3b8', fontWeight: val ? 500 : 400, fontSize: 13 }}>
          {val || '--'}
        </span>
      ),
    },
    {
      title: 'Tên chức vụ',
      dataIndex: 'name',
      key: 'name',
      minWidth: 260,
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, whiteSpace: 'nowrap' }}>
            {name}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4, whiteSpace: 'nowrap' }}>
            {record.createdAt ? dayjs(record.createdAt).format('HH:mm DD/MM/YYYY') : '15:07 13/05/2026'}
          </div>
        </div>
      ),
    },
    {
      title: 'Cấp bậc',
      dataIndex: 'rankLevel',
      key: 'rankLevel',
      minWidth: 180,
      render: (val: string) => (
        <Tag color="purple" style={{ borderRadius: 6, fontWeight: 500, fontSize: 12 }}>
          {val || 'Level 4'}
        </Tag>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 90,
      align: 'center',
      render: (val: number) => (
        <span style={{ fontWeight: 600, color: '#64748b', fontSize: 13 }}>
          {val ?? 1}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      align: 'center',
      render: (_: any, record: any) => (
        <Tag
          color={record.active !== false ? 'success' : 'default'}
          style={{
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 12,
            padding: '2px 10px',
            backgroundColor: record.active !== false ? '#ecfdf5' : '#f1f5f9',
            color: record.active !== false ? '#059669' : '#64748b',
            border: 'none',
          }}
        >
          {record.active !== false ? 'Hoạt động' : 'Tạm ngưng'}
        </Tag>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      minWidth: 160,
      render: (val: string) => (
        <span style={{ color: val ? '#475569' : '#94a3b8', fontSize: 13 }}>
          {val || '--'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#3b82f6', fontSize: 15 }} />}
              onClick={() => {
                setEditItem(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa chức vụ này?"
            description="Bạn có chắc chắn muốn xóa chức vụ này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ color: '#ef4444', fontSize: 15 }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px)', background: '#f8fafc', width: '100%' }}>
      {/* ── LEFT SIDEBAR: Cài đặt chung (Image 1 & 2) ────────────────────── */}
      <div
        style={{
          width: 260,
          borderRight: '1px solid #e2e8f0',
          padding: '20px 0',
          background: '#ffffff',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '0 20px 16px 20px' }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/hrm/employees')}
            style={{
              color: '#64748b',
              fontSize: 13,
              fontWeight: 500,
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Quay lại Hồ sơ
          </Button>
        </div>

        {/* Group 1: Cài đặt chung */}
        <div
          style={{
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SettingOutlined style={{ color: '#64748b', fontSize: 16 }} />
            <span>Cài đặt chung</span>
          </div>
          <DownOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
        </div>

        {/* Sub-menu items */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4 }}>
          <div
            onClick={() => router.push('/hrm/settings/positions')}
            style={{
              padding: '11px 20px 11px 44px',
              fontSize: 13.5,
              color: '#475569',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Vị trí công việc
          </div>

          <div
            style={{
              padding: '11px 20px 11px 44px',
              fontSize: 13.5,
              fontWeight: 600,
              color: '#e83e8c',
              background: '#fff0f6',
              cursor: 'pointer',
              borderLeft: '3px solid #e83e8c',
            }}
          >
            Chức vụ
          </div>

          <div
            style={{ padding: '11px 20px 11px 44px', fontSize: 13.5, color: '#94a3b8', cursor: 'default' }}
          >
            Nơi làm việc
          </div>
          <div
            style={{ padding: '11px 20px 11px 44px', fontSize: 13.5, color: '#94a3b8', cursor: 'default' }}
          >
            Phạt nội bộ
          </div>
          <div
            style={{ padding: '11px 20px 11px 44px', fontSize: 13.5, color: '#94a3b8', cursor: 'default' }}
          >
            Chế độ phúc lợi
          </div>
          <div
            style={{ padding: '11px 20px 11px 44px', fontSize: 13.5, color: '#94a3b8', cursor: 'default' }}
          >
            Lộ trình thăng tiến
          </div>
          <div
            style={{ padding: '11px 20px 11px 44px', fontSize: 13.5, color: '#94a3b8', cursor: 'default' }}
          >
            Cài đặt nhãn
          </div>
          <div
            style={{ padding: '11px 20px 11px 44px', fontSize: 13.5, color: '#94a3b8', cursor: 'default' }}
          >
            Quy trình duyệt
          </div>
        </div>

        {/* Group 2: Cài đặt đối tượng */}
        <div
          style={{
            marginTop: 20,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13.5,
            fontWeight: 600,
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Cài đặt đối tượng</span>
          </div>
          <RightOutlined style={{ fontSize: 11, color: '#94a3b8' }} />
        </div>
      </div>

      {/* ── RIGHT MAIN PANEL (Image 1 & 2) ────────────────────────────────── */}
      <div style={{ flex: 1, padding: '24px 32px', minWidth: 0, overflowX: 'auto' }}>
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            padding: '20px 24px',
          }}
        >
          {/* Top Header Tab & Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f1f5f9',
              paddingBottom: 14,
              marginBottom: 16,
            }}
          >
            {/* Tabs: Chức vụ / Cấp bậc */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div
                onClick={() => setActiveTab('jobTitles')}
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: activeTab === 'jobTitles' ? '#e83e8c' : '#64748b',
                  borderBottom: activeTab === 'jobTitles' ? '2px solid #e83e8c' : '2px solid transparent',
                  paddingBottom: 14,
                  marginBottom: -15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Chức vụ</span>
                <Tag
                  style={{
                    borderRadius: 12,
                    background: '#fff0f6',
                    color: '#e83e8c',
                    borderColor: '#ffd6e7',
                    fontWeight: 600,
                    fontSize: 12,
                    padding: '1px 8px',
                  }}
                >
                  {jobTitles.length}
                </Tag>
              </div>

              <div
                onClick={() => setActiveTab('levels')}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: activeTab === 'levels' ? '#e83e8c' : '#64748b',
                  borderBottom: activeTab === 'levels' ? '2px solid #e83e8c' : '2px solid transparent',
                  paddingBottom: 14,
                  marginBottom: -15,
                  cursor: 'pointer',
                }}
              >
                Cấp bậc
              </div>
            </div>

            {/* Action buttons on top right: (+) Tạo mới, Export */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Button
                type="primary"
                icon={<PlusCircleOutlined />}
                onClick={() => {
                  setEditItem(null);
                  setModalOpen(true);
                }}
                style={{
                  background: '#e83e8c',
                  borderColor: '#e83e8c',
                  fontWeight: 600,
                  fontSize: 13,
                  height: 36,
                  borderRadius: 6,
                  boxShadow: '0 2px 4px rgba(232, 62, 140, 0.2)',
                }}
              >
                Tạo mới
              </Button>
              <Button
                icon={<ExportOutlined />}
                style={{
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 500,
                  height: 36,
                  borderRadius: 6,
                }}
              >
                Export
              </Button>
            </div>
          </div>

          {/* Job Titles Table */}
          <Table
            loading={loading}
            columns={columns}
            dataSource={jobTitles.map((j) => ({ ...j, key: j.id }))}
            pagination={false}
            rowSelection={{
              type: 'checkbox',
            }}
            bordered={false}
            scroll={{ x: 'max-content' }}
            style={{
              background: '#ffffff',
            }}
          />
        </div>
      </div>

      {/* ── MODAL TẠO MỚI / SỬA CHỨC VỤ (Image 2) ────────────────────────── */}
      <JobTitleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchData()}
        editData={editItem}
      />
    </div>
  );
}
