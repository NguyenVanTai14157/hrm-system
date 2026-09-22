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
  ImportOutlined,
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
import { PositionModal } from './position-modal';

export function PositionsSettingsScreen() {
  const router = useRouter();
  const { message } = App.useApp();
  const [positions, setPositions] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/employee-catalogs');
      if (Array.isArray(res.data)) {
        setPositions(res.data.filter((c: any) => c.kind === 'POSITION'));
        setJobTitles(res.data.filter((c: any) => c.kind === 'JOB_TITLE'));
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách vị trí:', err);
      message.error('Không thể tải danh sách vị trí công việc');
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
      message.success('✅ Đã xóa vị trí công việc thành công!');
      await fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa vị trí công việc');
    }
  };

  const getJobTitleName = (jtId?: string) => {
    if (!jtId) return '--';
    const jt = jobTitles.find((j) => j.id === jtId || j.code === jtId);
    return jt ? jt.name : jtId;
  };

  const formatSalary = (from?: number | null, to?: number | null) => {
    if ((from === null || from === undefined) && (to === null || to === undefined)) {
      return '--';
    }
    if (from && to) {
      return `${from.toLocaleString('vi-VN')} - ${to.toLocaleString('vi-VN')}`;
    }
    if (from) return `Từ ${from.toLocaleString('vi-VN')}`;
    if (to) return `Đến ${to.toLocaleString('vi-VN')}`;
    return '0';
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
      title: 'Mã',
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
      title: 'Tên vị trí',
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
      title: 'Chức vụ tương ứng',
      dataIndex: 'correspondingJobTitleId',
      key: 'correspondingJobTitleId',
      minWidth: 160,
      render: (val: string) => (
        <span style={{ color: '#334155', fontSize: 13 }}>
          {getJobTitleName(val)}
        </span>
      ),
    },
    {
      title: 'Nhóm quyền 1Office',
      dataIndex: 'roleId',
      key: 'roleId',
      minWidth: 200,
      render: (val: string) => (
        <span style={{ color: val ? '#334155' : '#94a3b8', fontSize: 13 }}>
          {val || '--'}
        </span>
      ),
    },
    {
      title: 'Mức lương',
      key: 'salary',
      minWidth: 140,
      render: (_: any, record: any) => (
        <span style={{ color: '#334155', fontSize: 13 }}>
          {formatSalary(record.salaryFrom, record.salaryTo)}
        </span>
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
            title="Xóa vị trí này?"
            description="Bạn có chắc chắn muốn xóa vị trí công việc này?"
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
      {/* ── LEFT SIDEBAR: Cài đặt chung (Image 2) ────────────────────────── */}
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
            Vị trí công việc
          </div>

          <div
            onClick={() => router.push('/hrm/settings/job-titles')}
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

      {/* ── RIGHT MAIN PANEL (Spacious Card Layout) ───────────────────────── */}
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
            {/* Tab Vị trí công việc */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#e83e8c',
                  borderBottom: '2px solid #e83e8c',
                  paddingBottom: 14,
                  marginBottom: -15,
                  display: 'inline-block',
                }}
              >
                Vị trí công việc
              </span>
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
                {positions.length}
              </Tag>
            </div>

            {/* Action buttons on top right: (+) Tạo mới, Export, Import */}
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
              <Button
                icon={<ImportOutlined />}
                style={{
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 500,
                  height: 36,
                  borderRadius: 6,
                }}
              >
                Import
              </Button>
            </div>
          </div>

          {/* Positions Table (Image 2) */}
          <Table
            loading={loading}
            columns={columns}
            dataSource={positions.map((p) => ({ ...p, key: p.id }))}
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

      {/* ── MODAL TẠO MỚI / SỬA VỊ TRÍ CÔNG VIỆC (Image 3) ───────────────── */}
      <PositionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchData()}
        editData={editItem}
        positionsList={positions}
        jobTitlesList={jobTitles}
      />
    </div>
  );
}
