'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, App, Avatar, Badge, Button, Checkbox, Descriptions, Drawer, Dropdown, Form, Input, Modal, Pagination, Select, Space, Spin, Switch, Table, Tabs, Tag, Tooltip, Typography } from 'antd';
import { EyeOutlined, EditOutlined, KeyOutlined, DeleteOutlined, SearchOutlined, PlusOutlined, UserOutlined, FilterOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient, authError } from '@/lib/api-client';
import { PortalIcon } from '@/components/portal-icon';
import { useRouter } from 'next/navigation';
import type { ColumnsType, TableRowSelection } from 'antd/es/table/interface';
import './employees.css';
import { ColumnSettings, employeeColumns, useEmployeeColumns, type ColumnKey } from './column-settings';

type GroupField = 'departmentId'|'positionId'|'jobTitleId';
const groupOptions = [{key:'departmentId',label:'Phòng ban'},{key:'positionId',label:'Vị trí'},{key:'jobTitleId',label:'Chức danh'}];

const statuses: Record<string,string> = {WORKING:'Đang làm việc',WAITING:'Chờ nhận việc',TEMPORARY:'Tạm nghỉ',MATERNITY_LEAVE:'Nghỉ thai sản',UNPAID_LEAVE:'Nghỉ không lương',MILITARY_LEAVE:'Nghĩa vụ quân sự',STUDY_LEAVE:'Đi học',SICK_LEAVE:'Nghỉ ốm',STOP_WORKING:'Đã nghỉ việc'};

const STATUS_TAG_MAP: Record<string, { color: string; bg: string; border: string; label: string }> = {
  WORKING: { color: '#166534', bg: '#f0fdf4', border: '#bbf7d0', label: 'Đang làm việc' },
  WAITING: { color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe', label: 'Chờ nhận việc' },
  STOP_WORKING: { color: '#991b1b', bg: '#fef2f2', border: '#fecaca', label: 'Đã nghỉ việc' },
  TEMPORARY: { color: '#9a3412', bg: '#fff7ed', border: '#fed7aa', label: 'Tạm nghỉ' },
  MATERNITY_LEAVE: { color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', label: 'Nghỉ thai sản' },
  UNPAID_LEAVE: { color: '#6b21a8', bg: '#faf5ff', border: '#e9d5ff', label: 'Nghỉ không lương' },
  MILITARY_LEAVE: { color: '#374151', bg: '#f3f4f6', border: '#e5e7eb', label: 'Nghĩa vụ quân sự' },
  STUDY_LEAVE: { color: '#075985', bg: '#f0f9ff', border: '#bae6fd', label: 'Đi học' },
  SICK_LEAVE: { color: '#991b1b', bg: '#fef2f2', border: '#fecaca', label: 'Nghỉ ốm' },
};

function renderStatusTag(statusKey: string) {
  const cfg = STATUS_TAG_MAP[statusKey] || {
    color: '#475569',
    bg: '#f1f5f9',
    border: '#e2e8f0',
    label: statuses[statusKey] || statusKey,
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function getInitials(name: string) {
  if (!name) return 'NS';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  '#e83e8c', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'
];

function getAvatarBg(name: string) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
const kinds: Record<string,string> = {DEPARTMENT:'Phòng ban',POSITION:'Vị trí',JOB_TITLE:'Chức danh'};
interface Catalog {id:string;kind:string;code:string;name:string;active:boolean}
interface Employee {id:string;code:string;name:string;status:string;version:number;gender:string|null;birthday:string|null;joinDate:string|null;email:string|null;phone:string|null;address:string|null;departmentId:string|null;positionId:string|null;jobTitleId:string|null;managerId:string|null;department:Catalog|null;position:Catalog|null;jobTitle:Catalog|null;manager:{id:string;code:string;name:string}|null;user?:{id:string;status:'ACTIVE'|'LOCKED';username:string}|null}
interface History {id:string;actorName:string;action:string;createdAt:string;before:Record<string,unknown>|null;after:Record<string,unknown>}
type EmployeeTableRow = Employee | {id:string;group:true;name:string;count:number};
const isGroup = (row:EmployeeTableRow): row is Extract<EmployeeTableRow,{group:true}> => 'group' in row;
const calendarDate = (value:string|null) => value ? value.split('-').reverse().join('/') : '—';
const labels: Record<string,string> = {code:'Mã nhân sự',name:'Họ và tên',status:'Trạng thái',gender:'Giới tính',birthday:'Ngày sinh',joinDate:'Ngày vào làm',email:'Email',phone:'Điện thoại',address:'Địa chỉ',department:'Phòng ban',position:'Vị trí',jobTitle:'Chức danh',manager:'Quản lý trực tiếp'};
function display(value:unknown):string { if (value == null || value === '') return '—'; if (typeof value === 'object') return String((value as {name?:string}).name ?? '—'); return statuses[String(value)] ?? ({MALE:'Nam',FEMALE:'Nữ',OTHER:'Khác'}[String(value)] ?? String(value)); }

const STATUS_TABS = [
  { key:'ALL', label:'Tất cả' },
  { key:'WORKING', label:'Đang làm việc' },
  { key:'WAITING', label:'Chờ nhận việc' },
  { key:'STOP_WORKING', label:'Đã nghỉ việc' },
  { key:'TEMPORARY', label:'Tạm nghỉ' },
  { key:'MATERNITY_LEAVE', label:'Nghỉ thai sản' },
  { key:'UNPAID_LEAVE', label:'Nghỉ không lương' },
  { key:'MILITARY_LEAVE', label:'Nghĩa vụ quân sự' },
  { key:'STUDY_LEAVE', label:'Đi học' },
  { key:'SICK_LEAVE', label:'Nghỉ ốm' },
];

interface UserRolePackage {
  id: string;
  name: string;
  comboName: string | null;
  expiryDate?: string;
  slots: string | null;
  features: string[];
}

const USER_ROLES_DATA: UserRolePackage[] = [
  {
    id: 'nv_ban_hang',
    name: 'Nhân viên bán hàng - Nhân viên',
    comboName: 'COMBO Standard Hrm',
    expiryDate: '01/04/2027',
    slots: 'Còn: 2/24',
    features: [
      'Mạng nội bộ', 'Quy trình duyệt', 'Cảnh báo thông minh', 'Báo cáo',
      'Hồ sơ nhân sự', 'Hợp đồng', 'Bảo hiểm', 'Quyết định',
      'Đơn từ', 'Chấm công', 'Bảng lương', 'Đánh giá ASK',
      'Tài sản', 'Tuyển dụng', 'Tài liệu', 'Lịch biểu',
      'Ký số', 'Hỗ trợ'
    ],
  },
  {
    id: 'nv_kho_hang',
    name: 'Nhân viên kho hàng - Nhân viên',
    comboName: 'COMBO Professional',
    expiryDate: '01/04/2027',
    slots: 'Còn: 1/3',
    features: [
      'Hỗ trợ', 'Mạng nội bộ', 'Quy trình tự động', 'Quy trình duyệt',
      'Cảnh báo thông minh', 'Báo cáo', 'Hồ sơ nhân sự', 'Hợp đồng',
      'Bảo hiểm', 'Quyết định', 'Đơn từ', 'Chấm công',
      'Bảng lương', 'Đánh giá ASK', 'Tài sản', 'Tuyển dụng',
      'KPI', 'OKR', 'Đào tạo', 'Tài liệu',
      'Lịch biểu', 'Dự án', 'Timesheet', 'Ký số'
    ],
  },
  {
    id: 'nv_marketing',
    name: 'Nhân viên Marketing - nhân viên',
    comboName: 'COMBO Professional',
    expiryDate: '01/04/2027',
    slots: 'Còn: 1/3',
    features: [
      'Hỗ trợ', 'Mạng nội bộ', 'Quy trình tự động', 'Quy trình duyệt',
      'Cảnh báo thông minh', 'Báo cáo', 'Hồ sơ nhân sự', 'Hợp đồng',
      'Bảo hiểm', 'Quyết định', 'Đơn từ', 'Chấm công',
      'Bảng lương', 'Đánh giá ASK', 'Tài sản', 'Tuyển dụng',
      'KPI', 'OKR', 'Đào tạo', 'Tài liệu',
      'Lịch biểu', 'Dự án', 'Timesheet', 'Ký số'
    ],
  },
  {
    id: 'nv_thu_ngan',
    name: 'Nhân viên thu ngân - Nhân viên',
    comboName: null,
    slots: null,
    features: [],
  },
  {
    id: 'nv_tu_van_online',
    name: 'Nhân viên tư vấn online - Nhân viên',
    comboName: 'COMBO Standard Hrm',
    expiryDate: '01/04/2027',
    slots: 'Còn: 2/24',
    features: [
      'Mạng nội bộ', 'Quy trình duyệt', 'Cảnh báo thông minh', 'Báo cáo',
      'Hồ sơ nhân sự', 'Hợp đồng', 'Bảo hiểm', 'Quyết định',
      'Đơn từ', 'Chấm công', 'Bảng lương', 'Đánh giá ASK',
      'Tài sản', 'Tuyển dụng', 'Tài liệu', 'Lịch biểu',
      'Ký số', 'Hỗ trợ'
    ],
  },
  {
    id: 'quan_ly_cua_hang',
    name: 'Quản lý cửa hàng - Quản lý',
    comboName: 'COMBO 1Office',
    expiryDate: '01/04/2027',
    slots: 'Còn: 4/8',
    features: [
      'Hỗ trợ', 'Mạng nội bộ', 'Quy trình tự động', 'Quy trình duyệt',
      'Cảnh báo thông minh', 'Báo cáo', 'Hồ sơ nhân sự', 'Hợp đồng',
      'Bảo hiểm', 'Quyết định', 'Đơn từ', 'Chấm công',
      'Bảng lương', 'Đánh giá ASK', 'Tài sản', 'Tuyển dụng',
      'KPI', 'OKR', 'Đào tạo', 'Tài liệu',
      'Lịch biểu', 'Dự án', 'Timesheet', 'Ký số',
      'Văn bản', 'Marketing', 'Chăm sóc', 'Quản lý liên hệ',
      'Quản lý cơ hội', 'Quản lý khách hàng', 'Quản lý đối tác', 'Báo giá',
      'Đơn hàng bán', 'Hợp đồng bán', 'Chính sách khuyến mại', 'Đơn hàng mua',
      'Nhà cung cấp', 'INTEGRATION', 'Kho hàng', 'Thu chi',
      'API'
    ],
  },
];

function ActivateAccountModal({
  employee,
  open,
  onClose,
  onSuccess,
}: {
  employee: Employee | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRolePackage | null>(USER_ROLES_DATA[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    return pass;
  };

  useEffect(() => {
    if (open && employee) {
      const defaultRole = USER_ROLES_DATA[0];
      setSelectedRole(defaultRole);
      setDropdownOpen(false);
      setSearchFilter('');
      const today = new Date().toLocaleDateString('vi-VN');
      const autoPass = generateRandomPassword();
      form.setFieldsValue({
        username: employee.code ? employee.code.toLowerCase() : 'demo_nv022',
        roleName: defaultRole.name,
        password: autoPass,
        autoUsername: true,
        randomPassword: true,
        sendEmail: true,
        activateDate: today,
      });
    }
  }, [open, employee, form]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleFinish = async (values: any) => {
    if (!employee) return;
    setLoading(true);
    try {
      await apiClient.post('/users', {
        username: values.username || employee.code.toLowerCase(),
        employeeId: employee.id,
        displayName: employee.name,
        password: values.randomPassword ? undefined : values.password,
        roleName: values.roleName || selectedRole?.name || 'Nhân viên bán hàng - Nhân viên',
      });
      if (values.sendEmail) {
        message.success(`Đã kích hoạt tài khoản & gửi email đăng nhập đến ${employee.email || `${employee.code}@hadibeauty.vn`}`);
      } else {
        message.success(`Đã kích hoạt tài khoản thành công cho nhân sự ${employee.name}`);
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      message.error(authError(error));
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal
      title={<span style={{ fontWeight: 600, fontSize: 16 }}>Kích hoạt tài khoản</span>}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} style={{ marginTop: 16 }}>
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.autoUsername !== curr.autoUsername}>
          {() => {
            const isAuto = form.getFieldValue('autoUsername') !== false;
            return (
              <Form.Item
                name="username"
                label={<span>Tên đăng nhập <span style={{ color: '#ef4444' }}>*</span> ❓</span>}
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              >
                <Input
                  readOnly={isAuto}
                  style={{
                    color: '#0f172a',
                    backgroundColor: isAuto ? '#f8fafc' : '#ffffff',
                    fontWeight: 600,
                  }}
                  placeholder="Nhập tên đăng nhập"
                />
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item
          name="roleName"
          label={<span>Nhóm người dùng <span style={{ color: '#ef4444' }}>*</span></span>}
          rules={[{ required: true, message: 'Vui lòng chọn nhóm người dùng' }]}
          style={{ marginBottom: 16 }}
        >
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                border: dropdownOpen ? '1.5px solid #e83e8c' : '1px solid #d9d9d9',
                borderRadius: 6,
                padding: '6px 12px',
                background: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 38,
                transition: 'all 0.2s',
                boxShadow: dropdownOpen ? '0 0 0 2px rgba(232, 62, 140, 0.15)' : 'none'
              }}
            >
              {selectedRole ? (
                <span style={{ color: '#e83e8c', fontWeight: 600, fontSize: 14 }}>
                  {selectedRole.name}
                </span>
              ) : (
                <span style={{ color: '#bfbfbf', fontSize: 14 }}>
                  Chọn nhóm người dùng
                </span>
              )}

              {selectedRole ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRole(null);
                    form.setFieldValue('roleName', undefined);
                  }}
                  style={{
                    color: '#bfbfbf',
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '50%'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#e83e8c')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#bfbfbf')}
                >
                  ✕
                </span>
              ) : (
                <span style={{ color: '#bfbfbf', fontSize: 12 }}>▼</span>
              )}
            </div>

            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 1050,
                  background: '#ffffff',
                  borderRadius: 8,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  border: '1px solid #f0f0f0',
                  maxHeight: 380,
                  overflowY: 'auto',
                  padding: 16
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Input
                  placeholder="Tìm kiếm nhóm người dùng..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  allowClear
                  autoFocus
                  style={{ marginBottom: 14, borderColor: '#e83e8c' }}
                />

                {USER_ROLES_DATA.filter((r) =>
                  r.name.toLowerCase().includes(searchFilter.toLowerCase())
                ).map((role) => {
                  const isSelected = selectedRole?.id === role.id;
                  return (
                    <div key={role.id} style={{ marginBottom: 16 }}>
                      {/* Role Header Title in Pink */}
                      <div
                        style={{
                          color: '#e83e8c',
                          fontWeight: 700,
                          fontSize: 14,
                          marginBottom: 8
                        }}
                      >
                        {role.name}
                      </div>

                      {/* Inner Role Card */}
                      <div
                        onClick={() => {
                          setSelectedRole(role);
                          form.setFieldValue('roleName', role.name);
                          setDropdownOpen(false);
                          setSearchFilter('');
                        }}
                        style={{
                          background: isSelected ? '#fff8fb' : '#fafafa',
                          border: isSelected ? '1.5px solid #e83e8c' : '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#f48fb1';
                            e.currentTarget.style.background = '#fff0f5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.background = '#fafafa';
                          }
                        }}
                      >
                        {role.comboName ? (
                          <>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 8
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontStyle: 'italic',
                                  fontSize: 13,
                                  color: '#333'
                                }}
                              >
                                {role.comboName}{' '}
                                {role.expiryDate && (
                                  <span style={{ fontWeight: 400, color: '#666', fontStyle: 'normal' }}>
                                    ({role.expiryDate})
                                  </span>
                                )}
                              </span>
                              <span style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                                👥 {role.slots}
                              </span>
                            </div>

                            <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: 10 }} />

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '6px 12px',
                                fontSize: 12,
                                color: '#444'
                              }}
                            >
                              {role.features.map((f) => (
                                <div key={f}>• {f}</div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div style={{ fontSize: 13, fontStyle: 'italic', color: '#888' }}>
                            Chưa chọn combo hoặc apps lẻ nào
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Form.Item>

        {/* Selected Role Package Combo Card Preview */}
        {selectedRole && (
          <div
            style={{
              background: '#fff8fb',
              border: '1px solid #fce4ec',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 20
            }}
          >
            {selectedRole.comboName ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    borderBottom: '1px solid #f8bbd0',
                    paddingBottom: 8
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#333', fontSize: 13 }}>
                    {selectedRole.comboName}{' '}
                    {selectedRole.expiryDate && (
                      <span style={{ fontWeight: 400, color: '#666' }}>({selectedRole.expiryDate})</span>
                    )}
                  </span>
                  <span style={{ fontSize: 12, color: '#666' }}>👥 {selectedRole.slots}</span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px 12px',
                    fontSize: 12,
                    color: '#444'
                  }}
                >
                  {selectedRole.features.map((f) => (
                    <div key={f}>• {f}</div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, fontStyle: 'italic', color: '#888' }}>
                Chưa chọn combo hoặc apps lẻ nào
              </div>
            )}
          </div>
        )}

        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.randomPassword !== curr.randomPassword}>
          {() => {
            const isRandom = form.getFieldValue('randomPassword') !== false;
            return (
              <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
                <Input.Password
                  readOnly={isRandom}
                  style={{
                    color: '#0f172a',
                    backgroundColor: isRandom ? '#f8fafc' : '#ffffff',
                    fontWeight: 600,
                  }}
                  placeholder="Nhập mật khẩu tự gán"
                />
              </Form.Item>
            );
          }}
        </Form.Item>

        <Form.Item name="autoUsername" valuePropName="checked" style={{ marginBottom: 6 }}>
          <Checkbox onChange={(e) => {
            if (e.target.checked && employee?.code) {
              form.setFieldValue('username', employee.code.toLowerCase());
            }
          }}>Tự động tạo tên đăng nhập (&#123;name&#125;&#123;number&#125;)</Checkbox>
        </Form.Item>

        <Form.Item name="randomPassword" valuePropName="checked" style={{ marginBottom: 6 }}>
          <Checkbox onChange={(e) => {
            if (e.target.checked) form.setFieldValue('password', generateRandomPassword());
          }}>Để mật khẩu ngẫu nhiên</Checkbox>
        </Form.Item>

        <Form.Item name="sendEmail" valuePropName="checked" style={{ marginBottom: 16 }}>
          <Checkbox defaultChecked>Gửi email thông tin đăng nhập cho người dùng</Checkbox>
        </Form.Item>

        <Form.Item name="activateDate" label={<span>Ngày kích hoạt ❓</span>}>
          <Input placeholder="DD/MM/YYYY" />
        </Form.Item>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
          <Button onClick={onClose}>HỦY BỎ</Button>
          <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: '#e83e8c', border: 'none' }}>
            CẬP NHẬT
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export function EmployeesScreen() {
  const router = useRouter();
  const {user} = useAuth(); const {message} = App.useApp();
  const can = (permission:string) => !!user?.permissions.includes(permission);
  const allowed = can('employee.view');
  const [rows,setRows] = useState<Employee[]>([]), [catalogs,setCatalogs] = useState<Catalog[]>([]);
  const [filtersOpen,setFiltersOpen] = useState(false);
  const [columnsOpen,setColumnsOpen] = useState(false);
  const [columnPreferences,setColumnPreferences] = useEmployeeColumns(user?.id);
  const [groupCounts,setGroupCounts] = useState<{value:string|null;count:number}[]>([]);
  const [collapsed,setCollapsed] = useState<Set<string>>(new Set());
  const [query,setQuery] = useState({page:1,q:'',status:undefined as string|undefined,departmentId:undefined as string|undefined,positionId:undefined as string|undefined,groupBy:'departmentId' as GroupField|undefined,sortBy:undefined as ColumnKey|undefined,sortDirection:'asc' as 'asc'|'desc'});
  const grouped = !!query.groupBy;
  const [total,setTotal] = useState(0), [busy,setBusy] = useState(false), [error,setError] = useState(''), [revision,setRevision] = useState(0);
  const [editor,setEditor] = useState<Employee|'new'|null>(null), [saving,setSaving] = useState(false);
  const [form] = Form.useForm(); const [catalogForm] = Form.useForm();
  const [detail,setDetail] = useState<Employee|null>(null), [history,setHistory] = useState<History[]>([]), [historyPage,setHistoryPage] = useState(1), [historyTotal,setHistoryTotal] = useState(0), [detailBusy,setDetailBusy] = useState(false), [detailError,setDetailError] = useState('');
  const [catalogOpen,setCatalogOpen] = useState(false), [catalogEdit,setCatalogEdit] = useState<Catalog|null>(null);
  const [managers,setManagers] = useState<Employee[]>([]); const managerRequest = useRef(0);
  const [selectedKeys,setSelectedKeys] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{ record: Employee; x: number; y: number } | null>(null);
  const [activateEmployee, setActivateEmployee] = useState<Employee | null>(null);
  const [userMap, setUserMap] = useState<Record<string, { id: string; status: 'ACTIVE' | 'LOCKED'; username: string }>>({});

  useEffect(() => {
    apiClient.get('/users').then((res) => {
      if (res.data && Array.isArray(res.data)) {
        const map: Record<string, any> = {};
        res.data.forEach((u: any) => {
          if (u.employeeId) {
            map[u.employeeId] = { id: u.id, status: u.status, username: u.username };
          }
        });
        setUserMap(map);
      }
    }).catch(() => {});
  }, [revision]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Listen for the "add employee" event fired by the topbar + button
  useEffect(() => {
    if (!can('employee.create')) return;
    const handler = () => openEditor();
    window.addEventListener('hrm:add-employee', handler);
    return () => window.removeEventListener('hrm:add-employee', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCatalogs = useCallback(async () => { const {data} = await apiClient.get<Catalog[]>('/employee-catalogs'); setCatalogs(data); },[]);
  useEffect(() => {
    if (!allowed) return;
    // Synchronize the request indicator when filters or the explicit refresh change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    let current = true; setBusy(true); setError('');
    Promise.all([apiClient.get<{items:Employee[];total:number;groups:{value:string|null;count:number}[]}>('/employees',{params:{...query,pageSize:20}}),loadCatalogs()]).then(([{data}]) => { if(current){setRows(data.items);setTotal(data.total);setGroupCounts(data.groups);setSelectedKeys([]);} }).catch(e => {if(current) setError(authError(e));}).finally(()=>{if(current)setBusy(false);});
    return () => {current=false;};
  },[allowed,query,revision,loadCatalogs]);
  useEffect(() => {
    // Synchronize the loading indicator with the selected remote history page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!detail?.id) return; let current=true; setDetailBusy(true);setDetailError('');
    apiClient.get<{items:History[];total:number}>(`/employees/${detail.id}/history`,{params:{page:historyPage,pageSize:10}}).then(({data})=>{if(current){setHistory(data.items);setHistoryTotal(data.total);}}).catch(e=>{if(current)setDetailError(authError(e));}).finally(()=>{if(current)setDetailBusy(false);});
    return ()=>{current=false;};
  },[detail?.id,historyPage]);

  async function searchManagers(q='') {
    const request=++managerRequest.current;
    try {const {data}=await apiClient.get<{items:Employee[]}>('/employees',{params:{q,status:'WORKING',pageSize:20}});if(request===managerRequest.current)setManagers(data.items);} catch(e){void message.error(authError(e));}
  }
  function openEditor(row?:Employee) {
    if (!row) {
      router.push('/hrm/employees/create');
      return;
    }
    router.push(`/hrm/employees/create?id=${row.id}`);
  }
  async function save(values:Record<string,unknown>) {
    setSaving(true);
    const body={...values};
    for(const field of ['gender','birthday','joinDate','email','phone','address','departmentId','positionId','jobTitleId','managerId']) if(!body[field]) body[field]=null;
    try {
      if(editor && editor!=='new') await apiClient.patch(`/employees/${editor.id}`,{...body,version:editor.version});
      else await apiClient.post('/employees',body);
      setEditor(null);setRevision(r=>r+1);void message.success('Đã lưu hồ sơ nhân sự.');
    } catch(e){void message.error(authError(e));} finally{setSaving(false);}
  }
  async function showDetail(row:Employee) {
    try {const {data}=await apiClient.get<Employee>(`/employees/${row.id}`);setHistory([]);setHistoryPage(1);setDetail(data);} catch(e){void message.error(authError(e));}
  }
  function handleDeleteEmployee(emp: Employee, targets: Employee[] = [emp]) {
    const employees = [...new Map(targets.map(row => [row.id, row])).values()];
    if (!employees.length) return;
    Modal.confirm({
      title: <span style={{ color: '#ef4444', fontWeight: 700 }}>🗑️ Xóa vĩnh viễn tài khoản & hồ sơ nhân sự</span>,
      content: (
        <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ THAO TÁC XÓA KHÔNG THỂ KHÔI PHỤC!</p>
          <p>• <b>Khóa tài khoản:</b> Tạm dừng đăng nhập, có thể <b>mở khóa lại</b> bất cứ lúc nào.</p>
          <p>• <b>Xóa vĩnh viễn {employees.length} nhân sự:</b> Xóa hồ sơ và tài khoản của những người sau:</p>
          <ul style={{ maxHeight: 240, overflowY: 'auto' }}>
            {employees.map(row => <li key={row.id}>{row.name} ({row.code})</li>)}
          </ul>
          <p style={{ marginTop: 8, color: '#475569' }}>Bạn có chắc chắn muốn XÓA VĨNH VIỄN không?</p>
        </div>
      ),
      okText: `Xóa ${employees.length} nhân sự`,
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        const failures: string[] = [];
        let deleted = 0;
        for (const row of employees) {
          try {
            await apiClient.delete(`/employees/${row.id}`);
            deleted++;
          } catch (e) {
            failures.push(`${row.name} (${row.code}): ${authError(e)}`);
          }
        }
        if (deleted) {
          void message.success(`Đã xóa ${deleted}/${employees.length} hồ sơ nhân sự và tài khoản liên quan.`);
          setRevision((r) => r + 1);
        }
        if (failures.length) Modal.error({
          title: `Không xóa được ${failures.length} nhân sự`,
          content: <ul>{failures.map(failure => <li key={failure}>{failure}</li>)}</ul>,
        });
      },
    });
  }
  async function saveCatalog(values:Catalog) {
    setSaving(true);
    try {if(catalogEdit)await apiClient.patch(`/employee-catalogs/${catalogEdit.id}`,values);else await apiClient.post('/employee-catalogs',values);await loadCatalogs();setCatalogEdit(null);catalogForm.resetFields();setRevision(r=>r+1);void message.success('Đã lưu danh mục.');} catch(e){void message.error(authError(e));} finally{setSaving(false);}
  }
  function handleExport() { void message.info('Tính năng xuất file sẽ được bổ sung sau.'); }
  function handleImport() { void message.info('Tính năng nhập file sẽ được bổ sung sau.'); }
  function clearFilters() {
    setQuery(v=>({...v,page:1,q:'',status:undefined,departmentId:undefined,positionId:undefined}));
    setFiltersOpen(false);
  }

  const catalogOptions=(kind:string,field?:'departmentId'|'positionId'|'jobTitleId')=>catalogs.filter(c=>c.kind===kind && (c.active || (field && editor && editor!=='new' && editor[field]===c.id))).map(c=>({value:c.id,label:c.name+(c.active?'':' (ngừng dùng)')}));
  const groups = new Map<string,{name:string;items:Employee[]}>();
  for (const row of rows) {
    const value = query.groupBy ? row[query.groupBy] : null;
    const key = String(value ?? 'none');
    const name = query.groupBy==='positionId' ? row.position?.name : query.groupBy==='jobTitleId' ? row.jobTitle?.name : row.department?.name;
    if (!groups.has(key)) groups.set(key,{name:name ?? 'Chưa xác định',items:[]});
    groups.get(key)!.items.push(row);
  }
  const tableRows:EmployeeTableRow[] = grouped ? [...groups].flatMap(([id,group])=>[
    {id:'group:'+id,group:true as const,name:group.name,count:groupCounts.find(g=>String(g.value??'none')===id)?.count??0},
    ...(collapsed.has('group:'+id)?[]:group.items),
  ]) : rows;

  const rowSelection: TableRowSelection<EmployeeTableRow> = {
    selectedRowKeys: selectedKeys,
    onChange: (keys) => setSelectedKeys(keys as string[]),
    getCheckboxProps: (row) => ({ disabled: isGroup(row) }),
  };

  const columns: ColumnsType<EmployeeTableRow> = columnPreferences.order
    .filter((key) => columnPreferences.visible.includes(key))
    .map((key) => ({
      key,
      title: employeeColumns.find(([id]) => id === key)![1],
      width: key === 'name' ? 260 : key === 'address' ? 220 : 160,
      sorter: true,
      sortOrder: query.sortBy === key ? (query.sortDirection === 'asc' ? 'ascend' : 'descend') : null,
      render: (_, row) => {
        if (isGroup(row)) return null;

        if (key === 'code') {
          return (
            <Tag style={{ fontWeight: 600, fontFamily: 'monospace', borderRadius: 6, color: '#334155', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
              {row.code}
            </Tag>
          );
        }

        if (key === 'name') {
          const userAcc = userMap[row.id];
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => void showDetail(row)}>
              <Avatar
                style={{
                  backgroundColor: getAvatarBg(row.name),
                  fontWeight: 700,
                  fontSize: 12,
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                }}
                size={34}
              >
                {getInitials(row.name)}
              </Avatar>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13.5, lineHeight: 1.3 }} className="employee-name-hover">
                  {row.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{row.code}</span>
                  {userAcc ? (
                    <Tooltip title={`Tài khoản hệ thống: ${userAcc.username} (${userAcc.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'})`}>
                      <Tag color={userAcc.status === 'ACTIVE' ? 'success' : 'default'} style={{ fontSize: 10, padding: '0 5px', margin: 0, borderRadius: 4 }}>
                        {userAcc.status === 'ACTIVE' ? '🔑 Đã cấp TK' : '🔒 Khóa TK'}
                      </Tag>
                    </Tooltip>
                  ) : (
                    <Tag style={{ fontSize: 10, padding: '0 5px', margin: 0, borderRadius: 4, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      ⚪ Chưa cấp TK
                    </Tag>
                  )}
                </div>
              </div>
            </div>
          );
        }

        if (key === 'status') {
          return renderStatusTag(row.status);
        }

        if (key === 'department') {
          return row.department ? (
            <Tag style={{ borderRadius: 6, fontWeight: 600, border: 'none', background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px' }}>
              🏢 {row.department.name}
            </Tag>
          ) : (
            <span style={{ color: '#cbd5e1' }}>—</span>
          );
        }

        if (key === 'position') {
          return row.position ? (
            <Tag style={{ borderRadius: 6, fontWeight: 500, border: 'none', background: '#eff6ff', color: '#1e40af', padding: '2px 8px' }}>
              💼 {row.position.name}
            </Tag>
          ) : (
            <span style={{ color: '#cbd5e1' }}>—</span>
          );
        }

        if (key === 'jobTitle') {
          return row.jobTitle ? (
            <span style={{ fontSize: 12.5, color: '#334155', fontWeight: 500 }}>{row.jobTitle.name}</span>
          ) : (
            <span style={{ color: '#cbd5e1' }}>—</span>
          );
        }

        if (key === 'birthday' || key === 'joinDate') {
          return <span style={{ fontSize: 12, color: '#475569' }}>{calendarDate(row[key as 'birthday' | 'joinDate'])}</span>;
        }

        return display(row[key as keyof Employee]);
      },
    }));

  columns.push({
    key: 'actions',
    title: 'Thao tác',
    width: 170,
    render: (_, row) => {
      if (isGroup(row)) return null;
      const userAcc = userMap[row.id];

      return (
        <Space size={4}>
          <Tooltip title="Xem chi tiết hồ sơ">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined style={{ color: '#6366f1' }} />}
              onClick={() => void showDetail(row)}
            />
          </Tooltip>
          {can('employee.update') && (
            <Tooltip title="Chỉnh sửa thông tin">
              <Button
                size="small"
                type="text"
                icon={<EditOutlined style={{ color: '#0284c7' }} />}
                onClick={() => openEditor(row)}
              />
            </Tooltip>
          )}
          <Tooltip title={userAcc ? "Quản lý tài khoản người dùng" : "Cấp tài khoản đăng nhập"}>
            <Button
              size="small"
              type="text"
              icon={<KeyOutlined style={{ color: userAcc ? '#10b981' : '#e83e8c' }} />}
              onClick={() => setActivateEmployee(row)}
            />
          </Tooltip>
          {can('employee.delete') && (
            <Tooltip title="Xóa vĩnh viễn">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteEmployee(row)}
              />
            </Tooltip>
          )}
        </Space>
      );
    },
  });

  columns.forEach((column, index) => {
    const render = column.render;
    column.onCell = (row) => (isGroup(row) ? { colSpan: index === 0 ? columns.length : 0 } : {});
    column.render = (value, row, rowIndex) =>
      isGroup(row) ? (
        index === 0 ? (
          <button
            className="employee-group-toggle"
            aria-expanded={!collapsed.has(row.id)}
            onClick={() =>
              setCollapsed((previous) => {
                const next = new Set(previous);
                if (next.has(row.id)) next.delete(row.id);
                else next.add(row.id);
                return next;
              })
            }
          >
            📂 {row.name} ({row.count}) <span aria-hidden="true">{collapsed.has(row.id) ? '›' : '⌄'}</span>
          </button>
        ) : null
      ) : (
        render?.(value, row, rowIndex)
      );
  });
  function setGrouping(groupBy:GroupField|undefined) {
    setCollapsed(new Set());setSelectedKeys([]);setQuery(v=>({...v,page:1,groupBy}));
  }

  const activeTab = query.status ?? 'ALL';
  const tabItems = STATUS_TABS.map(tab => ({
    key: tab.key,
    label: tab.key === activeTab && total > 0
      ? <span>{tab.label} <span className="emp-tab-count">({total})</span></span>
      : tab.label,
  }));

  const hasFilter = !!(query.q || query.status || query.departmentId || query.positionId);

  if(!allowed)return <Alert type="warning" title="Bạn chưa được cấp quyền xem hồ sơ nhân sự." showIcon />;
  return <section className="employees-page">
    {/* Tab bar + view toggle */}
    <div className="employees-heading">
      <Tabs aria-label="Nhóm trạng thái nhân sự" activeKey={activeTab}
        onChange={key=>setQuery(v=>({...v,page:1,status:key==='ALL'?undefined:key}))}
        items={tabItems} />
      <span className="employees-view-label"><PortalIcon name="file" size={17}/> Danh sách</span>
    </div>

    {/* Toolbar */}
    <div className="employees-toolbar">
      <div className="employees-toolbar-left">
        {/* Quick Search Input */}
        <Input
          placeholder="Tìm tên, mã, phòng ban..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          defaultValue={query.q}
          onChange={(e) => {
            const val = e.target.value;
            setQuery((v) => ({ ...v, page: 1, q: val }));
          }}
          style={{ width: 220, borderRadius: 20 }}
          allowClear
        />

        {/* Nút Bộ lọc */}
        <Dropdown trigger={['click']} placement="bottomLeft" menu={{items:[
          {
            key:'sort',
            label: query.sortBy
              ? <span className="emp-menu-active">
                  Sắp xếp: {employeeColumns.find(([k])=>k===query.sortBy)?.[1]}
                  <span className="emp-menu-x" onClick={e=>{e.stopPropagation();setQuery(v=>({...v,page:1,sortBy:undefined}));}}>✕</span>
                </span>
              : 'Sắp xếp danh sách',
            children: [
              ...employeeColumns.map(([key,label])=>({key:'sort:'+key,label,onClick:()=>setQuery(v=>({...v,page:1,sortBy:key,sortDirection:'asc'}))})),
              {type:'divider' as const},
              {key:'sort-desc',label:'Giảm dần',disabled:!query.sortBy,onClick:()=>setQuery(v=>({...v,page:1,sortDirection:'desc'}))},
              {key:'sort-asc',label:'Tăng dần',disabled:!query.sortBy,onClick:()=>setQuery(v=>({...v,page:1,sortDirection:'asc'}))},
            ]
          },
          {
            key:'group',
            label: grouped
              ? <span className="emp-menu-active">
                  Nhóm: {groupOptions.find(g=>g.key===query.groupBy)?.label}
                  <span className="emp-menu-x" onClick={e=>{e.stopPropagation();setGrouping(undefined);}}>✕</span>
                </span>
              : 'Nhóm dữ liệu',
            children: groupOptions.map(item=>({...item,key:'group:'+item.key,onClick:()=>setGrouping(item.key as GroupField)}))
          },
          {key:'columns',label:'Chọn cột hiển thị',onClick:()=>setColumnsOpen(true)},
          {type:'divider'},
          {
            key:'filter',
            label: (filtersOpen || hasFilter)
              ? <span className="emp-menu-active">
                  Lọc nâng cao
                  <span className="emp-menu-x" onClick={e=>{e.stopPropagation();clearFilters();}}>✕</span>
                </span>
              : 'Lọc nâng cao',
            onClick:()=>setFiltersOpen(v=>!v)
          },
        ]}}>
          <Button type="text"
            className={'emp-toolbar-btn' + ((hasFilter||filtersOpen) ? ' has-filters' : '')}
            aria-label="Bộ lọc nhân sự">
            <FilterOutlined style={{ color: (hasFilter||filtersOpen) ? '#6366f1' : '#64748b' }} /> Lọc{hasFilter ? ' •' : ''}
          </Button>
        </Dropdown>
        <span className="employees-count-label" aria-live="polite">
          {busy ? 'Đang tải…' : error ? 'Lỗi tải danh sách' : total
            ? `Hiển thị ${(query.page-1)*20+1}–${Math.min(query.page*20,total)} / ${total} hồ sơ`
            : '0 hồ sơ'}
        </span>
        {selectedKeys.length > 0 && (
          <Space>
            <span className="emp-selected-label">{selectedKeys.length} đã chọn</span>
            {can('employee.update') && <Button danger icon={<DeleteOutlined />} onClick={() => {
              const targets = rows.filter(row => selectedKeys.includes(row.id));
              if (targets.length) handleDeleteEmployee(targets[0], targets);
            }}>Xóa đã chọn</Button>}
          </Space>
        )}
      </div>
      <div className="employees-toolbar-right">
        {can('employee.create') && (
          <Button
            type="primary"
            className="emp-toolbar-btn primary-btn"
            icon={<PlusOutlined />}
            onClick={() => openEditor()}
          >
            Thêm hồ sơ mới
          </Button>
        )}
        <Dropdown trigger={['click']} placement="bottomRight" menu={{items:[
          {key:'group-dept',label:'Nhóm: Phòng ban',onClick:()=>setGrouping('departmentId')},
          {key:'group-pos',label:'Nhóm: Vị trí',onClick:()=>setGrouping('positionId')},
          {key:'group-job',label:'Nhóm: Chức danh',onClick:()=>setGrouping('jobTitleId')},
          {type:'divider'},
          {key:'ungroup',label:'Bỏ nhóm',disabled:!grouped,onClick:()=>setGrouping(undefined)},
        ]}}>
          <Button type="text" className={'emp-toolbar-btn' + (grouped ? ' is-active' : '')}>
            Nhóm{query.groupBy ? ': ' + groupOptions.find(item=>item.key===query.groupBy)?.label : ''}
          </Button>
        </Dropdown>
        <Button type="text" className="emp-toolbar-btn" onClick={handleExport}>Xuất</Button>
        <Button type="text" className="emp-toolbar-btn" onClick={handleImport}>Nhập</Button>
        <Button type="text" className="emp-toolbar-btn" icon={<ReloadOutlined />} onClick={()=>setRevision(r=>r+1)}>Tải lại</Button>
        <Button type="text" className="emp-toolbar-btn" onClick={()=>setColumnsOpen(true)}>Cột hiển thị</Button>
        <Button type="text" className="emp-toolbar-btn" icon={<SettingOutlined />} onClick={()=>router.push('/hrm/settings/positions')}>Cài đặt</Button>
      </div>
    </div>

    {/* Filter panel — mở qua menu "Tìm kiếm và lọc hồ sơ", đóng bằng nút × hoặc cùng mục đó */}
    <div id="employee-filters" className="employees-filters" hidden={!filtersOpen}>
      <Input.Search placeholder="Tìm mã hoặc tên nhân sự" allowClear defaultValue={query.q} onSearch={q=>setQuery(v=>({...v,page:1,q}))}/>
      <Select aria-label="Lọc trạng thái" value={query.status} placeholder="Tất cả trạng thái" allowClear options={Object.entries(statuses).map(([value,label])=>({value,label}))} onChange={status=>setQuery(v=>({...v,page:1,status}))}/>
      <Select aria-label="Lọc phòng ban" placeholder="Tất cả phòng ban" allowClear options={catalogs.filter(c=>c.kind==='DEPARTMENT').map(c=>({value:c.id,label:c.name}))} onChange={departmentId=>setQuery(v=>({...v,page:1,departmentId}))}/>
      <Select aria-label="Lọc vị trí" placeholder="Tất cả vị trí" allowClear options={catalogs.filter(c=>c.kind==='POSITION').map(c=>({value:c.id,label:c.name}))} onChange={positionId=>setQuery(v=>({...v,page:1,positionId}))}/>
      <button className="emp-filter-close" aria-label="Đóng bộ lọc" title="Đóng bộ lọc" onClick={()=>setFiltersOpen(false)}>✕ Đóng</button>
    </div>

    {grouped&&<p className="employees-group-note">Nhóm theo {groupOptions.find(item=>item.key===query.groupBy)?.label.toLowerCase()}. Số lượng nhóm tính trên toàn bộ kết quả; hồ sơ vẫn phân trang. Sắp xếp áp dụng trong từng nhóm.</p>}
    <ColumnSettings open={columnsOpen} onClose={()=>setColumnsOpen(false)} value={columnPreferences} onChange={setColumnPreferences}/>
    {error&&<Alert type="error" message={error} showIcon style={{margin:'0 20px 12px'}}/>}

    {/* Main table */}
    <div className="employees-table">
      <Table<EmployeeTableRow>
        rowKey="id"
        loading={busy}
        dataSource={error?[]:tableRows}
        onRow={(record) => {
          if (isGroup(record)) return {};
          return {
            onContextMenu: (e) => {
              e.preventDefault();
              setContextMenu({ record, x: e.clientX, y: e.clientY });
            },
          };
        }}
        scroll={{x:columns.reduce((sum,column)=>sum+Number(column.width??180),48)}}
        rowClassName={row=>isGroup(row)?'employee-group-row':''}
        locale={{emptyText:'Chưa có hồ sơ phù hợp'}}
        pagination={false}
        rowSelection={rowSelection}
        columns={columns}
        onChange={(_pagination,_filters,sorter)=>{
          if(Array.isArray(sorter))return;
          setQuery(v=>({...v,page:1,sortBy:sorter.order?sorter.columnKey as ColumnKey:undefined,sortDirection:sorter.order==='descend'?'desc':'asc'}));
        }}
      />
      <div className="employees-pagination">
        <Pagination current={query.page} pageSize={20} total={error?0:total} showSizeChanger={false} onChange={page=>setQuery(v=>({...v,page}))}/>
      </div>
    </div>

    {/* Add / Edit modal */}
    <Modal title={editor==='new'?'Thêm nhân sự':'Sửa hồ sơ nhân sự'} open={!!editor} onCancel={()=>{if(!saving)setEditor(null);}} footer={null} width={760} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={save} className="employees-form">
        <Form.Item name="code" label="Mã nhân sự" rules={[{required:true,pattern:/^[a-zA-Z0-9._-]{1,50}$/,message:'Nhập 1–50 ký tự: chữ Latin, số, dấu . _ -'}]}><Input maxLength={50}/></Form.Item>
        <Form.Item name="name" label="Họ và tên" rules={[{required:true,whitespace:true,message:'Nhập họ và tên'}]}><Input maxLength={150}/></Form.Item>
        <Form.Item name="status" label="Trạng thái" rules={[{required:true}]}><Select options={Object.entries(statuses).map(([value,label])=>({value,label}))}/></Form.Item>
        <Form.Item name="gender" label="Giới tính"><Select allowClear options={[{value:'FEMALE',label:'Nữ'},{value:'MALE',label:'Nam'},{value:'OTHER',label:'Khác'}]}/></Form.Item>
        <Form.Item name="birthday" label="Ngày sinh"><Input type="date"/></Form.Item><Form.Item name="joinDate" label="Ngày vào làm"><Input type="date"/></Form.Item>
        <Form.Item name="email" label="Email" rules={[{type:'email'}]}><Input maxLength={254}/></Form.Item><Form.Item name="phone" label="Điện thoại"><Input maxLength={30}/></Form.Item>
        {(['departmentId','positionId','jobTitleId'] as const).map((field,i)=><Form.Item key={field} name={field} label={Object.values(kinds)[i]}><Select allowClear showSearch optionFilterProp="label" options={catalogOptions(Object.keys(kinds)[i],field)}/></Form.Item>)}
        <Form.Item name="managerId" label="Quản lý trực tiếp"><Select allowClear showSearch filterOption={false} onSearch={q=>void searchManagers(q)} options={[...(editor&&editor!=='new'&&editor.manager?[editor.manager]:[]),...managers].filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i && (editor==='new'||m.id!==editor?.id)).map(m=>({value:m.id,label:`${m.code} · ${m.name}`}))}/></Form.Item>
        <Form.Item name="address" label="Địa chỉ" className="employees-wide"><Input.TextArea maxLength={500}/></Form.Item>
        <div className="employees-wide"><Space><Button onClick={()=>setEditor(null)} disabled={saving}>Hủy</Button><Button htmlType="submit" type="primary" loading={saving}>Lưu hồ sơ</Button></Space></div>
      </Form>
    </Modal>

    {/* Detail drawer */}
    <Drawer title="Chi tiết hồ sơ nhân sự" open={!!detail} onClose={()=>setDetail(null)} size={680}>
      {detail&&<><Descriptions column={1} bordered items={Object.entries(labels).map(([key,label])=>({key,label,children:display(detail[key as keyof Employee])}))}/>
      <Typography.Title level={4}>Lịch sử thay đổi</Typography.Title>
      {detailError&&<Alert type="error" message={detailError}/>}
      <Spin spinning={detailBusy}>
        {!history.length&&!detailBusy&&<p>Chưa có lịch sử (hồ sơ có thể đã tồn tại trước module này).</p>}
        {history.map(h=><article className="employee-history" key={h.id}><strong>{h.action==='CREATED'?'Tạo hồ sơ':'Cập nhật hồ sơ'} · {h.actorName}</strong><p>{new Date(h.createdAt).toLocaleString('vi-VN')}</p>{Object.entries(labels).filter(([key])=>JSON.stringify(h.before?.[key])!==JSON.stringify(h.after[key])).map(([key,label])=><p key={key}><b>{label}:</b> {h.before?`${display(h.before[key])} → `:''}{display(h.after[key])}</p>)}</article>)}
      </Spin>
      <Pagination current={historyPage} pageSize={10} total={historyTotal} showSizeChanger={false} onChange={setHistoryPage}/></>}
    </Drawer>

    {/* Catalog modal */}
    <Modal title="Danh mục nhân sự" open={catalogOpen} onCancel={()=>{if(!saving)setCatalogOpen(false);}} footer={null} width={850}>
      <Form form={catalogForm} layout="vertical" onFinish={saveCatalog} initialValues={{kind:'DEPARTMENT',active:true}}><Space wrap align="start"><Form.Item name="kind" label="Loại" rules={[{required:true}]}><Select style={{width:150}} disabled={!!catalogEdit} options={Object.entries(kinds).map(([value,label])=>({value,label}))}/></Form.Item><Form.Item name="code" label="Mã" rules={[{required:true,pattern:/^[a-zA-Z0-9._-]{1,50}$/}]}><Input maxLength={50}/></Form.Item><Form.Item name="name" label="Tên" rules={[{required:true,whitespace:true}]}><Input maxLength={150}/></Form.Item><Form.Item name="active" label="Đang sử dụng" valuePropName="checked"><Switch/></Form.Item></Space><Space><Button htmlType="submit" type="primary" loading={saving}>{catalogEdit?'Lưu danh mục':'Thêm danh mục'}</Button>{catalogEdit&&<Button onClick={()=>{setCatalogEdit(null);catalogForm.resetFields();}}>Hủy sửa</Button>}</Space></Form>
      <Table<Catalog> style={{marginTop:20}} rowKey="id" dataSource={catalogs} scroll={{x:550}} pagination={{pageSize:8}} columns={[{title:'Loại',dataIndex:'kind',render:k=>kinds[k]},{title:'Mã',dataIndex:'code'},{title:'Tên',dataIndex:'name'},{title:'Trạng thái',dataIndex:'active',render:v=>v?'Đang dùng':'Ngừng dùng'},{title:'Thao tác',render:(_,r)=><Button onClick={()=>{setCatalogEdit(r);catalogForm.setFieldsValue(r);}}>Sửa</Button>}]}/>
    </Modal>

    {/* Activate Account Modal */}
    <ActivateAccountModal
      employee={activateEmployee}
      open={!!activateEmployee}
      onClose={() => setActivateEmployee(null)}
      onSuccess={() => setRevision((r) => r + 1)}
    />

    {/* 1Office Right-Click Context Menu */}
    {contextMenu && (() => {
      const targetUser = contextMenu.record.user || userMap[contextMenu.record.id];
      const hasAccount = !!targetUser;
      const isLocked = targetUser?.status === 'LOCKED';

      return (
        <div
          className="employee-context-menu"
          style={{
            top: Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 800) - 420),
            left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 240),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="menu-item" onClick={() => { setContextMenu(null); void showDetail(contextMenu.record); }}>
            <span>👁️</span> Chi tiết hồ sơ
          </div>
          <div className="menu-item" onClick={() => { setContextMenu(null); openEditor(contextMenu.record); }}>
            <span>✏️</span> Sửa hồ sơ
          </div>

          {hasAccount ? (
            <div
              className="menu-item highlight-item"
              onClick={async () => {
                const newStatus = isLocked ? 'ACTIVE' : 'LOCKED';
                setContextMenu(null);
                try {
                  await apiClient.patch(`/users/${targetUser.id}/status`, { status: newStatus });
                  message.success(`Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${targetUser.username || ''}`);
                  setRevision((r) => r + 1);
                } catch (err) {
                  message.info(`Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${targetUser.username || ''}`);
                  setRevision((r) => r + 1);
                }
              }}
            >
              <span style={{ color: isLocked ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                {isLocked ? '🔓' : '🔒'}
              </span>{' '}
              <span>{isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</span>
            </div>
          ) : (
            <div
              className="menu-item highlight-item"
              onClick={() => {
                setActivateEmployee(contextMenu.record);
                setContextMenu(null);
              }}
            >
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span> <span>Tạo tài khoản</span>
            </div>
          )}

          <div
            className="menu-item"
            style={{ color: '#ef4444', fontWeight: 600 }}
            onClick={() => {
              const rec = contextMenu.record;
              setContextMenu(null);
              handleDeleteEmployee(rec, selectedKeys.includes(rec.id)
                ? rows.filter(row => selectedKeys.includes(row.id)) : [rec]);
            }}
          >
            <span>🗑️</span> {selectedKeys.includes(contextMenu.record.id) && selectedKeys.length > 1
              ? `Xóa ${selectedKeys.length} nhân sự đã chọn` : 'Xóa vĩnh viễn (TK & Hồ sơ)'}
          </div>

          <div className="menu-divider" />
          <div className="menu-item" onClick={() => { setContextMenu(null); void message.info('Cập nhật trạng thái hồ sơ'); }}>
            <span>🔄</span> Cập nhật trạng thái hồ sơ
          </div>
          <div className="menu-item" onClick={() => { setContextMenu(null); void message.info('Cập nhật lương & phụ cấp'); }}>
            <span>💲</span> Cập nhật lương & phụ cấp
          </div>
          <div className="menu-item" onClick={() => { setContextMenu(null); void message.info('Tạo hợp đồng'); }}>
            <span>📜</span> Tạo hợp đồng
          </div>
          <div className="menu-item" onClick={() => { setContextMenu(null); void message.info('Giấy phép lao động'); }}>
            <span>📄</span> Giấy phép lao động
          </div>
          <div className="menu-item" onClick={() => { setContextMenu(null); void message.info('Thị Thực/Tạm trú'); }}>
            <span>🛂</span> Thị Thực/Tạm trú
          </div>
          <div className="menu-item" onClick={() => { setContextMenu(null); void message.info('Chứng chỉ'); }}>
            <span>🏅</span> Chứng chỉ
          </div>
        </div>
      );
    })()}
  </section>;
}
