'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, Alert, Tag } from 'antd';
import {
  UserOutlined,
  ReloadOutlined,
  ExclamationCircleOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

interface EmployeeDetail {
  id: string;
  code: string;
  name: string;
  gender?: string | null;
  birthday?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  originAddress?: string | null;
  joinDate?: string | null;
  hireDate?: string | null;
  status: string;
  citizenId?: string | null;
  maritalStatus?: string | null;
  education?: string | null;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
  jobTitle?: { id: string; name: string } | null;
  manager?: { id: string; name: string; code?: string } | null;
}

export function PersonalProfileScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'general' | 'resume'>('general');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(true);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/me/profile');
      if (res.data) {
        setLinked(res.data.linked);
        setEmployee(res.data.employee || null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const displayName = employee?.name || user?.displayName || user?.username || 'Nhân viên';
  const initial = (displayName[0] || 'T').toUpperCase();
  const employeeCode = employee?.code || '--';
  const departmentName = employee?.department?.name || '--';
  const positionName = employee?.position?.name || employee?.jobTitle?.name || 'Nhân viên';
  const isWorking = employee?.status === 'WORKING' || employee?.status === 'ACTIVE';

  const formatDate = (val?: string | null) => {
    if (!val) return '--';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '--';
      return d.toLocaleDateString('vi-VN');
    } catch {
      return '--';
    }
  };

  const formatGender = (g?: string | null) => {
    if (!g) return '--';
    if (g === 'MALE') return 'Nam';
    if (g === 'FEMALE') return 'Nữ';
    return g;
  };

  return (
    <div>
      {/* ── Sub Tabs (Thông tin chung / Sơ yếu lý lịch) ── */}
      <div className="personal-sub-tabs">
        <button
          className={`personal-tab-item ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Thông tin chung
        </button>
        <button
          className={`personal-tab-item ${activeTab === 'resume' ? 'active' : ''}`}
          onClick={() => setActiveTab('resume')}
        >
          Sơ yếu lý lịch
        </button>
      </div>

      <div className="personal-content">
        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: '#6b7280', fontSize: 13.5 }}>
              Đang tải thông tin cá nhân…
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="personal-empty-card">
            <ExclamationCircleOutlined className="personal-empty-icon" style={{ color: '#ef4444' }} />
            <div className="personal-empty-title">Đã xảy ra lỗi</div>
            <div className="personal-empty-desc">{error}</div>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchProfile}
              style={{ backgroundColor: '#0284c7' }}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Unlinked Account Alert */}
        {!loading && !error && !linked && (
          <div className="personal-empty-card">
            <UserOutlined className="personal-empty-icon" />
            <div className="personal-empty-title">Chưa liên kết hồ sơ nhân sự</div>
            <div className="personal-empty-desc">
              Tài khoản <strong>{user?.username}</strong> hiện chưa được gắn với hồ sơ nhân sự nào trên hệ thống.
              Vui lòng liên hệ quản trị viên nhân sự để được phân bổ hồ sơ.
            </div>
          </div>
        )}

        {/* Profile Content when linked */}
        {!loading && !error && linked && (
          <>
            {/* Profile Header Card */}
            <div className="personal-profile-header-card">
              <div className="personal-avatar-wrapper">
                <div className="personal-avatar">{initial}</div>
              </div>
              <div className="personal-header-info">
                <div className="personal-name-row">
                  <span className="personal-header-name">{displayName}</span>
                  <span className={`personal-status-tag ${isWorking ? 'active' : 'inactive'}`}>
                    <span style={{ fontSize: 8 }}>●</span> {isWorking ? 'Đang làm việc' : 'Đã nghỉ việc'}
                  </span>
                </div>
                <div className="personal-header-role">
                  Mã NV: <strong>{employeeCode}</strong> • {positionName}
                </div>
                <div className="personal-header-dept">{departmentName}</div>
              </div>
            </div>

            {/* TAB 1: THÔNG TIN CHUNG */}
            {activeTab === 'general' && (
              <>
                {/* Card 1: Thông tin liên hệ */}
                <div className="personal-section-card">
                  <div className="personal-section-title">
                    <span>Thông tin liên hệ & Công việc</span>
                    <IdcardOutlined style={{ color: '#0284c7' }} />
                  </div>
                  <div className="personal-info-grid">
                    <div className="personal-info-row">
                      <span className="personal-info-label">Mã nhân viên</span>
                      <span className="personal-info-value">{employeeCode}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Phòng ban</span>
                      <span className="personal-info-value">{departmentName}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Vị trí / Chức danh</span>
                      <span className="personal-info-value">{positionName}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Ngày vào làm</span>
                      <span className="personal-info-value">{formatDate(employee?.joinDate || employee?.hireDate)}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Email công việc</span>
                      <span className="personal-info-value">{employee?.email || `${user?.username}@company.vn`}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Số điện thoại</span>
                      <span className="personal-info-value">{employee?.phone || '--'}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Quản lý trực tiếp</span>
                      <span className="personal-info-value">{employee?.manager?.name || '--'}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Thông tin cá nhân cơ bản */}
                <div className="personal-section-card">
                  <div className="personal-section-title">
                    <span>Thông tin cá nhân</span>
                    <UserOutlined style={{ color: '#10b981' }} />
                  </div>
                  <div className="personal-info-grid">
                    <div className="personal-info-row">
                      <span className="personal-info-label">Họ và tên</span>
                      <span className="personal-info-value">{displayName}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Giới tính</span>
                      <span className="personal-info-value">{formatGender(employee?.gender)}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Ngày sinh</span>
                      <span className="personal-info-value">{formatDate(employee?.birthday || employee?.birthDate)}</span>
                    </div>
                    <div className="personal-info-row">
                      <span className="personal-info-label">Địa chỉ hiện tại</span>
                      <span className="personal-info-value">{employee?.address || '--'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: SƠ YẾU LÝ LỊCH */}
            {activeTab === 'resume' && (
              <div className="personal-section-card">
                <div className="personal-section-title">
                  <span>Sơ yếu lý lịch & Giấy tờ</span>
                  <HomeOutlined style={{ color: '#6366f1' }} />
                </div>
                <div className="personal-info-grid">
                  <div className="personal-info-row">
                    <span className="personal-info-label">Số CCCD / CMND</span>
                    <span className="personal-info-value">{employee?.citizenId || '--'}</span>
                  </div>
                  <div className="personal-info-row">
                    <span className="personal-info-label">Quê quán / Nguyên quán</span>
                    <span className="personal-info-value">{employee?.originAddress || '--'}</span>
                  </div>
                  <div className="personal-info-row">
                    <span className="personal-info-label">Tình trạng hôn nhân</span>
                    <span className="personal-info-value">{employee?.maritalStatus || '--'}</span>
                  </div>
                  <div className="personal-info-row">
                    <span className="personal-info-label">Trình độ học vấn</span>
                    <span className="personal-info-value">{employee?.education || '--'}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
