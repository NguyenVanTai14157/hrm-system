'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Input,
  Button,
  Tabs,
  Tag,
  Space,
  Popconfirm,
  message,
  Tooltip,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FolderFilled,
  ApartmentOutlined,
  HistoryOutlined,
  ExportOutlined,
  ImportOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import { DepartmentModal } from './department-modal';

export function DepartmentsScreen() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);

  // Fetch departments from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/employee-catalogs');
      if (Array.isArray(res.data)) {
        setDepartments(res.data.filter((c: any) => c.kind === 'DEPARTMENT'));
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách phòng ban:', err);
      message.error('Không thể tải danh sách phòng ban');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Delete handler
  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/employee-catalogs/${id}`);
      message.success('✅ Đã xóa phòng ban thành công!');
      await fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể xóa phòng ban');
    }
  };

  // Build hierarchical tree
  const treeData = useMemo(() => {
    let filtered = departments;
    if (activeTab === 'inactive') {
      filtered = departments.filter((d) => d.active === false);
    } else {
      filtered = departments.filter((d) => d.active !== false);
    }

    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      filtered = filtered.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.code?.toLowerCase().includes(q) ||
          d.businessBlock?.toLowerCase().includes(q) ||
          d.departmentType?.toLowerCase().includes(q)
      );
    }

    // Build tree
    const map = new Map<string, any>();
    filtered.forEach((d) => {
      map.set(d.id, { ...d, key: d.id, children: [] });
    });

    const roots: any[] = [];
    filtered.forEach((d) => {
      const node = map.get(d.id);
      if (d.parentId && map.has(d.parentId)) {
        map.get(d.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const clean = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) {
          clean(n.children);
        } else {
          delete n.children;
        }
      });
    };
    clean(roots);
    return roots;
  }, [departments, activeTab, searchText]);

  // Dropdown menu next to title (Image 3)
  const titleDropdownItems: MenuProps['items'] = [
    { key: '1', label: 'Phòng ban, chi nhánh' },
    { key: '2', label: 'Khối nghiệp vụ' },
    { key: '3', label: 'Loại phòng ban' },
    { key: '4', label: 'Nhóm người dùng' },
    { key: '5', label: 'Quản lý tiền tệ' },
    { key: '6', label: 'Cấu hình SSO' },
    { key: '7', label: 'OIDC App' },
  ];

  const columns: any[] = [
    {
      title: 'Tiêu đề',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <FolderFilled style={{ color: record.permissionStructure === 'Công ty' ? '#e83e8c' : '#faad14', fontSize: 16 }} />
          <span style={{ color: '#1e293b' }}>{text}</span>
          {record.code && (
            <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 400 }}>
              ({record.code})
            </span>
          )}
        </span>
      ),
    },
    {
      title: 'Cấu trúc quyền',
      dataIndex: 'permissionStructure',
      key: 'permissionStructure',
      width: 180,
      render: (val: string) => val || 'Phòng ban',
    },
    {
      title: 'Loại phòng ban',
      dataIndex: 'departmentType',
      key: 'departmentType',
      width: 180,
      render: (val: string) => val || '--',
    },
    {
      title: 'Khối nghiệp vụ',
      dataIndex: 'businessBlock',
      key: 'businessBlock',
      width: 180,
      render: (val: string) => val || '--',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      align: 'center',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#3b82f6' }} />}
              onClick={() => {
                setEditItem(record);
                setModalOpen(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa phòng ban này?"
            description="Bạn có chắc chắn muốn xóa phòng ban này không?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px 24px', background: '#ffffff', minHeight: '100vh' }}>
      {/* ── TOP HEADER (Image 2) ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Nút Tạo mới hình vuông màu hồng [+] (Image 2) */}
          <button
            type="button"
            onClick={() => {
              setEditItem(null);
              setModalOpen(true);
            }}
            title="Thêm mới phòng ban"
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: '#e83e8c',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
              boxShadow: '0 2px 4px rgba(232, 62, 140, 0.25)',
            }}
          >
            <PlusOutlined />
          </button>

          {/* Tiêu đề Danh sách phòng ban có dropdown arrow (Image 2 & 3) */}
          <Dropdown menu={{ items: titleDropdownItems }} trigger={['click']}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                Danh sách phòng ban
              </span>
              <DownOutlined style={{ fontSize: 12, color: '#64748b' }} />
            </div>
          </Dropdown>
        </div>

        {/* Ô Tìm kiếm (Image 2) */}
        <div style={{ width: 280 }}>
          <Input
            placeholder="Tìm kiếm"
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ borderRadius: 6 }}
          />
        </div>
      </div>

      {/* ── TABS (Image 2) ──────────────────────────────────────────────── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 8 }}
        items={[
          {
            key: 'active',
            label: `Phòng ban, chi nhánh (${departments.filter((d) => d.active !== false).length})`,
          },
          {
            key: 'block',
            label: `Khối nghiệp vụ (${departments.filter((d) => !!d.businessBlock).length})`,
          },
          {
            key: 'type',
            label: `Loại phòng ban (${departments.filter((d) => !!d.departmentType).length})`,
          },
          {
            key: 'inactive',
            label: `Phòng ban không hoạt động (${departments.filter((d) => d.active === false).length})`,
          },
        ]}
      />

      {/* ── SUB-TOOLBAR: Hiển thị bản ghi & Các nút hành động (Image 2) ───── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          marginBottom: 12,
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ fontSize: 13, color: '#64748b' }}>
          Hiển thị 1 - {departments.length} / {departments.length} bản ghi
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button type="text" size="small" icon={<ApartmentOutlined />} style={{ color: '#64748b', fontSize: 13 }}>
            Sơ đồ
          </Button>
          <Button type="text" size="small" icon={<SettingOutlined />} style={{ color: '#64748b', fontSize: 13 }}>
            Cập nhật phòng...
          </Button>
          <Button type="text" size="small" icon={<HistoryOutlined />} style={{ color: '#64748b', fontSize: 13 }}>
            Lịch sử
          </Button>
          <Button type="text" size="small" icon={<ExportOutlined />} style={{ color: '#64748b', fontSize: 13 }}>
            Export
          </Button>
          <Button type="text" size="small" icon={<ImportOutlined />} style={{ color: '#64748b', fontSize: 13 }}>
            Import
          </Button>
          <Button type="text" size="small" icon={<SettingOutlined />} style={{ color: '#64748b', fontSize: 13 }}>
            Cài đặt
          </Button>
        </div>
      </div>

      {/* ── TREE TABLE (Image 2) ────────────────────────────────────────── */}
      <Table
        loading={loading}
        columns={columns}
        dataSource={treeData}
        pagination={false}
        defaultExpandAllRows={true}
        rowSelection={{
          type: 'checkbox',
        }}
        bordered={false}
        style={{
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #f1f5f9',
        }}
      />

      {/* ── MODAL TẠO MỚI / SỬA PHÒNG BAN (Image 4) ────────────────────── */}
      <DepartmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchData()}
        editData={editItem}
        departmentsList={departments}
      />
    </div>
  );
}
