'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Tabs, message, Dropdown, Modal, Select, Input } from 'antd';

import { PortalIcon } from '@/components/portal-icon';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/components/auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';
import type { ColumnsType } from 'antd/es/table/interface';
import './applications.css';

interface ApplicationRow {
  id: string;
  type: string;
  status: 'WAITING' | 'APPROVING' | 'APPROVED' | 'NO_APPROVED' | 'CANCELED';
  reason: string;
  description: string;
  payload: any;
  currentStep: number;
  createdAt: string;
  employee: {
    id: string;
    code: string;
    name: string;
    department: { name: string } | null;
    position: { name: string } | null;
  };
  approvals: any[];
}

const statusMap: Record<string, string> = {
  WAITING: 'Chờ duyệt',
  APPROVING: 'Đang duyệt',
  APPROVED: 'Đã duyệt',
  NO_APPROVED: 'Từ chối',
  CANCELED: 'Đã hủy',
};

const getAvatarColor = (name: string) => {
  const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#6366f1'];
  return colors[name.length % colors.length];
};

export function ApplicationsScreen() {
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);
  const employeeId = user?.employeeId;

  const [activeTab, setActiveTab] = useState('ALL');
  const [data, setData] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabCounts, setTabCounts] = useState({ ALL: 0, WAITING: 0, APPROVED: 0, NO_APPROVED: 0 });

  const fetchStats = useCallback(async () => {
    try {
      if (!isAdmin && !employeeId) {
        setTabCounts({ ALL: 0, WAITING: 0, APPROVED: 0, NO_APPROVED: 0 });
        return;
      }
      const query = !isAdmin && employeeId ? `?employeeId=${employeeId}` : '';
      const res = await apiClient.get('/applications/stats' + query);
      if (res.data) {
        setTabCounts({
          ALL: res.data.total || 0,
          WAITING: res.data.pending || 0,
          APPROVED: res.data.approved || 0,
          NO_APPROVED: res.data.rejected || 0,
        });
      }
    } catch (_) {}
  }, [isAdmin, employeeId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (!isAdmin && !employeeId) {
        setData([]);
        return;
      }
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.append('status', activeTab);
      if (!isAdmin && employeeId) params.append('employeeId', employeeId);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await apiClient.get('/applications' + queryString);
      setData(res.data.data || []);
    } catch (err: any) {
      void message.error(err.message || 'Lỗi khi tải dữ liệu đơn từ.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAdmin, employeeId]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const columns: ColumnsType<ApplicationRow> = [
    {
      key: 'stt', title: 'STT', width: 60, align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      key: 'creator', title: 'Người tạo', width: 90,
      render: (_, row) => (
        <div className="app-creator">
          <div className="app-avatar" style={{ backgroundColor: getAvatarColor(row.employee.name) }}>
            {row.employee.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )
    },
    { key: 'code', title: 'Mã nhân viên', dataIndex: ['employee', 'code'], width: 120 },
    { key: 'name', title: 'Họ và tên', dataIndex: ['employee', 'name'], width: 200 },
    {
      key: 'status', title: 'Trạng thái', width: 120,
      render: (_, row) => (
        <span className={'app-badge app-badge-' + row.status.toLowerCase()}>
          {statusMap[row.status] || row.status}
        </span>
      )
    },
    {
      key: 'step', title: 'Bước duyệt', width: 170,
      render: (_, row) => {
        let stepText = 'Quản lý duyệt';
        let color = '#d97706';
        let bg = '#fffbe6';

        if (row.status === 'APPROVED') {
          stepText = 'Hoàn tất';
          color = '#059669';
          bg = '#ecfdf5';
        } else if (row.status === 'NO_APPROVED' || row.status === 'CANCELED') {
          stepText = 'Không duyệt';
          color = '#dc2626';
          bg = '#fef2f2';
        } else {
          const dept = row.employee?.department?.name || '';
          if (row.currentStep >= 2 || dept.includes('BAN GIÁM ĐỐC')) stepText = 'Admin duyệt';
          else if (dept.includes('CỬA HÀNG')) stepText = 'QLCH Duyệt';
          else if (dept.includes('KHO')) stepText = 'Giám sát Kho duyệt';
        }

        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 500,
              background: bg,
              color: color,
              border: `1px solid ${color}30`,
              whiteSpace: 'nowrap',
            }}
          >
            {stepText} <span style={{ fontSize: 10, opacity: 0.8 }}>▷</span>
          </span>
        );
      }
    },
    { key: 'type', title: 'Loại đơn', dataIndex: 'type', width: 180 },
    { key: 'department', title: 'Phòng ban', width: 180, render: (_, row) => row.employee.department?.name || '—' },
    { key: 'position', title: 'Vị trí công việc', width: 220, render: (_, row) => row.employee.position?.name || '—' },
    { key: 'reason', title: 'Lý do', dataIndex: 'reason', width: 200, render: val => val || '—' },
    { key: 'createdAt', title: 'Ngày tạo', width: 120, render: (_, row) => new Date(row.createdAt).toLocaleDateString('vi-VN') },
  ];

  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formValues, setFormValues] = useState({
    employeeId: '',
    type: 'Đơn xin nghỉ phép',
    reason: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiClient.get('/employees?pageSize=100');
      if (res.data?.items) setEmployees(res.data.items);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreateApp = async () => {
    const targetEmployeeId = (!isAdmin && employeeId) ? employeeId : formValues.employeeId;
    if (!targetEmployeeId) {
      message.warning('Vui lòng chọn nhân sự nộp đơn.');
      return;
    }
    try {
      await apiClient.post('/applications', {
        employeeId: targetEmployeeId,
        type: formValues.type,
        reason: formValues.reason || 'Giải quyết công việc cá nhân',
        description: formValues.description,
        payload: {
          startDate: formValues.startDate,
          endDate: formValues.startDate,
          amount: 1.0,
        },
      });
      message.success('Khởi tạo Đơn từ mới thành công!');
      setModalOpen(false);
      fetchStats();
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi tạo đơn từ.');
    }
  };

  return (
    <section className="applications-page">
      {/* 1Office Title Bar with Left [+] Dropdown */}
      <div className="applications-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'leave',
                  label: 'Đơn xin nghỉ',
                  onClick: () => router.push('/hrm/applications/create?type=leave'),
                },
                {
                  key: 'overtime',
                  label: 'Đơn làm thêm',
                  onClick: () => router.push('/hrm/applications/create?type=overtime'),
                },
                {
                  key: 'inout',
                  label: 'Đơn checkin/out',
                  onClick: () => router.push('/hrm/applications/create?type=inout'),
                },
                {
                  key: 'shift_change',
                  label: 'Đơn đổi ca',
                  onClick: () => router.push('/hrm/applications/create?type=shift_change'),
                },
                {
                  key: 'overtime_plus',
                  label: 'Đơn tăng ca',
                  onClick: () => router.push('/hrm/applications/create?type=overtime_plus'),
                },
                {
                  key: 'shift_register',
                  label: 'Đơn đăng ký ca',
                  onClick: () => router.push('/hrm/applications/create?type=shift_register'),
                },
                {
                  key: 'resignation',
                  label: 'Đơn thôi việc',
                  onClick: () => router.push('/hrm/applications/create?type=resignation'),
                },
              ],
            }}
            placement="bottomLeft"
            trigger={['click', 'hover']}
          >
            <div className="app-create-btn" title="Tạo mới đơn từ">
              +
            </div>
          </Dropdown>

          <h1 className="applications-title">
            Danh sách đơn từ năm 2026
          </h1>
        </div>
      </div>

      <div className="applications-heading">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'ALL', label: <span>Tất cả <span className="app-tab-count">({tabCounts.ALL})</span></span> },
            { key: 'WAITING', label: <span>Chờ duyệt <span className="app-tab-count">({tabCounts.WAITING})</span></span> },
            { key: 'APPROVED', label: <span>Đã duyệt <span className="app-tab-count">({tabCounts.APPROVED})</span></span> },
            { key: 'NO_APPROVED', label: <span>Không có người duyệt / Hủy <span className="app-tab-count">({tabCounts.NO_APPROVED})</span></span> },
          ]}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="applications-view-label">
            <PortalIcon name="file" size={17} /> Danh sách đơn từ
          </span>
        </div>
      </div>

      <div className="applications-toolbar">
        <div className="applications-toolbar-left">
          <Button type="text" className="app-toolbar-btn">
            Hiển thị 1 - {data.length} của {data.length} bản ghi
          </Button>
        </div>
        <div className="applications-toolbar-right">
          <Button type="text" className="app-toolbar-btn">2026 <PortalIcon name="arrow" size={14} /></Button>
          <Button type="text" className="app-toolbar-btn"><PortalIcon name="settings" size={15}/> Lọc danh sách</Button>
          <Button type="text" className="app-toolbar-btn">Tags</Button>
          <Button type="text" className="app-toolbar-btn">Nhập</Button>
          <Button type="text" className="app-toolbar-btn">Xuất</Button>
          <Button type="text" className="app-toolbar-btn"><PortalIcon name="settings" size={15}/> Cài đặt</Button>
        </div>
      </div>

      <div className="applications-table">
        <Table<ApplicationRow>
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={false}
          rowSelection={{ type: 'checkbox' }}
          onRow={(record) => ({
            onClick: () => router.push(`/hrm/applications/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: 'Không tìm thấy kết quả nào' }}
        />
      </div>

      {/* Modal Form Tạo Đơn Từ Mới */}
      <Modal
        title="Khởi tạo Đơn từ mới (Chuẩn 1Office)"
        open={modalOpen}
        onOk={handleCreateApp}
        onCancel={() => setModalOpen(false)}
        okText="Gửi đơn phê duyệt"
        cancelText="Hủy"
        okButtonProps={{ style: { background: '#ef4444', borderColor: '#ef4444' } }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 10 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nhân sự nộp đơn (*)</label>
            {!isAdmin ? (
              <Input
                value={`${user?.displayName || user?.username || 'Nhân sự'} (Tôi)`}
                disabled
                style={{ color: '#0f172a', fontWeight: 600, background: '#f8fafc' }}
              />
            ) : (
              <Select
                style={{ width: '100%' }}
                placeholder="Chọn nhân sự..."
                value={formValues.employeeId || undefined}
                onChange={(val) => setFormValues({ ...formValues, employeeId: val })}
                options={employees.map((e) => ({
                  value: e.id,
                  label: `${e.name} (${e.code}) - ${e.department?.name || 'Phòng ban'}`,
                }))}
              />
            )}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Loại đơn từ (*)</label>
            <Select
              style={{ width: '100%' }}
              value={formValues.type}
              onChange={(val) => setFormValues({ ...formValues, type: val })}
              options={[
                { value: 'Đơn xin nghỉ phép', label: '🏖️ Đơn xin nghỉ phép (P)' },
                { value: 'Đơn làm thêm giờ OT', label: '⏰ Đơn làm thêm giờ (OT)' },
                { value: 'Đơn đi muộn / về sớm', label: '🚗 Đơn đi muộn / về sớm' },
                { value: 'Đơn checkin/out', label: '📠 Đơn bổ sung quẹt thẻ Checkin/out' },
                { value: 'Đơn công tác', label: '✈️ Đơn công tác (CT)' },
              ]}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Ngày áp dụng</label>
            <Input
              type="date"
              value={formValues.startDate}
              onChange={(e) => setFormValues({ ...formValues, startDate: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Lý do nộp đơn</label>
            <Input
              placeholder="Nhập lý do..."
              value={formValues.reason}
              onChange={(e) => setFormValues({ ...formValues, reason: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mô tả chi tiết</label>
            <Input.TextArea
              rows={2}
              placeholder="Nhập ghi chú hoặc mô tả chi tiết..."
              value={formValues.description}
              onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </section>
  );
}
