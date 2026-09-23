'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Popover,
  Empty,
} from 'antd';
import type { TableProps } from 'antd';
import {
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import './settings.css';

interface AssignedEmployee {
  id?: string;
  employeeId?: string;
  employee: {
    id?: string;
    code?: string;
    name: string;
  };
}

interface Row {
  id: string;
  code: string;
  name: string;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  standardHours?: number;
  coefficient?: number;
  description?: string;
  overnight?: boolean;
  checkInBefore?: string;
  checkOutAfter?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  address?: string;
  isActive?: boolean;
  assignedEmployees?: AssignedEmployee[];
  gpsLocations?: { gpsLocationId?: string; gpsLocation?: { id: string } }[];
}

const errorMessage = (e: unknown) => {
  const value = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  return Array.isArray(value) ? value.join(', ') : value || 'Không thể thực hiện. Vui lòng thử lại.';
};

const blankGps = { code: '', name: '', longitude: 106.6775, latitude: 10.8288, radius: 100, isActive: true, address: '' };

export function AttendanceSettingsScreen() {
  const { message, modal } = App.useApp();
  const [tab, setTab] = useState<'shifts' | 'gps'>('shifts');
  const [rows, setRows] = useState<Row[]>([]);
  const [gpsRows, setGpsRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState('');
  const [query, setQuery] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // Modal State
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Watch GPS form fields for live map preview
  const watchedLat = Form.useWatch(['latitude'], form);
  const watchedLng = Form.useWatch(['longitude'], form);

  // 1. Fetch live data
  const load = useCallback(async () => {
    setLoading(true);
    setFailure('');
    setSelectedRowKeys([]);
    try {
      if (tab === 'gps') {
        const res = await apiClient.get('/attendance/settings/gps');
        setRows(res.data || []);
      } else {
        const [shiftsRes, gpsRes] = await Promise.all([
          apiClient.get('/attendance/shifts'),
          apiClient.get('/attendance/settings/gps').catch(() => ({ data: [] })),
        ]);
        setRows(shiftsRes.data || []);
        setGpsRows(gpsRes.data || []);
      }
    } catch (e) {
      setRows([]);
      setFailure(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  // 2. Open Edit / Create Modal
  function edit(row: Row | null) {
    setEditing(row);
    form.resetFields();
    if (tab === 'gps') {
      if (row) {
        form.setFieldsValue({
          code: row.code,
          name: row.name,
          longitude: row.longitude,
          latitude: row.latitude,
          radius: row.radius ?? 100,
          isActive: row.isActive ?? true,
          address: row.address || '',
          description: row.description || '',
        });
      } else {
        form.setFieldsValue({
          rows: [{ ...blankGps }],
          code: '',
          name: '',
          longitude: 106.6775,
          latitude: 10.8288,
          radius: 100,
          isActive: true,
          address: '',
        });
      }
    } else {
      if (row) {
        const isOvernight = row.overnight ?? ((row.endTime || '') <= (row.startTime || ''));
        const locationIds = row.gpsLocations?.map((x) => x.gpsLocationId || x.gpsLocation?.id).filter(Boolean) || [];
        form.setFieldsValue({
          ...row,
          overnight: isOvernight ? 'next' : 'same',
          gpsLocationIds: locationIds,
          coefficient: row.coefficient ?? 1,
        });
      } else {
        form.setFieldsValue({
          coefficient: 1,
          overnight: 'same',
          startTime: '08:00',
          endTime: '17:30',
          breakStart: '12:00',
          breakEnd: '13:30',
          checkInBefore: '01:00:00',
          checkOutAfter: '01:00:00',
          gpsLocationIds: [],
        });
      }
    }
    setOpen(true);
  }

  // 3. Save Form
  async function save() {
    const values = await form.validateFields().catch(() => null);
    if (!values) return;

    setSaving(true);
    try {
      if (tab === 'shifts') {
        const payload = {
          ...values,
          overnight: values.overnight === 'next',
        };
        const path = `/attendance/settings/shifts`;
        if (editing) {
          await apiClient.put(`${path}/${editing.id}`, payload);
        } else {
          await apiClient.post(path, payload);
        }
      } else {
        // GPS Settings
        const path = `/attendance/settings/gps`;
        if (editing) {
          await apiClient.put(`${path}/${editing.id}`, {
            code: values.code,
            name: values.name,
            longitude: values.longitude,
            latitude: values.latitude,
            radius: values.radius,
            isActive: values.isActive ?? true,
            address: values.address,
          });
        } else {
          // Create supports single or batch rows
          const rowsToSave = Array.isArray(values.rows) && values.rows.length > 0
            ? values.rows
            : [{
                code: values.code,
                name: values.name,
                longitude: values.longitude,
                latitude: values.latitude,
                radius: values.radius,
                isActive: values.isActive ?? true,
                address: values.address,
              }];
          await apiClient.post(path, { rows: rowsToSave });
        }
      }

      message.success(editing ? 'Cập nhật thành công' : 'Tạo mới thành công');
      setOpen(false);
      await load();
    } catch (e) {
      message.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  // 4. Delete Item handler
  function handleDelete(row: Row) {
    modal.confirm({
      title: 'Xác nhận xóa',
      content: `Bạn có chắc chắn muốn xóa "${row.name}" (${row.code}) không?`,
      okText: 'XÓA',
      okType: 'danger',
      cancelText: 'HỦY',
      onOk: async () => {
        try {
          if (tab === 'shifts') {
            await apiClient.delete(`/attendance/shifts/${row.id}`);
          } else {
            message.info('Vui lòng chuyển trạng thái địa điểm sang "Ngừng hoạt động" nếu không sử dụng.');
            return;
          }
          message.success('Đã xóa thành công');
          await load();
        } catch (e) {
          message.error(errorMessage(e));
        }
      },
    });
  }

  // Filtered rows by search query
  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase().trim();
    return rows.filter((row) =>
      `${row.code || ''} ${row.name || ''} ${row.address || ''}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  // 5. Export CSV
  function exportCsv() {
    const isGps = tab === 'gps';
    const headers = isGps
      ? ['Mã địa điểm', 'Tên địa điểm', 'Kinh độ', 'Vĩ độ', 'Bán kính (m)', 'Địa chỉ', 'Trạng thái']
      : ['Mã ca', 'Tên ca', 'Giờ vào', 'Giờ ra', 'Giờ nghỉ', 'Kết thúc nghỉ', 'Check in trước', 'Check out sau', 'Tổng giờ', 'Tổng công', 'Ghi chú'];

    const formatCell = (v: unknown) => {
      let s = String(v ?? '');
      if (/^[=+@\-\t\r]/.test(s)) s = `'${s}`;
      return `"${s.replaceAll('"', '""')}"`;
    };

    const csvRows = filtered.map((r) => {
      if (isGps) {
        return [
          r.code,
          r.name,
          r.longitude,
          r.latitude,
          r.radius,
          r.address,
          r.isActive ? 'Hoạt động' : 'Ngừng hoạt động',
        ].map(formatCell).join(',');
      } else {
        return [
          r.code,
          r.name,
          r.startTime,
          r.endTime,
          r.breakStart,
          r.breakEnd,
          r.checkInBefore,
          r.checkOutAfter,
          r.standardHours,
          r.coefficient,
          r.description,
        ].map(formatCell).join(',');
      }
    });

    const csvContent = '\uFEFF' + [headers.map(formatCell).join(','), ...csvRows].join('\r\n');
    const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tab === 'gps' ? 'danh_sach_dia_diem_gps' : 'danh_sach_ca_lam_viec'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Row selection
  const rowSelection: TableProps<Row>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newKeys) => setSelectedRowKeys(newKeys),
  };

  // 6. Table Columns Definition
  const shiftColumns = [
    {
      title: 'Mã ca',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string, row: Row) => (
        <Button
          type="link"
          onClick={() => edit(row)}
          style={{ padding: 0, fontWeight: 600, color: '#ff4081' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Tên ca',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, row: Row) => (
        <span
          onClick={() => edit(row)}
          style={{ fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Giờ vào',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 100,
      render: (t: string) => t || '—',
    },
    {
      title: 'Giờ ra',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 100,
      render: (t: string) => t || '—',
    },
    {
      title: 'Giờ nghỉ',
      dataIndex: 'breakStart',
      key: 'breakStart',
      width: 100,
      render: (t: string) => t || '—',
    },
    {
      title: 'Kết thúc nghỉ',
      dataIndex: 'breakEnd',
      key: 'breakEnd',
      width: 120,
      render: (t: string) => t || '—',
    },
    {
      title: 'Check in trước',
      dataIndex: 'checkInBefore',
      key: 'checkInBefore',
      width: 130,
      render: (t: string) => t || '—',
    },
    {
      title: 'Check out sau',
      dataIndex: 'checkOutAfter',
      key: 'checkOutAfter',
      width: 130,
      render: (t: string) => t || '—',
    },
    {
      title: 'Tổng giờ',
      dataIndex: 'standardHours',
      key: 'standardHours',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (typeof v === 'number' ? `${Math.round(v * 100) / 100}h` : '8h'),
    },
    {
      title: 'Tổng công',
      dataIndex: 'coefficient',
      key: 'coefficient',
      width: 100,
      align: 'right' as const,
      render: (v: number) => (v !== undefined ? `${v} công` : '1.0 công'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: () => <Tag color="green">Hoạt động</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      fixed: 'right' as const,
      render: (_: unknown, row: Row) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined style={{ color: '#0284c7' }} />}
              onClick={() => edit(row)}
            />
          </Tooltip>
          <Tooltip title="Xóa ca">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(row)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const gpsColumns = [
    {
      title: 'Mã địa điểm',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (text: string, row: Row) => (
        <Button
          type="link"
          onClick={() => edit(row)}
          style={{ padding: 0, fontWeight: 600, color: '#ff4081' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, row: Row) => (
        <div>
          <div
            onClick={() => edit(row)}
            style={{ fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
          >
            {text}
          </div>
          {row.address && (
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{row.address}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (v: boolean) => (
        <Tag color={v ? 'green' : 'default'}>{v ? 'Hoạt động' : 'Ngừng hoạt động'}</Tag>
      ),
    },
    {
      title: 'Đối tượng áp dụng',
      key: 'assignedEmployees',
      width: 220,
      render: (_: unknown, row: Row) => {
        const emps = row.assignedEmployees || [];
        if (emps.length === 0) {
          return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa gán</span>;
        }

        const names = emps.map((a) => a.employee?.name).filter(Boolean);
        if (names.length <= 2) {
          return <span>{names.join(', ')}</span>;
        }

        const visibleNames = names.slice(0, 2).join(', ');
        const popoverContent = (
          <div style={{ maxHeight: 220, overflowY: 'auto', maxWidth: 280, padding: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#1e293b' }}>
              Danh sách nhân viên được gán ({names.length}):
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
              {names.map((n, i) => (
                <li key={i} style={{ marginBottom: 3 }}>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        );

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{visibleNames}</span>
            <Popover content={popoverContent} title={null} trigger="hover">
              <Tag color="blue" style={{ cursor: 'pointer', margin: 0 }}>
                +{names.length - 2}
              </Tag>
            </Popover>
          </div>
        );
      },
    },
    {
      title: (
        <Tooltip title="Kinh độ tọa độ GPS (Longitude)">
          <span>Kinh độ <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8' }} /></span>
        </Tooltip>
      ),
      dataIndex: 'longitude',
      key: 'longitude',
      width: 120,
      align: 'right' as const,
      render: (v: number) => (v !== undefined ? v.toFixed(4) : '—'),
    },
    {
      title: (
        <Tooltip title="Vĩ độ tọa độ GPS (Latitude)">
          <span>Vĩ độ <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8' }} /></span>
        </Tooltip>
      ),
      dataIndex: 'latitude',
      key: 'latitude',
      width: 120,
      align: 'right' as const,
      render: (v: number) => (v !== undefined ? v.toFixed(4) : '—'),
    },
    {
      title: (
        <Tooltip title="Bán kính cho phép chấm công xung quanh tọa độ">
          <span>Bán kính (m) <InfoCircleOutlined style={{ fontSize: 11, color: '#94a3b8' }} /></span>
        </Tooltip>
      ),
      dataIndex: 'radius',
      key: 'radius',
      width: 130,
      align: 'right' as const,
      render: (v: number) => (v !== undefined ? `${v} m` : '100 m'),
    },
    {
      title: 'Vị trí',
      key: 'map',
      width: 120,
      render: (_: unknown, row: Row) =>
        row.latitude && row.longitude ? (
          <a
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0284c7' }}
          >
            <EnvironmentOutlined /> Xem bản đồ
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 90,
      fixed: 'right' as const,
      render: (_: unknown, row: Row) => (
        <Tooltip title="Chỉnh sửa">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined style={{ color: '#0284c7' }} />}
            onClick={() => edit(row)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="attendance-settings">
      {/* ── 1. Left Sidebar ── */}
      <aside>
        <Link href="/hrm/attendance/timekeep" className="settings-back-link">
          <ArrowLeftOutlined style={{ fontSize: 12 }} /> Quay lại phân hệ
        </Link>

        {/* Group 1: Cài đặt chung */}
        <div className="settings-nav-group">
          <div className="settings-nav-group-title">
            <SettingOutlined /> Cài đặt chung
          </div>
          <button
            disabled={loading}
            className={`settings-nav-item ${tab === 'shifts' ? 'active' : ''}`}
            onClick={() => {
              setTab('shifts');
              setQuery('');
            }}
          >
            <span>Ca làm việc</span>
            {tab === 'shifts' && <CheckCircleOutlined style={{ color: '#ff4081', fontSize: 13 }} />}
          </button>
          <button
            disabled={loading}
            className={`settings-nav-item ${tab === 'gps' ? 'active' : ''}`}
            onClick={() => {
              setTab('gps');
              setQuery('');
            }}
          >
            <span>Chấm công GPS/Wifi</span>
            {tab === 'gps' && <CheckCircleOutlined style={{ color: '#ff4081', fontSize: 13 }} />}
          </button>
          <Tooltip title="Tính năng đang được phát triển" placement="right">
            <button disabled className="settings-nav-item disabled">
              <span>Quy trình duyệt</span>
              <span className="settings-placeholder-tag">Sẽ bổ sung</span>
            </button>
          </Tooltip>
        </div>

        {/* Group 2: Cài đặt đối tượng */}
        <div className="settings-nav-group">
          <div className="settings-nav-group-title">
            <LockOutlined /> Cài đặt đối tượng
          </div>
          <Tooltip title="Tính năng đang được phát triển" placement="right">
            <button disabled className="settings-nav-item disabled">
              <span>Chấm công</span>
              <span className="settings-placeholder-tag">Sẽ bổ sung</span>
            </button>
          </Tooltip>
          <Tooltip title="Tính năng đang được phát triển" placement="right">
            <button disabled className="settings-nav-item disabled">
              <span>Nghỉ phép</span>
              <span className="settings-placeholder-tag">Sẽ bổ sung</span>
            </button>
          </Tooltip>
          <Tooltip title="Tính năng đang được phát triển" placement="right">
            <button disabled className="settings-nav-item disabled">
              <span>Nghỉ bù</span>
              <span className="settings-placeholder-tag">Sẽ bổ sung</span>
            </button>
          </Tooltip>
        </div>
      </aside>

      {/* ── 2. Right Content Section ── */}
      <section>
        <div className="settings-toolbar">
          <div className="settings-title-wrap">
            <h2>{tab === 'gps' ? 'Địa điểm chấm công GPS' : 'Ca làm việc'}</h2>
            <span className="settings-record-count">({filtered.length} bản ghi)</span>
          </div>

          <div className="settings-actions">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => edit(null)}
              className="btn-primary-pink"
            >
              Tạo mới
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={exportCsv}
              disabled={loading || !!failure || filtered.length === 0}
            >
              Export CSV
            </Button>
            <Tooltip title="Đang chờ file mẫu Excel">
              <Button icon={<ImportOutlined />} disabled>
                Import
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="settings-search-bar">
          <Input.Search
            placeholder="Tìm theo mã hoặc tên"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ maxWidth: 360 }}
            allowClear
          />
        </div>

        {failure && (
          <Alert
            type="error"
            message={failure}
            action={<Button size="small" onClick={load}>Thử lại</Button>}
            style={{ marginBottom: 12 }}
          />
        )}

        <Table<Row>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          columns={tab === 'gps' ? gpsColumns : shiftColumns}
          rowSelection={rowSelection}
          className="settings-table"
          scroll={{ x: tab === 'gps' ? 1350 : 1450 }}
          locale={{
            emptyText: (
              <Empty
                description={
                  tab === 'gps'
                    ? 'Chưa có địa điểm chấm công GPS nào'
                    : 'Chưa có ca làm việc nào được thiết lập'
                }
              />
            ),
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `Tổng số: ${total} bản ghi`,
          }}
        />
      </section>

      {/* ── 3. Modal Form (Shifts / GPS) ── */}
      <Modal
        title={
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
            {editing
              ? `Cập nhật ${tab === 'gps' ? 'địa điểm GPS' : 'ca làm việc'}: ${editing.name}`
              : `Tạo mới ${tab === 'gps' ? 'địa điểm chấm công GPS' : 'ca làm việc'}`}
          </span>
        }
        width={tab === 'gps' ? 820 : 880}
        open={open}
        destroyOnClose
        onCancel={() => !saving && setOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <Button onClick={() => setOpen(false)} disabled={saving} style={{ padding: '0 20px' }}>
              HỦY BỎ
            </Button>
            <Button
              type="primary"
              onClick={save}
              loading={saving}
              className="btn-primary-pink"
              style={{ padding: '0 24px' }}
            >
              CẬP NHẬT
            </Button>
          </div>
        }
        styles={{
          body: {
            maxHeight: 'calc(80vh - 120px)',
            overflowY: 'auto',
            padding: '16px 20px',
          },
        }}
      >
        <Form form={form} layout="vertical" requiredMark="optional">
          {tab === 'gps' ? (
            /* ── GPS Form ── */
            <>
              <Alert
                type="info"
                showIcon
                message="Quản lý địa điểm chấm công GPS"
                description="Cấu hình Wifi và phân quyền đối tượng nâng cao sẽ bổ sung sau khi xác minh nghiệp vụ."
                style={{ marginBottom: 18 }}
              />

              <div className="gps-form-grid">
                <Form.Item
                  name="code"
                  label={<span>Mã địa điểm <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập Mã địa điểm', max: 50 }]}
                >
                  <Input placeholder="VD: 38_NGUYEN_OANH" />
                </Form.Item>

                <Form.Item
                  name="name"
                  label={<span>Tên địa điểm <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập Tên địa điểm', max: 150 }]}
                >
                  <Input placeholder="VD: Văn phòng 38 Nguyễn Oanh" />
                </Form.Item>
              </div>

              <div className="gps-form-grid-3">
                <Form.Item
                  name="longitude"
                  label={<span>Kinh độ (Longitude) <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng nhập Kinh độ' }]}
                >
                  <InputNumber min={-180} max={180} step={0.0001} style={{ width: '100%' }} placeholder="VD: 106.6775" />
                </Form.Item>

                <Form.Item
                  name="latitude"
                  label={<span>Vĩ độ (Latitude) <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng nhập Vĩ độ' }]}
                >
                  <InputNumber min={-90} max={90} step={0.0001} style={{ width: '100%' }} placeholder="VD: 10.8288" />
                </Form.Item>

                <Form.Item
                  name="radius"
                  label={<span>Bán kính cho phép (m) <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng nhập Bán kính' }]}
                >
                  <InputNumber min={1} max={50000} precision={0} style={{ width: '100%' }} placeholder="VD: 100" />
                </Form.Item>
              </div>

              <div className="gps-form-grid">
                <Form.Item name="address" label="Địa chỉ chi tiết" rules={[{ max: 255 }]}>
                  <Input placeholder="Số nhà, tên đường, phường/xã, quận/huyện..." />
                </Form.Item>

                <Form.Item name="isActive" label="Trạng thái hoạt động" valuePropName="checked">
                  <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng hoạt động" />
                </Form.Item>
              </div>

              {watchedLat && watchedLng && (
                <div style={{ marginTop: 4, marginBottom: 16, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 13 }}>
                  <GlobalOutlined style={{ color: '#0284c7', marginRight: 6 }} />
                  <span>Xem trước vị trí: </span>
                  <a
                    href={`https://www.google.com/maps?q=${watchedLat},${watchedLng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontWeight: 600, color: '#0284c7' }}
                  >
                    Mở Google Maps ({watchedLat}, {watchedLng})
                  </a>
                </div>
              )}
            </>
          ) : (
            /* ── Shifts Form ── */
            <>
              {/* Group 1: Thông tin chung */}
              <div className="form-section-title">∨ Thông tin chung</div>
              <div className="shift-settings-grid-2">
                <Form.Item
                  name="code"
                  label={<span>Mã ca <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập Mã ca', max: 50 }]}
                >
                  <Input placeholder="VD: HC_01, CA_SANG" />
                </Form.Item>

                <Form.Item
                  name="name"
                  label={<span>Tên ca <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập Tên ca', max: 100 }]}
                >
                  <Input placeholder="VD: Ca hành chính, Ca sáng" />
                </Form.Item>
              </div>

              {/* Group 2: Ca chính */}
              <div className="form-section-title">∨ Ca chính</div>
              <div className="shift-settings-grid">
                <Form.Item
                  name="startTime"
                  label={<span>Giờ vào <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng chọn Giờ vào' }]}
                >
                  <Input type="time" />
                </Form.Item>

                <Form.Item
                  name="endTime"
                  label={<span>Giờ ra <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng chọn Giờ ra' }]}
                >
                  <Input type="time" />
                </Form.Item>

                <Form.Item
                  name="overnight"
                  label={<span>Qua ngày <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: 'same', label: 'Cùng ngày' },
                      { value: 'next', label: 'Ngày hôm sau' },
                    ]}
                  />
                </Form.Item>
              </div>

              <div className="shift-settings-grid">
                <Form.Item name="breakStart" label="Bắt đầu nghỉ giữa ca">
                  <Input type="time" />
                </Form.Item>

                <Form.Item name="breakEnd" label="Kết thúc nghỉ giữa ca">
                  <Input type="time" />
                </Form.Item>

                <Form.Item
                  name="coefficient"
                  label={<span>Tổng công quy đổi <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng nhập Hệ số công' }]}
                >
                  <InputNumber min={0.01} max={10} step={0.25} style={{ width: '100%' }} placeholder="1.0" />
                </Form.Item>
              </div>

              <div className="shift-settings-grid-2">
                <Form.Item name="checkInBefore" label="Khoảng thời gian cho phép Check in trước">
                  <Input placeholder="VD: 01:00:00 (1 giờ)" />
                </Form.Item>

                <Form.Item name="checkOutAfter" label="Khoảng thời gian cho phép Check out sau">
                  <Input placeholder="VD: 01:00:00 (1 giờ)" />
                </Form.Item>
              </div>

              {/* Group 3: Cài đặt giữa ca */}
              <div className="form-section-title">∨ Cài đặt giữa ca</div>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: -4, marginBottom: 12 }}>
                Tổng giờ làm việc thực tế được tính tự động: thời lượng ca trừ đi khoảng thời gian nghỉ giữa ca.
              </p>

              {/* Group 4: Chấm công qua ứng dụng */}
              <div className="form-section-title">∨ Chấm công qua ứng dụng</div>
              <Form.Item
                name="gpsLocationIds"
                label="Chấm công qua GPS (Chọn các địa điểm áp dụng)"
                tooltip="Nhân viên được phân ca này sẽ được phép dập thẻ GPS tại các địa điểm đã chọn"
              >
                <Select
                  mode="multiple"
                  placeholder="Chọn địa điểm GPS áp dụng cho ca này"
                  options={gpsRows.map((loc) => ({
                    value: loc.id,
                    label: `${loc.code} - ${loc.name} ${loc.address ? `(${loc.address})` : ''}`,
                  }))}
                  allowClear
                />
              </Form.Item>

              {/* Group 5: Ghi chú */}
              <Form.Item name="description" label="Ghi chú / Mô tả ca" rules={[{ max: 255 }]}>
                <Input.TextArea rows={2} placeholder="Nhập mô tả quy định ca làm việc..." />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
