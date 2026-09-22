'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button, Tag, Modal, Form, Input, Select, Upload, message, Spin } from 'antd';
import {
  EditOutlined,
  UploadOutlined,
  UserOutlined,
  CheckOutlined,
  MinusOutlined,
  PlusOutlined,
  FilterOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  DollarCircleOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

export function EmployeeProfileView() {
  const { user } = useAuth();
  const displayName = user?.displayName || user?.username || 'Nhân viên';
  const username = user?.username || '';
  const employeeId = user?.employeeId;

  const [activeTab, setActiveTab] = useState('general');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Collapse states for cards
  const [collapseProgress, setCollapseProgress] = useState(false);
  const [collapseWorkHistory, setCollapseWorkHistory] = useState(false);
  const [collapseTraining, setCollapseTraining] = useState(false);
  const [collapseKpi, setCollapseKpi] = useState(false);
  const [collapseFinance, setCollapseFinance] = useState(false);

  // Real Database Profile state
  const [profileData, setProfileData] = useState({
    name: displayName,
    email: user?.username ? `${user.username}@company.vn` : '--',
    phone: '--',
    dob: '--',
    hometown: '--',
    gender: 'Khác',
    marital: '--',
    employeeCode: '--',
    startDate: '--',
    department: '--',
    position: '--',
    status: 'Đang làm việc',
  });

  const fetchProfile = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/employees/${employeeId}`);
      if (res.data) {
        const emp = res.data;
        setProfileData({
          name: emp.name || displayName,
          email: emp.email || (user?.username ? `${user.username}@company.vn` : '--'),
          phone: emp.phone || '--',
          dob: emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('vi-VN') : '--',
          hometown: emp.originAddress || emp.address || '--',
          gender: emp.gender === 'MALE' ? 'Nam' : emp.gender === 'FEMALE' ? 'Nữ' : 'Khác',
          marital: emp.maritalStatus || '--',
          employeeCode: emp.code || '--',
          startDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('vi-VN') : '--',
          department: emp.department?.name || '--',
          position: emp.position?.name || '--',
          status: emp.status === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ',
        });
      }
    } catch (_) {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }, [employeeId, displayName, user?.username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const subTabs = [
    { key: 'general', label: 'Thông tin chung' },
    { key: 'resume', label: 'Sơ yếu lý lịch' },
    { key: 'contract', label: 'Công việc & Hợp đồng' },
    { key: 'insurance', label: 'Bảo hiểm & Phúc lợi' },
    { key: 'salary', label: 'Lương & Phụ cấp' },
    { key: 'leave', label: 'Thông tin phép' },
    { key: 'comp', label: 'Thông tin nghỉ bù' },
  ];

  const onboardingDocs = [
    'Ảnh cá nhân',
    'Bản sao giấy khai sinh',
    'Bản sao sổ hộ khẩu',
    'Bằng cấp, trình độ chuyên môn',
    'Bảo hiểm xã hội',
    'Cam kết chính thức',
    'Cam kết làm việc',
    'Cam kết thai sản',
    'Cam kết thử việc',
    'CMT/Căn cước/HC',
    'Cơ cấu lương',
  ];

  const handleUpdateSubmit = async (values: any) => {
    try {
      if (employeeId) {
        await apiClient.patch(`/employees/${employeeId}`, {
          email: values.email,
          phone: values.phone,
          address: values.hometown,
          gender: values.gender === 'Nam' ? 'MALE' : values.gender === 'Nữ' ? 'FEMALE' : 'OTHER',
          maritalStatus: values.marital,
        });
      }
      setProfileData((prev) => ({
        ...prev,
        ...values,
      }));
      setUpdateModalOpen(false);
      message.success('Cập nhật thông tin hồ sơ thành công vào cơ sở dữ liệu!');
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi cập nhật hồ sơ.');
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 8px 40px' }}>
      {/* 1Office Top Heading matching Screenshot 4: test1 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          {profileData.name}
        </h1>
      </div>

      {/* Subtabs bar matching Screenshot 4 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 18,
          overflowX: 'auto',
        }}
      >
        <div style={{ display: 'flex', gap: 20 }}>
          {subTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '10px 2px',
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ef4444' : '#64748b',
                  borderBottom: isActive ? '2.5px solid #ef4444' : '2.5px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action buttons on the right: [Cập nhật] [Tải lên] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 6 }}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setUpdateModalOpen(true)}
            style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
          >
            Cập nhật
          </Button>
          <Button
            size="small"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalOpen(true)}
            style={{ borderRadius: 6, fontSize: 12, fontWeight: 600 }}
          >
            Tải lên
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center' }}>
          <Spin size="large" />
        </div>
      ) : (
        /* 3-Column Layout matching Screenshot 4 */
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
          {/* ================= COLUMN 1 (LEFT) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Box 1: Thông tin nhân sự cá nhân từ Real DB */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: 20 }}>
              {/* Avatar & Header */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 20 }}>
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <UserOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{profileData.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>
                    {profileData.status}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{profileData.employeeCode}</span>
                </div>
              </div>

              {/* Field rows from Database */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>✉ Email</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{profileData.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>📞 Điện thoại</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{profileData.phone}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>🎂 Ngày sinh</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{profileData.dob}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>🏠 Nguyên quán</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{profileData.hometown}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>⚧ Giới tính</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{profileData.gender}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>💍 Hôn nhân</span>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{profileData.marital}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>🌐 Tài khoản 1Office</span>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>{username}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Quá trình làm việc matching Screenshot 4 */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: collapseWorkHistory ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Quá trình làm việc
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FilterOutlined style={{ fontSize: 13, color: '#94a3b8' }} />
                  <Button
                    type="text"
                    size="small"
                    icon={collapseWorkHistory ? <PlusOutlined /> : <MinusOutlined />}
                    onClick={() => setCollapseWorkHistory(!collapseWorkHistory)}
                    style={{ color: '#94a3b8' }}
                  />
                </div>
              </div>

              {!collapseWorkHistory && (
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: '#16a34a',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      🌱
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>
                          {profileData.department}
                        </span>
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>
                          {profileData.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                        Ngày bắt đầu làm việc: <strong style={{ color: '#0f172a' }}>{profileData.startDate}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Box 3: Đào tạo matching Screenshot 4 */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: collapseTraining ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Đào tạo
                </h3>
                <Button
                  type="text"
                  size="small"
                  icon={collapseTraining ? <PlusOutlined /> : <MinusOutlined />}
                  onClick={() => setCollapseTraining(!collapseTraining)}
                  style={{ color: '#94a3b8' }}
                />
              </div>
              {!collapseTraining && (
                <div style={{ padding: '24px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 12.5 }}>
                  Chưa có dữ liệu khóa đào tạo
                </div>
              )}
            </div>
          </div>

          {/* ================= COLUMN 2 (MIDDLE) ================= */}
          <div>
            {/* Card: Tiến trình tiếp nhận hồ sơ matching Screenshot 4 */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: collapseProgress ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Tiến trình tiếp nhận hồ sơ
                </h3>
                <Button
                  type="text"
                  size="small"
                  icon={collapseProgress ? <PlusOutlined /> : <MinusOutlined />}
                  onClick={() => setCollapseProgress(!collapseProgress)}
                  style={{ color: '#94a3b8' }}
                />
              </div>

              {!collapseProgress && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {onboardingDocs.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '11px 18px',
                        borderBottom: idx < onboardingDocs.length - 1 ? '1px solid #f8fafc' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 12.5,
                        color: '#334155',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                    >
                      <CheckOutlined style={{ fontSize: 11, color: '#16a34a', strokeWidth: 2 }} />
                      <span style={{ fontWeight: 500 }}>{doc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ================= COLUMN 3 (RIGHT) ================= */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Card 1: Hiệu quả công việc matching Screenshot 4 */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: collapseKpi ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Hiệu quả công việc
                </h3>
                <Button
                  type="text"
                  size="small"
                  icon={collapseKpi ? <PlusOutlined /> : <MinusOutlined />}
                  onClick={() => setCollapseKpi(!collapseKpi)}
                  style={{ color: '#94a3b8' }}
                />
              </div>

              {!collapseKpi && (
                <div style={{ padding: '16px 18px' }}>
                  {/* Purple Banner */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%)',
                      borderRadius: 8,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#4338ca', fontWeight: 600 }}>Tổng số công việc của bạn</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#312e81', marginTop: 2 }}>VIỆC (0)</div>
                    </div>
                    <div style={{ fontSize: 28 }}>📋</div>
                  </div>

                  {/* 4 Metric items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <HeartOutlined style={{ color: '#10b981', fontSize: 14 }} />
                      <span style={{ color: '#475569', flex: 1 }}>Hoàn thành trước hạn</span>
                      <strong style={{ color: '#0f172a' }}>0</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <CheckCircleOutlined style={{ color: '#3b82f6', fontSize: 14 }} />
                      <span style={{ color: '#475569', flex: 1 }}>Hoàn thành đúng hạn</span>
                      <strong style={{ color: '#0f172a' }}>0</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <WarningOutlined style={{ color: '#f59e0b', fontSize: 14 }} />
                      <span style={{ color: '#475569', flex: 1 }}>Hoàn thành quá hạn</span>
                      <strong style={{ color: '#0f172a' }}>0</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 14 }} />
                      <span style={{ color: '#475569', flex: 1 }}>Chưa hoàn thành</span>
                      <strong style={{ color: '#0f172a' }}>0</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Tài chính matching Screenshot 4 */}
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  padding: '12px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: collapseFinance ? 'none' : '1px solid #f1f5f9',
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Tài chính
                </h3>
                <Button
                  type="text"
                  size="small"
                  icon={collapseFinance ? <PlusOutlined /> : <MinusOutlined />}
                  onClick={() => setCollapseFinance(!collapseFinance)}
                  style={{ color: '#94a3b8' }}
                />
              </div>

              {!collapseFinance && (
                <div style={{ padding: '16px 18px' }}>
                  {/* Yellow/Orange Banner */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #ffedd5 100%)',
                      borderRadius: 8,
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>Tổng lương đã nhận của bạn</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#78350f', marginTop: 2 }}>0 đ</div>
                    </div>
                    <div style={{ fontSize: 28 }}>💰</div>
                  </div>

                  {/* Sub metrics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <DollarCircleOutlined style={{ color: '#16a34a', fontSize: 14 }} />
                      <span style={{ color: '#475569', flex: 1 }}>Số lượng / ngày</span>
                      <strong style={{ color: '#0f172a' }}>0 đ</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <WalletOutlined style={{ color: '#2563eb', fontSize: 14 }} />
                      <span style={{ color: '#475569', flex: 1 }}>Số lượng / tháng</span>
                      <strong style={{ color: '#0f172a' }}>0 đ</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cập nhật thông tin hồ sơ */}
      <Modal
        title="Cập nhật thông tin hồ sơ cá nhân"
        open={updateModalOpen}
        onCancel={() => setUpdateModalOpen(false)}
        footer={null}
        width={560}
      >
        <Form
          layout="vertical"
          initialValues={{
            email: profileData.email !== '--' ? profileData.email : '',
            phone: profileData.phone !== '--' ? profileData.phone : '',
            hometown: profileData.hometown !== '--' ? profileData.hometown : '',
            gender: profileData.gender,
            marital: profileData.marital !== '--' ? profileData.marital : 'Độc thân',
          }}
          onFinish={handleUpdateSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item label="Email cá nhân / công việc" name="email">
            <Input prefix={<MailOutlined />} placeholder="Nhập địa chỉ email" />
          </Form.Item>
          <Form.Item label="Số điện thoại" name="phone">
            <Input prefix={<PhoneOutlined />} placeholder="Nhập số điện thoại" />
          </Form.Item>
          <Form.Item label="Nguyên quán / Quê quán" name="hometown">
            <Input prefix={<HomeOutlined />} placeholder="Nhập quê quán" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="Giới tính" name="gender">
              <Select
                options={[
                  { value: 'Nam', label: 'Nam' },
                  { value: 'Nữ', label: 'Nữ' },
                  { value: 'Khác', label: 'Khác' },
                ]}
              />
            </Form.Item>
            <Form.Item label="Tình trạng hôn nhân" name="marital">
              <Select
                options={[
                  { value: 'Độc thân', label: 'Độc thân' },
                  { value: 'Đã kết hôn', label: 'Đã kết hôn' },
                ]}
              />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <Button onClick={() => setUpdateModalOpen(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" style={{ background: '#e83e8c', borderColor: '#e83e8c' }}>
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal Tải lên tệp tài liệu */}
      <Modal
        title="Tải lên tệp tài liệu hồ sơ"
        open={uploadModalOpen}
        onCancel={() => setUploadModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setUploadModalOpen(false)}>Đóng</Button>,
          <Button key="upload" type="primary" style={{ background: '#e83e8c', borderColor: '#e83e8c' }} onClick={() => {
            message.success('Đã tải tài liệu lên hồ sơ thành công!');
            setUploadModalOpen(false);
          }}>
            Xác nhận tải lên
          </Button>
        ]}
      >
        <div style={{ padding: '16px 0' }}>
          <Form.Item label="Loại giấy tờ / tài liệu">
            <Select
              defaultValue="cmt"
              options={[
                { value: 'cmt', label: 'CMT / Căn cước công dân / Hộ chiếu' },
                { value: 'avatar', label: 'Ảnh chân dung cá nhân' },
                { value: 'degree', label: 'Bằng cấp, chứng chỉ nghề nghiệp' },
                { value: 'birth', label: 'Bản sao giấy khai sinh' },
                { value: 'household', label: 'Bản sao sổ hộ khẩu' },
                { value: 'commitment', label: 'Cam kết làm việc' },
              ]}
            />
          </Form.Item>
          <Upload.Dragger multiple={false} beforeUpload={() => false}>
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: 36, color: '#e83e8c' }} />
            </p>
            <p className="ant-upload-text">Nhấp hoặc kéo thả tệp vào khu vực này để tải lên</p>
            <p className="ant-upload-hint">Hỗ trợ định dạng PDF, JPG, PNG (tối đa 15MB)</p>
          </Upload.Dragger>
        </div>
      </Modal>
    </div>
  );
}
