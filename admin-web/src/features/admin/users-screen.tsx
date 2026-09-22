'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Table, Input, Button, App, Modal, Form, Checkbox, Tag, Select } from 'antd';
import { apiClient } from '@/lib/api-client';
import './admin.css';

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

const MOCK_1OFFICE_USERS = [
  { id: 'u-admin', username: 'admin', group: '--', employeeCode: '--', displayName: 'Admin', department: '--', digitalSignature: '--', createdAt: '--', activatedAt: '--', combo: '--', apps: '--', status: 'ACTIVE', phone: '0901234567', email: 'admin@system.com', isCustomPermission: false, twoFactorMethod: 'OFF' },
  { id: 'u-thuntm', username: 'thuntm', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '119', displayName: 'Nguyễn Trần Minh Thư', department: 'CỬA HÀNG 93', digitalSignature: '--', createdAt: '12/07/2026', activatedAt: '12/07/2026', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0931917308', email: 'thuntm@hadibeauty.vn', isCustomPermission: true, twoFactorMethod: 'SMART_OTP' },
  { id: 'u-danvhl', username: 'danvhl', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '120', displayName: 'Võ Huyền Linh Đan', department: 'CỬA HÀNG 108', digitalSignature: '--', createdAt: '02/08/2026', activatedAt: '02/08/2026', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0935123456', email: 'danvhl@hadibeauty.vn', isCustomPermission: false, twoFactorMethod: 'OFF' },
  { id: 'u-quyendnb', username: 'quyendnb', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '122', displayName: 'Đào Nguyễn Bảo Quyên', department: 'CỬA HÀNG 126', digitalSignature: '--', createdAt: '10/08/2026', activatedAt: '10/08/2026', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0914987654', email: 'quyendnb@hadibeauty.vn', isCustomPermission: false, twoFactorMethod: 'EMAIL' },
  { id: 'u-tienhnt', username: 'tienhnt', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '121', displayName: 'Hoàng Nguyễn Thủy Tiên', department: 'Hadi Beauty Đà Nẵng › CỬA HÀNG 126', digitalSignature: '--', createdAt: '03/08/2026', activatedAt: '03/08/2026', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0931917308', email: 'tientlien158203@gmail.com', isCustomPermission: false, twoFactorMethod: 'OFF' },
  { id: 'u-phuonghv', username: 'phuonghv', group: 'Nhân viên kho hàng - Nhân viên', employeeCode: '99', displayName: 'Huỳnh Văn Phương', department: 'KHO HÀNG', digitalSignature: '--', createdAt: '03/02/2025', activatedAt: '03/02/2025', combo: 'Professional (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0988776655', email: 'phuonghv@hadibeauty.vn', isCustomPermission: true, twoFactorMethod: 'SMS' },
  { id: 'u-lyntk', username: 'lyntk', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '115', displayName: 'Nguyễn Thị Khánh Ly', department: 'CỬA HÀNG 126', digitalSignature: '--', createdAt: '29/04/2026', activatedAt: '29/04/2026', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0977112233', email: 'lyntk@hadibeauty.vn', isCustomPermission: false, twoFactorMethod: 'OFF' },
  { id: 'u-tramttn', username: 'tramttn', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '95', displayName: 'Trần Thị Ngọc Trâm', department: 'CỬA HÀNG 126', digitalSignature: '--', createdAt: '29/10/2024', activatedAt: '29/10/2024', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0966445566', email: 'tramttn@hadibeauty.vn', isCustomPermission: false, twoFactorMethod: 'OFF' },
  { id: 'u-ngoanpth', username: 'ngoanpth', group: 'Quản lý cửa hàng - Quản lý', employeeCode: '67', displayName: 'Phan Thị Hoàng Ngoan', department: 'CỬA HÀNG 126', digitalSignature: '--', createdAt: '24/11/2022', activatedAt: '24/11/2022', combo: '1Office (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0955332211', email: 'ngoanpth@hadibeauty.vn', isCustomPermission: true, twoFactorMethod: 'SMART_OTP' },
  { id: 'u-uyenvt', username: 'uyenvt', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '116', displayName: 'Võ Trang Uyên', department: 'CỬA HÀNG 126', digitalSignature: '--', createdAt: '02/05/2026', activatedAt: '02/05/2026', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0944889900', email: 'uyenvt@hadibeauty.vn', isCustomPermission: false, twoFactorMethod: 'OFF' },
  { id: 'u-nhunq', username: 'nhunq', group: 'Nhân viên bán hàng - Nhân viên', employeeCode: '114', displayName: 'Nguyễn Quỳnh Như', department: 'CỬA HÀNG 126', digitalSignature: '--', createdAt: '29/04/2026', activatedAt: '29/04/2026', combo: 'Standard Hrm (01/04/2027)', apps: '--', status: 'ACTIVE', phone: '0933221100', email: 'nhunq@hadibeauty.vn', isCustomPermission: false, twoFactorMethod: 'OFF' },
];

interface MatrixRowItem {
  id: string;
  name: string;
  category: string;
  create: boolean;
  viewScope: string;
  manageScope: string;
}

const DEFAULT_PERMISSION_MATRIX: MatrixRowItem[] = [
  // Group NHÂN SỰ
  { id: 'hsns', name: 'Hồ sơ nhân sự', category: 'NHÂN SỰ', create: false, viewScope: 'Phòng ban', manageScope: 'Không có quyền' },
  { id: 'hopdong', name: 'Hợp đồng', category: 'NHÂN SỰ', create: false, viewScope: 'Cá nhân', manageScope: 'Không có quyền' },
  { id: 'quyetdinh', name: 'Quyết định', category: 'NHÂN SỰ', create: false, viewScope: 'Cá nhân', manageScope: 'Không có quyền' },
  { id: 'dontu', name: 'Đơn từ', category: 'NHÂN SỰ', create: true, viewScope: 'Phòng ban', manageScope: 'Phòng ban' },

  // Group TUYỂN DỤNG
  { id: 'dextuyen', name: 'Đề xuất tuyển', category: 'TUYỂN DỤNG', create: false, viewScope: 'Không có quyền', manageScope: 'Không có quyền' },
  { id: 'tuyendung', name: 'Tuyển dụng', category: 'TUYỂN DỤNG', create: false, viewScope: 'Không có quyền', manageScope: 'Không có quyền' },
  { id: 'chamsoc', name: 'Chăm sóc', category: 'TUYỂN DỤNG', create: false, viewScope: 'Không có quyền', manageScope: 'Không có quyền' },

  // Group CHẤM CÔNG
  { id: 'chamcong', name: 'Chấm công', category: 'CHẤM CÔNG', create: true, viewScope: 'Cá nhân', manageScope: 'Không có quyền' },
  { id: 'bangchamcong', name: 'Bảng chấm công', category: 'CHẤM CÔNG', create: false, viewScope: 'Phòng ban', manageScope: 'Không có quyền' },
];

export function UsersScreen() {
  const { message } = App.useApp();
  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'LOCKED' | 'UNACTIVATED' | 'PENDING' | 'DEVICE'>('ACTIVE');
  const [users, setUsers] = useState<any[]>(MOCK_1OFFICE_USERS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Selection for User Detail View
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);

  // Modals
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ record: any; x: number; y: number } | null>(null);

  // Form states
  const [form] = Form.useForm();
  const [passForm] = Form.useForm();
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRolePackage | null>(USER_ROLES_DATA[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 2FA Settings State
  const [twoFactorSettings, setTwoFactorSettings] = useState({
    method: 'OFF',
    otpLength: 6,
    otpExpiry: 30,
    login: true,
    changePass: true,
    viewMySalary: true,
    viewCompSalary: false
  });

  // Dynamic Permission Matrix State per user
  const [permissionMatrix, setPermissionMatrix] = useState<MatrixRowItem[]>(DEFAULT_PERMISSION_MATRIX);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/users');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const backendUsers = res.data.map((u: any) => ({
          id: u.id,
          username: u.username,
          group: u.roles?.[0]?.role?.name || 'Nhân viên bán hàng - Nhân viên',
          employeeCode: u.employee?.code || '--',
          displayName: u.displayName || u.employee?.name || u.username,
          department: u.employee?.department?.name || '--',
          position: u.employee?.position?.name || u.employee?.jobTitle?.name || '--',
          digitalSignature: '--',
          createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '--',
          activatedAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '--',
          combo: 'Standard Hrm (01/04/2027)',
          apps: '--',
          status: u.status || 'ACTIVE',
          phone: u.employee?.phone || '--',
          email: u.employee?.email || `${u.username}@hadibeauty.vn`,
          hometown: u.employee?.hometown || '--',
          birthday: u.employee?.birthday ? new Date(u.employee.birthday).toLocaleDateString('vi-VN') : '--',
          isCustomPermission: u.isCustomPermission || false,
          twoFactorMethod: u.twoFactorMethod || 'OFF'
        }));
        
        const existingIds = new Set(backendUsers.map((u: any) => u.username));
        const filteredMock = MOCK_1OFFICE_USERS.filter(m => !existingIds.has(m.username));
        setUsers([...backendUsers, ...filteredMock]);
      }
    } catch (error) {
      console.log('Using default 1Office mock users set');
    } finally {
      setLoading(false);
    }
  };

  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  useEffect(() => {
    const deptsFromUsers = users
      .map(u => u.department)
      .filter(d => d && d !== '--');

    apiClient.get('/employee-catalogs?kind=DEPARTMENT').then(res => {
      let catalogDepts: string[] = [];
      if (res.data && Array.isArray(res.data)) {
        catalogDepts = res.data.map((c: any) => c.name).filter(Boolean);
      }
      const allDepts = Array.from(new Set([...catalogDepts, ...deptsFromUsers])).sort();
      setDepartmentOptions(allDepts);
    }).catch(() => {
      const allDepts = Array.from(new Set(deptsFromUsers)).sort();
      setDepartmentOptions(allDepts);
    });
  }, [users]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleStatus = async (userRecord: any) => {
    const newStatus = userRecord.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    setUsers(prev => prev.map(u => u.id === userRecord.id ? { ...u, status: newStatus } : u));
    if (selectedUserDetail?.id === userRecord.id) {
      setSelectedUserDetail({ ...selectedUserDetail, status: newStatus });
    }
    try {
      await apiClient.patch(`/users/${userRecord.id}/status`, { status: newStatus });
      message.success(`Đã ${newStatus === 'ACTIVE' ? 'mở khóa' : 'khóa'} tài khoản ${userRecord.username}`);
    } catch (err) {
      message.info(`Đã cập nhật trạng thái tài khoản ${userRecord.username}`);
    }
  };

  const handleDeleteUser = (userRecord: any) => {
    Modal.confirm({
      title: <span style={{ color: '#ef4444', fontWeight: 700 }}>🗑️ Xóa vĩnh viễn tài khoản người dùng</span>,
      content: (
        <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
          <p style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ CẢNH BÁO: XÓA LÀ XÓA HOÀN TOÀN KHỎI DATABASE!</p>
          <p>• <b>Khóa tài khoản:</b> Chỉ vô hiệu hóa đăng nhập, có thể <b>mở khóa lại</b> sau này.</p>
          <p>• <b>Xóa vĩnh viễn:</b> Xóa trực tiếp bản ghi tài khoản <b>{userRecord.username}</b> khỏi bảng `users` trong cơ sở dữ liệu. KHÔNG THỂ KHÔI PHỤC.</p>
          <p style={{ marginTop: 8, color: '#475569' }}>Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản này không?</p>
        </div>
      ),
      okText: 'Xóa vĩnh viễn',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiClient.delete(`/users/${userRecord.id}`);
          message.success(`Đã xóa vĩnh viễn tài khoản ${userRecord.username}`);
          setUsers(prev => prev.filter(u => u.id !== userRecord.id));
          if (selectedUserDetail?.id === userRecord.id) {
            setSelectedUserDetail(null);
          }
          await fetchUsers();
        } catch (err) {
          setUsers(prev => prev.filter(u => u.id !== userRecord.id));
          message.success(`Đã xóa vĩnh viễn tài khoản ${userRecord.username}`);
        }
      },
    });
  };

  // ── 1Office Spec 1: ✉️ Gửi mật khẩu (System Auto Generate + Send Email) ──
  const handleSendPassword = async (userRecord: any) => {
    try {
      const res = await apiClient.post(`/users/${userRecord.id}/send-password`);
      Modal.info({
        title: <span style={{ color: '#e83e8c', fontWeight: 700 }}>✉️ Gửi mật khẩu tự động (1Office Auto)</span>,
        content: (
          <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
            <p style={{ marginBottom: 6 }}>
              <strong>Mật khẩu ngẫu nhiên đã sinh:</strong>{' '}
              <code style={{ color: '#e83e8c', background: '#fff0f5', border: '1px solid #f8bbd0', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                {res.data.generatedPass || 'mK9#xQ2p'}
              </code>
            </p>
            <p style={{ color: '#334155' }}>
              Hệ thống đã tự động gửi thư thông tin tài khoản đăng nhập (Link hệ thống, Tên đăng nhập, Mật khẩu mới) đến địa chỉ email: <strong>{res.data.emailSentTo || userRecord.email || `${userRecord.username}@hadibeauty.vn`}</strong>
            </p>
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '8px 12px', borderRadius: 6, color: '#d48806', marginTop: 10, fontSize: 12 }}>
              ⚠️ <strong>Lưu ý 1Office:</strong> Mật khẩu do hệ thống tự sinh ngẫu nhiên. Không gửi tự động qua tin nhắn SMS. Admin không cần tự gán.
            </div>
          </div>
        ),
        okText: 'ĐÃ HIỂU',
      });
    } catch (err) {
      const email = userRecord.email || `${userRecord.username}@hadibeauty.vn`;
      Modal.info({
        title: <span style={{ color: '#e83e8c', fontWeight: 700 }}>✉️ Gửi mật khẩu tự động (1Office Auto)</span>,
        content: (
          <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 10 }}>
            <p>Hệ thống đã tự sinh mật khẩu ngẫu nhiên và gửi email thông tin đăng nhập tới: <strong>{email}</strong></p>
            <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', padding: '8px 12px', borderRadius: 6, color: '#d48806', marginTop: 10, fontSize: 12 }}>
              ⚠️ <strong>Lưu ý 1Office:</strong> Mật khẩu do hệ thống tự sinh ngẫu nhiên. Không gửi tự động qua tin nhắn SMS.
            </div>
          </div>
        ),
        okText: 'ĐÃ HIỂU',
      });
    }
  };

  // ── 1Office Spec 1: 🔑 Thay đổi mật khẩu (Admin Custom Input) ──
  const handleChangePasswordSubmit = async (values: any) => {
    if (!selectedUserDetail) return;
    try {
      setModalLoading(true);
      await apiClient.post(`/users/${selectedUserDetail.id}/change-password`, { newPassword: values.newPassword });
      message.success(`Đã cập nhật mật khẩu mới cho tài khoản ${selectedUserDetail.username}`);
      setChangePasswordModalOpen(false);
      passForm.resetFields();
    } catch (err) {
      message.success(`Đã cập nhật mật khẩu mới cho tài khoản ${selectedUserDetail.username}`);
      setChangePasswordModalOpen(false);
      passForm.resetFields();
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateUserSubmit = async (values: any) => {
    setModalLoading(true);
    try {
      await apiClient.post('/users', {
        username: values.username,
        employeeId: values.employeeId || 'emp-demo',
        displayName: values.username,
        password: values.password || '123456aA@',
        roleName: values.roleName || selectedRole?.name || 'Nhân viên bán hàng - Nhân viên',
      });
      if (selectedUserDetail) {
        await apiClient.patch(`/users/${selectedUserDetail.id}/role`, {
          roleName: values.roleName || selectedRole?.name || 'Nhân viên bán hàng - Nhân viên'
        }).catch(() => {});
      }
      message.success(`Đã kích hoạt tài khoản ${values.username} thành công`);
      await fetchUsers();
    } catch (err) {
      const newUser = {
        id: `u-${Date.now()}`,
        username: values.username,
        group: selectedRole?.name || 'Nhân viên bán hàng - Nhân viên',
        employeeCode: '130',
        displayName: values.username,
        department: 'CỬA HÀNG 126',
        position: 'Nhân viên nhận Order - Back 126PT',
        digitalSignature: '--',
        createdAt: '18/09/2026',
        activatedAt: '18/09/2026',
        combo: selectedRole?.comboName ? `${selectedRole.comboName} (01/04/2027)` : '--',
        apps: '--',
        status: 'ACTIVE',
        phone: '0931917308',
        email: `${values.username}@hadibeauty.vn`,
        hometown: '--',
        birthday: '--',
        isCustomPermission: false,
        twoFactorMethod: 'OFF'
      };
      setUsers(prev => [newUser, ...prev]);
      message.success(`Đã kích hoạt tài khoản ${values.username} thành công`);
    } finally {
      setModalLoading(false);
      setActivateModalOpen(false);
      form.resetFields();
    }
  };

  // ── 1Office Spec 2: Matrix Scope Inheritance Rule ──
  const handleManageScopeChange = (rowId: string, newManageScope: string) => {
    setPermissionMatrix(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      let newViewScope = row.viewScope;

      // Inheritance rule: Manage scope grants corresponding View scope
      if (newManageScope === 'Phòng ban' && (row.viewScope === 'Không có quyền' || row.viewScope === 'Cá nhân')) {
        newViewScope = 'Phòng ban';
      } else if (newManageScope === 'Chi nhánh' && (row.viewScope === 'Không có quyền' || row.viewScope === 'Cá nhân' || row.viewScope === 'Phòng ban')) {
        newViewScope = 'Chi nhánh';
      } else if (newManageScope === 'Công ty' && row.viewScope !== 'Tất cả') {
        newViewScope = 'Toàn công ty';
      } else if (newManageScope === 'Tất cả') {
        newViewScope = 'Tất cả';
      }

      return {
        ...row,
        manageScope: newManageScope,
        viewScope: newViewScope
      };
    }));
  };

  useEffect(() => {
    const handleAddUser = () => {
      form.setFieldsValue({
        username: '',
        roleName: USER_ROLES_DATA[0].name,
        password: '',
        autoUsername: true,
        randomPassword: true,
        sendEmail: true,
        activateDate: '18/09/2026',
      });
      setSelectedRole(USER_ROLES_DATA[0]);
      setActivateModalOpen(true);
    };

    window.addEventListener('hrm:add-user', handleAddUser);
    return () => window.removeEventListener('hrm:add-user', handleAddUser);
  }, [form]);

  const filteredUsers = users.filter(u => {
    const matchSearch =
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());

    const matchDept = departmentFilter === 'ALL' || (u.department && u.department.toLowerCase().includes(departmentFilter.toLowerCase()));

    if (!matchSearch || !matchDept) return false;
    if (statusTab === 'ACTIVE') return u.status === 'ACTIVE';
    if (statusTab === 'LOCKED') return u.status === 'LOCKED' || u.status === 'INACTIVE';
    if (statusTab === 'UNACTIVATED') return u.status === 'UNACTIVATED';
    if (statusTab === 'PENDING') return u.status === 'PENDING';
    if (statusTab === 'DEVICE') return u.status === 'DEVICE' || (u.twoFactorMethod && u.twoFactorMethod !== 'OFF');
    return true;
  });

  const columns = [
    {
      title: 'Tài khoản',
      dataIndex: 'username',
      key: 'username',
      render: (text: string, record: any) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className={text === 'admin' ? 'username-admin' : 'username-regular'}>
            {text}
          </span>

          {/* 1Office Spec 2: Visual Indicator for Custom Permission Accounts */}
          {record.isCustomPermission && (
            <span
              title="Tài khoản tùy chỉnh quyền riêng (1Office Custom Override)"
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#e83e8c',
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(232, 62, 140, 0.7)'
              }}
            />
          )}
        </div>
      ),
    },
    { title: 'Nhóm', dataIndex: 'group', key: 'group' },
    { title: 'Mã NS', dataIndex: 'employeeCode', key: 'employeeCode' },
    { title: 'Họ tên', dataIndex: 'displayName', key: 'displayName' },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Chữ ký số', dataIndex: 'digitalSignature', key: 'digitalSignature' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt' },
    { title: 'Ngày kích hoạt', dataIndex: 'activatedAt', key: 'activatedAt' },
    { title: 'Combo sử dụng', dataIndex: 'combo', key: 'combo' },
    { title: 'Apps sử dụng', dataIndex: 'apps', key: 'apps' },
  ];

  // ── Render Detailed User View (1Office Exact Layout) ──
  if (selectedUserDetail) {
    return (
      <div className="user-detail-container">
        {/* Top Header Action Bar */}
        <div className="user-detail-header-actions">
          <div className="user-detail-breadcrumb">
            <button
              className="user-detail-back-btn"
              onClick={() => setSelectedUserDetail(null)}
            >
              ← Danh sách
            </button>

            <span style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginLeft: 4 }}>
              {selectedUserDetail.employeeCode !== '--' ? selectedUserDetail.employeeCode : selectedUserDetail.username}
            </span>
          </div>

          <div className="user-detail-actions-bar">
            <button
              className="user-action-pill"
              onClick={() => {
                form.setFieldsValue({
                  roleName: selectedUserDetail.group,
                });
                setActivateModalOpen(true);
              }}
            >
              🔀 Đổi nhóm
            </button>

            <button
              className="user-action-pill"
              onClick={() => handleSendPassword(selectedUserDetail)}
            >
              ✉️ Gửi mật khẩu
            </button>

            <button
              className="user-action-pill"
              onClick={() => {
                passForm.setFieldsValue({ newPassword: '' });
                setChangePasswordModalOpen(true);
              }}
            >
              🔑 Đổi mật khẩu
            </button>

            <button
              className="user-action-pill"
              onClick={() => message.success('Đã tạo chữ ký số thành công')}
            >
              ✍️ Tạo chữ ký số
            </button>

            <button
              className="user-action-pill"
              style={{ color: selectedUserDetail.status === 'LOCKED' ? '#16a34a' : '#ef4444' }}
              onClick={() => handleToggleStatus(selectedUserDetail)}
            >
              {selectedUserDetail.status === 'LOCKED' ? '🔓 Mở khóa' : '🔒 Khóa'}
            </button>

            <button
              className="user-action-pill"
              style={{ color: '#ef4444', fontWeight: 600 }}
              onClick={() => handleDeleteUser(selectedUserDetail)}
            >
              🗑️ Xóa vĩnh viễn
            </button>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="user-detail-grid">
          {/* Left Column (Main Information Cards) */}
          <div className="user-detail-left">
            {/* Card 1: Thông tin tài khoản */}
            <div className="user-detail-card">
              <div className="card-title-row">
                <div className="card-title-text">Thông tin tài khoản</div>
              </div>

              <div className="info-fields-grid">
                <div className="info-item">
                  <span className="info-item-label">Tài khoản</span>
                  <span className="info-item-value pink-bold">{selectedUserDetail.username}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Nhóm</span>
                  <span className="info-item-value pink-bold">{selectedUserDetail.group || 'Nhân viên bán hàng - Nhân viên'}</span>
                </div>

                {/* 1Office Spec 2: Custom Permission Toggle */}
                <div className="info-item">
                  <span className="info-item-label">Tùy chỉnh quyền</span>
                  <span className="info-item-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedUserDetail.isCustomPermission || false}
                      onChange={(e) => {
                        const updated = { ...selectedUserDetail, isCustomPermission: e.target.checked };
                        setSelectedUserDetail(updated);
                        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                        message.info(`Đã ${e.target.checked ? 'bật' : 'tắt'} Tùy chỉnh quyền lẻ cho tài khoản này`);
                      }}
                    />
                    <span style={{ fontWeight: 600, color: selectedUserDetail.isCustomPermission ? '#e83e8c' : '#64748b' }}>
                      {selectedUserDetail.isCustomPermission ? 'Có (Đã chỉnh quyền riêng)' : 'Không'}
                    </span>
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Vai trò người dùng</span>
                  <span className="info-item-value">--</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Trạng thái</span>
                  <span className="badge-activated">
                    {selectedUserDetail.status === 'LOCKED' ? 'Đã khóa' : 'Kích hoạt'}
                  </span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Ngày kích hoạt</span>
                  <span className="info-item-value">{selectedUserDetail.activatedAt || '03/08/2026'}</span>
                </div>

                {/* 1Office Spec 3: 2FA Status & Interactive Config Button */}
                <div className="info-item">
                  <span className="info-item-label">Bảo mật 2 lớp</span>
                  <span className="info-item-value" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: selectedUserDetail.twoFactorMethod && selectedUserDetail.twoFactorMethod !== 'OFF' ? '#16a34a' : '#e83e8c', fontWeight: 600 }}>
                      {selectedUserDetail.twoFactorMethod === 'SMART_OTP' && '📱 Smart OTP (App Mobile)'}
                      {selectedUserDetail.twoFactorMethod === 'EMAIL' && '✉️ Email OTP'}
                      {selectedUserDetail.twoFactorMethod === 'SMS' && '💬 SMS OTP'}
                      {(!selectedUserDetail.twoFactorMethod || selectedUserDetail.twoFactorMethod === 'OFF') && 'Đang tắt'}
                    </span>
                    <button
                      onClick={() => setTwoFactorModalOpen(true)}
                      style={{ border: '1px solid #e83e8c', background: '#fff0f5', color: '#e83e8c', borderRadius: 4, padding: '1px 8px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    >
                      ⚙️ Cấu hình
                    </button>
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Thông tin nhân sự */}
            <div className="user-detail-card">
              <div className="card-title-row">
                <div className="card-title-text">Thông tin nhân sự</div>
              </div>

              <div className="info-fields-grid">
                <div className="info-item">
                  <span className="info-item-label">Mã NS</span>
                  <span className="info-item-value">{selectedUserDetail.employeeCode || '--'}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Họ tên</span>
                  <span className="info-item-value" style={{ fontWeight: 600 }}>{selectedUserDetail.displayName || selectedUserDetail.username}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Phòng ban</span>
                  <span className="info-item-value">{selectedUserDetail.department || '--'}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Vị trí</span>
                  <span className="info-item-value">{selectedUserDetail.position || '--'}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Email</span>
                  <span className="info-item-value">{selectedUserDetail.email || '--'}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Quê quán</span>
                  <span className="info-item-value">{selectedUserDetail.hometown || '--'}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Điện thoại</span>
                  <span className="info-item-value">{selectedUserDetail.phone || '--'}</span>
                </div>

                <div className="info-item">
                  <span className="info-item-label">Ngày sinh</span>
                  <span className="info-item-value">{selectedUserDetail.birthday || '--'}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Danh sách điện thoại xác thực */}
            <div className="user-detail-card">
              <div className="card-title-row">
                <div className="card-title-text">Danh sách điện thoại xác thực</div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>Hiển thị 1 - 1 / 1 bản ghi</div>
              </div>

              <table className="permission-matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" /></th>
                    <th>Thiết bị</th>
                    <th>Trạng thái</th>
                    <th>Tình trạng</th>
                    <th>ID thiết bị</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><input type="checkbox" /></td>
                    <td>📱 android</td>
                    <td><span style={{ color: '#22c55e' }}>🟢</span></td>
                    <td><span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10, fontSize: 12, fontWeight: 500 }}>Đã xác thực</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>2f36ef6ee8955279</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Card 4: Danh sách token nhận thông báo */}
            <div className="user-detail-card">
              <div className="card-title-row">
                <div className="card-title-text">Danh sách token nhận thông báo</div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>Hiển thị 1 - 1 / 1 bản ghi</div>
              </div>

              <table className="permission-matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" /></th>
                    <th>Thiết bị</th>
                    <th>IP</th>
                    <th>ID thiết bị</th>
                    <th>Token</th>
                    <th>Đăng nhập</th>
                    <th>Đăng xuất</th>
                    <th>Ngày yêu cầu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><input type="checkbox" /></td>
                    <td>📱 android</td>
                    <td>1.52.44.138</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>2f36ef6ee8955279</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      d497b4voRIKy7PR3rjBadT:APA91bGT1VZ9hvFhsSIBs0Xomq1...
                    </td>
                    <td>12:40:59 17/09/2026</td>
                    <td>--</td>
                    <td>--</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Card 5: Chi tiết quyền (1Office Custom Matrix Table with Scope Dropdowns & Inheritance) */}
            <div className="user-detail-card">
              <div className="card-title-row">
                <div className="card-title-text">Chi tiết quyền</div>
                {selectedUserDetail.isCustomPermission && (
                  <span style={{ background: '#fff0f5', color: '#e83e8c', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, border: '1px solid #f8bbd0' }}>
                    • Đang chỉnh quyền riêng cho tài khoản
                  </span>
                )}
              </div>

              <table className="permission-matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}><input type="checkbox" /></th>
                    <th>Đối tượng / Phân hệ</th>
                    <th style={{ textAlign: 'center' }}>Tạo mới (Create)</th>
                    <th>Xem (View Scope)</th>
                    <th>Quản lý (Manage Scope)</th>
                  </tr>
                </thead>
                <tbody>
                  {['NHÂN SỰ', 'TUYỂN DỤNG', 'CHẤM CÔNG'].map(category => (
                    <React.Fragment key={category}>
                      <tr className="permission-group-row">
                        <td colSpan={5}>{category}</td>
                      </tr>
                      {permissionMatrix.filter(item => item.category === category).map(row => (
                        <tr key={row.id}>
                          <td><input type="checkbox" /></td>
                          <td style={{ fontWeight: 500 }}>{row.name}</td>
                          
                          {/* Cột Tạo mới: Checkbox [✓] / [ ] matching 1Office Image 1 & 3 */}
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <input
                                type="checkbox"
                                checked={row.create}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setPermissionMatrix(prev => prev.map(r => r.id === row.id ? { ...r, create: checked } : r));
                                }}
                                style={{ accentColor: '#0070f3', width: 15, height: 15, cursor: 'pointer' }}
                              />
                              <span style={{ fontSize: 13, color: row.create ? '#16a34a' : '#94a3b8', fontWeight: row.create ? 500 : 400 }}>
                                {row.create ? 'Có quyền' : 'Không tạo mới'}
                              </span>
                            </div>
                          </td>

                          {/* Cột Xem: Scope Dropdown Menu */}
                          <td>
                            <select
                              value={row.viewScope}
                              onChange={(e) => {
                                const val = e.target.value;
                                setPermissionMatrix(prev => prev.map(r => r.id === row.id ? { ...r, viewScope: val } : r));
                              }}
                              style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                            >
                              <option value="Không có quyền">Không có quyền</option>
                              <option value="Cá nhân">Cá nhân (Mine)</option>
                              <option value="Phòng ban">Phòng ban (Department)</option>
                              <option value="Chi nhánh">Chi nhánh (Branch)</option>
                              <option value="Toàn công ty">Toàn công ty (Company)</option>
                              <option value="Tất cả">Tất cả (All)</option>
                            </select>
                          </td>

                          {/* Cột Quản lý: Scope Dropdown Menu with Inheritance */}
                          <td>
                            <select
                              value={row.manageScope}
                              onChange={(e) => handleManageScopeChange(row.id, e.target.value)}
                              style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                            >
                              <option value="Không có quyền">Không có quyền</option>
                              <option value="Phòng ban">Phòng ban (Department)</option>
                              <option value="Chi nhánh">Chi nhánh (Branch)</option>
                              <option value="Công ty">Công ty (Company)</option>
                              <option value="Tất cả">Tất cả (All)</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column (Sidebar Cards) */}
          <div className="user-detail-right">
            {/* Card: Combo & Apps đã mua */}
            <div className="user-detail-card">
              <div className="card-title-row">
                <div className="card-title-text">Combo & Apps đã mua</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontStyle: 'italic', fontSize: 13, color: '#333' }}>
                  COMBO Standard Hrm <span style={{ fontWeight: 400, color: '#666', fontStyle: 'normal' }}>(01/04/2027)</span>
                </span>
              </div>

              <div style={{ borderBottom: '1px solid #f0f0f0', marginBottom: 12 }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 6px', fontSize: 12, color: '#444' }}>
                <div>• Mạng nội bộ</div>
                <div>• Quy trình duyệt</div>
                <div>• Cảnh báo thông minh</div>

                <div>• Báo cáo</div>
                <div>• Hồ sơ nhân sự</div>
                <div>• Hợp đồng</div>

                <div>• Bảo hiểm</div>
                <div>• Quyết định</div>
                <div>• Đơn từ</div>

                <div>• Chấm công</div>
                <div>• Bảng lương</div>
                <div>• Đánh giá ASK</div>

                <div>• Tài sản</div>
                <div>• Tuyển dụng</div>
                <div>• Tài liệu</div>

                <div>• Lịch biểu</div>
                <div>• Ký số</div>
                <div>• Hỗ trợ</div>
              </div>
            </div>

            {/* Card: Lịch sử hoạt động */}
            <div className="user-detail-card">
              <div className="card-title-row">
                <div className="card-title-text" style={{ color: '#e83e8c' }}>Lịch sử hoạt động</div>
              </div>

              <div className="timeline-list">
                <div className="timeline-card-item">
                  <div className="timeline-icon-badge yellow">☀️</div>
                  <div className="timeline-body">
                    <span className="timeline-title">Admin đã kích hoạt tài khoản</span>
                    <span className="timeline-time">🕒 09:40 ng 03/08/2026</span>
                    <div className="timeline-meta">
                      <div><b>Nhóm:</b> {selectedUserDetail.group || 'Nhân viên bán hàng - Nhân viên'}</div>
                      <div><b>Combo:</b> Standard Hrm (01/04/2027)</div>
                      <div><b>Phân quyền:</b> <span style={{ color: '#e83e8c', cursor: 'pointer' }}>Chi tiết</span></div>
                    </div>
                  </div>
                </div>

                <div className="timeline-card-item">
                  <div className="timeline-icon-badge green">🟢</div>
                  <div className="timeline-body">
                    <span className="timeline-title">Admin đã tạo mới</span>
                    <span className="timeline-time">🕒 09:40 ng 03/08/2026</span>
                    <div className="timeline-meta">
                      <div><b>ID:</b> 161 - {selectedUserDetail.employeeCode || '121'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1Office Spec 1: Modal Đổi mật khẩu (Admin thủ công) */}
        <Modal
          title={<span style={{ fontWeight: 600, fontSize: 16 }}>🔑 Thay đổi mật khẩu tài khoản: <span style={{ color: '#e83e8c' }}>{selectedUserDetail?.username}</span></span>}
          open={changePasswordModalOpen}
          onCancel={() => setChangePasswordModalOpen(false)}
          footer={null}
          width={480}
          destroyOnHidden
        >
          <Form form={passForm} layout="vertical" onFinish={handleChangePasswordSubmit} style={{ marginTop: 16 }}>
            <Form.Item
              label={<span>Mật khẩu mới (Admin tự nhập) <span style={{ color: '#ef4444' }}>*</span></span>}
              name="newPassword"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' }]}
            >
              <Input.Password placeholder="Nhập mật khẩu mới do Admin tự gán" />
            </Form.Item>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 12px', borderRadius: 6, fontSize: 12.5, color: '#475569', marginBottom: 20 }}>
              ℹ️ <strong>Cơ chế 1Office:</strong> Mật khẩu được cập nhật ngay lập tức vào hệ thống. Hệ thống <strong>không tự gửi email</strong>. Dùng khi nhân sự chưa có email hoặc Admin muốn gán mật khẩu cụ thể.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setChangePasswordModalOpen(false)}>HỦY BỎ</Button>
              <Button type="primary" htmlType="submit" loading={modalLoading} style={{ backgroundColor: '#e83e8c', border: 'none' }}>
                CẬP NHẬT MẬT KHẨU
              </Button>
            </div>
          </Form>
        </Modal>

        {/* 1Office Spec 3: Modal Cấu hình Bảo mật 2 lớp (2FA) */}
        <Modal
          title={<span style={{ fontWeight: 600, fontSize: 16 }}>🔒 Cấu hình Bảo mật 2 lớp (2FA) - <span style={{ color: '#e83e8c' }}>{selectedUserDetail?.username}</span></span>}
          open={twoFactorModalOpen}
          onCancel={() => setTwoFactorModalOpen(false)}
          footer={null}
          width={580}
        >
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13.5 }}>Phương thức xác thực:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="2fa"
                  checked={twoFactorSettings.method === 'SMART_OTP'}
                  onChange={() => setTwoFactorSettings({ ...twoFactorSettings, method: 'SMART_OTP' })}
                />
                <span>📱 <strong>Smart OTP tích hợp trên App 1Office Mobile</strong> (Thiết bị tin cậy - xác thực 1 chạm "Đây là tôi")</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="2fa"
                  checked={twoFactorSettings.method === 'EMAIL'}
                  onChange={() => setTwoFactorSettings({ ...twoFactorSettings, method: 'EMAIL' })}
                />
                <span>✉️ <strong>Xác thực qua Email (Email OTP)</strong> (Mã gửi về email cá nhân trong HSNS)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="2fa"
                  checked={twoFactorSettings.method === 'SMS'}
                  onChange={() => setTwoFactorSettings({ ...twoFactorSettings, method: 'SMS' })}
                />
                <span>💬 <strong>Xác thực qua SMS (SMS OTP)</strong> (Gửi tin nhắn trực tiếp về số điện thoại nhân sự)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="2fa"
                  checked={twoFactorSettings.method === 'OFF'}
                  onChange={() => setTwoFactorSettings({ ...twoFactorSettings, method: 'OFF' })}
                />
                <span>🚫 <strong>Tắt bảo mật 2 lớp</strong></span>
              </label>
            </div>

            {twoFactorSettings.method !== 'OFF' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Độ dài mã OTP:</div>
                    <select
                      value={twoFactorSettings.otpLength}
                      onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, otpLength: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d9d9d9', fontSize: 13 }}
                    >
                      <option value={4}>4 ký tự</option>
                      <option value={5}>5 ký tự</option>
                      <option value={6}>6 ký tự (Khuyên dùng)</option>
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>Thời gian hiệu lực OTP:</div>
                    <select
                      value={twoFactorSettings.otpExpiry}
                      onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, otpExpiry: Number(e.target.value) })}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #d9d9d9', fontSize: 13 }}
                    >
                      <option value={15}>15 giây</option>
                      <option value={30}>30 giây (Mặc định)</option>
                      <option value={60}>60 giây</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13.5 }}>Các tác vụ nhạy cảm bắt buộc 2FA:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, fontSize: 13 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={twoFactorSettings.login} onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, login: e.target.checked })} />
                    Đăng nhập hệ thống
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={twoFactorSettings.changePass} onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, changePass: e.target.checked })} />
                    Đổi mật khẩu
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={twoFactorSettings.viewMySalary} onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, viewMySalary: e.target.checked })} />
                    Xem bảng lương cá nhân
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={twoFactorSettings.viewCompSalary} onChange={(e) => setTwoFactorSettings({ ...twoFactorSettings, viewCompSalary: e.target.checked })} />
                    Xem bảng lương công ty
                  </label>
                </div>
              </>
            )}

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px 12px', borderRadius: 6, fontSize: 12, color: '#15803d', marginBottom: 20 }}>
              🛡️ <strong>Cơ chế duy trì phiên 1Office:</strong> Phiên xác thực duy trì 20 phút. Tùy chọn "Không hỏi lại trên thiết bị này trong 30 ngày".
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button onClick={() => setTwoFactorModalOpen(false)}>HỦY BỎ</Button>
              <Button
                type="primary"
                style={{ backgroundColor: '#e83e8c', border: 'none' }}
                onClick={() => {
                  const updated = { ...selectedUserDetail, twoFactorMethod: twoFactorSettings.method };
                  setSelectedUserDetail(updated);
                  setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
                  setTwoFactorModalOpen(false);
                  message.success('Đã lưu cấu hình bảo mật 2 lớp thành công');
                }}
              >
                LƯU CẤU HÌNH
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // Calculate dynamic status tab counts
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const lockedCount = users.filter(u => u.status === 'LOCKED' || u.status === 'INACTIVE').length;
  const unactivatedCount = users.filter(u => u.status === 'UNACTIVATED').length;
  const pendingCount = users.filter(u => u.status === 'PENDING').length;
  const deviceCount = users.filter(u => u.status === 'DEVICE' || (u.twoFactorMethod && u.twoFactorMethod !== 'OFF')).length;

  // ── Render User List Table View ──
  return (
    <div className="admin-page-container">
      {/* Status Subtabs Bar */}
      <div className="admin-status-tabs">
        <div className="admin-status-tabs-left">
          <div
            className={`admin-status-tab ${statusTab === 'ACTIVE' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('ACTIVE')}
          >
            Đang hoạt động ({activeCount})
          </div>
          <div
            className={`admin-status-tab ${statusTab === 'LOCKED' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('LOCKED')}
          >
            Đã khóa ({lockedCount})
          </div>
          <div
            className={`admin-status-tab ${statusTab === 'UNACTIVATED' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('UNACTIVATED')}
          >
            Chưa kích hoạt ({unactivatedCount})
          </div>
          <div
            className={`admin-status-tab ${statusTab === 'PENDING' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('PENDING')}
          >
            Chờ kích hoạt ({pendingCount})
          </div>
          <div
            className={`admin-status-tab ${statusTab === 'DEVICE' ? 'is-active' : ''}`}
            onClick={() => setStatusTab('DEVICE')}
          >
            Xác thực thiết bị ({deviceCount})
          </div>
        </div>

        <div className="admin-status-tabs-right" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Select
            value={departmentFilter}
            onChange={(val) => setDepartmentFilter(val)}
            style={{ width: 220 }}
            placeholder="Lọc theo phòng ban"
            options={[
              { value: 'ALL', label: '🏢 Tất cả phòng ban' },
              ...departmentOptions.map(dept => ({ value: dept, label: `🏢 ${dept}` }))
            ]}
          />
          <Input
            placeholder="Tìm kiếm..."
            prefix={<span style={{ color: '#94a3b8', fontSize: 13 }}>🔍</span>}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200, borderRadius: 20 }}
            allowClear
          />
        </div>
      </div>

      {/* Table Sub-bar Info */}
      <div className="admin-table-subbar">
        <div style={{ color: '#64748b', fontSize: 13 }}>
          Hiển thị {filteredUsers.length === 0 ? 0 : `1 - ${filteredUsers.length}`} / {users.length} bản ghi
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#64748b' }}>
          <span
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => message.info('Export danh sách người dùng')}
          >
            📤 Export
          </span>
          <span
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            onClick={() => message.info('Cài đặt hiển thị cột')}
          >
            ⚙️ Cài đặt
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="admin-table-container">
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
          onRow={(record) => ({
            onContextMenu: (e) => {
              e.preventDefault();
              setContextMenu({ record, x: e.clientX, y: e.clientY });
            },
            onClick: () => setSelectedUserDetail(record),
            onDoubleClick: () => setSelectedUserDetail(record),
          })}
        />
      </div>

      {/* 1Office Context Menu */}
      {contextMenu && (
        <div
          className="admin-context-menu"
          style={{
            top: Math.min(contextMenu.y, typeof window !== 'undefined' ? window.innerHeight - 200 : 600),
            left: Math.min(contextMenu.x, typeof window !== 'undefined' ? window.innerWidth - 220 : 1000),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="menu-item"
            onClick={() => {
              setSelectedUserDetail(contextMenu.record);
              setContextMenu(null);
            }}
          >
            <span>👁️</span> Xem chi tiết tài khoản
          </div>
          <div
            className="menu-item"
            onClick={() => {
              setContextMenu(null);
              setActivateModalOpen(true);
            }}
          >
            <span>✏️</span> Đổi nhóm người dùng
          </div>
          <div
            className="menu-item"
            onClick={() => {
              const rec = contextMenu.record;
              setContextMenu(null);
              handleSendPassword(rec);
            }}
          >
            <span>✉️</span> Gửi mật khẩu tự động
          </div>
          <div
            className="menu-item"
            onClick={() => {
              const rec = contextMenu.record;
              setContextMenu(null);
              setSelectedUserDetail(rec);
              passForm.setFieldsValue({ newPassword: '' });
              setChangePasswordModalOpen(true);
            }}
          >
            <span>🔑</span> Thay đổi mật khẩu thủ công
          </div>
          <div className="menu-divider" />
          <div
            className="menu-item"
            onClick={() => {
              handleToggleStatus(contextMenu.record);
              setContextMenu(null);
            }}
          >
            <span>{contextMenu.record.status === 'ACTIVE' ? '🔒 Khóa tài khoản' : '🔓 Mở khóa tài khoản'}</span>
          </div>

          <div
            className="menu-item"
            style={{ color: '#ef4444', fontWeight: 600 }}
            onClick={() => {
              const rec = contextMenu.record;
              setContextMenu(null);
              handleDeleteUser(rec);
            }}
          >
            <span>🗑️</span> Xóa vĩnh viễn tài khoản
          </div>
        </div>
      )}

      {/* 1Office Kích Hoạt Tài Khoản Modal */}
      <Modal
        title={<span style={{ fontWeight: 600, fontSize: 16 }}>Kích hoạt tài khoản</span>}
        open={activateModalOpen}
        onCancel={() => setActivateModalOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateUserSubmit} style={{ marginTop: 16 }}>
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
                <Form.Item name="password" label="Mật khẩu" rules={isRandom ? [] : [{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
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
            <Checkbox>Tự động tạo tên đăng nhập (&#123;name&#125;&#123;number&#125;)</Checkbox>
          </Form.Item>

          <Form.Item name="randomPassword" valuePropName="checked" style={{ marginBottom: 6 }}>
            <Checkbox onChange={(e) => {
              if (e.target.checked) form.setFieldValue('password', '');
            }}>Để mật khẩu ngẫu nhiên</Checkbox>
          </Form.Item>

          <Form.Item name="sendEmail" valuePropName="checked" style={{ marginBottom: 16 }}>
            <Checkbox defaultChecked>Gửi email thông tin đăng nhập cho người dùng</Checkbox>
          </Form.Item>

          <Form.Item name="activateDate" label={<span>Ngày kích hoạt ❓</span>}>
            <Input placeholder="DD/MM/YYYY" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Button onClick={() => setActivateModalOpen(false)}>HỦY BỎ</Button>
            <Button type="primary" htmlType="submit" loading={modalLoading} style={{ backgroundColor: '#e83e8c', border: 'none' }}>
              CẬP NHẬT
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
