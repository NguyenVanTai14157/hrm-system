'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Tag, Avatar, Timeline, Input, message, Tabs, Card, Spin, Space, Modal } from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  UndoOutlined,
  CloseOutlined,
  RobotOutlined,
  PaperClipOutlined,
  SmileOutlined,
  SendOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';
import './applications.css';

export function ApplicationDetailScreen() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([
    {
      id: '1',
      author: 'Phạm Quỳnh Nhiên',
      time: '09:10 ng 12/09/2026',
      text: 'Đã kiểm tra dữ liệu camera Hanet, đúng thời gian nhân sự có mặt.',
    },
  ]);
  const [activeTab, setActiveTab] = useState('detail');

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/applications/${id}`);
      setApp(res.data);
    } catch (err: any) {
      message.error('Không tìm thấy thông tin đơn từ.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleApprove = async () => {
    try {
      await apiClient.patch(`/applications/${id}/approve`, { comment: 'Đã duyệt từ giao diện chi tiết 1Office' });
      message.success('Đã duyệt đơn từ thành công!');
      fetchDetail();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi duyệt đơn.');
    }
  };

  const handleReject = async () => {
    try {
      await apiClient.patch(`/applications/${id}/reject`, { comment: 'Từ chối đơn từ' });
      message.warning('Đã từ chối đơn từ.');
      fetchDetail();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi từ chối đơn.');
    }
  };

  const handleRevert = async () => {
    try {
      await apiClient.patch(`/applications/${id}/revert`);
      message.info('Đã hoàn duyệt đơn từ về trạng thái ban đầu.');
      fetchDetail();
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi hoàn duyệt.');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Xóa đơn từ khỏi CSDL',
      content: 'Bạn có chắc chắn muốn xóa đơn từ này không? Hành động này sẽ không thể hoàn tác.',
      okText: 'Xóa bản ghi',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiClient.delete(`/applications/${id}`);
          message.success('Đã xóa đơn từ thành công.');
          router.push('/hrm/applications');
        } catch (err: any) {
          message.error('Lỗi khi xóa đơn từ.');
        }
      },
    });
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;
    setComments([
      ...comments,
      {
        id: Date.now().toString(),
        author: 'Admin Quản trị',
        time: 'Vừa xong',
        text: commentText.trim(),
      },
    ]);
    setCommentText('');
    message.success('Đã đăng thảo luận.');
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '60vh' }}>
        <Spin size="large" description="Đang tải chi tiết đơn từ..." />
      </div>
    );
  }

  if (!app) {
    return (
      <div style={{ padding: 30, textAlign: 'center' }}>
        <h2>Không tìm thấy đơn từ</h2>
        <Button onClick={() => router.push('/hrm/applications')}>Quay lại danh sách</Button>
      </div>
    );
  }

  const emp = app.employee || {};
  const statusColorMap: Record<string, string> = {
    APPROVED: 'green',
    WAITING: 'gold',
    APPROVING: 'blue',
    NO_APPROVED: 'red',
    CANCELED: 'default',
  };
  const statusTextMap: Record<string, string> = {
    APPROVED: 'Đã duyệt',
    WAITING: 'Chờ duyệt',
    APPROVING: 'Đang duyệt',
    NO_APPROVED: 'Từ chối',
    CANCELED: 'Đã hủy',
  };

  const deptName = emp.department?.name || '';
  const currentStep = app.currentStep || 1;
  let detailStepText = 'Quản lý duyệt ▷';
  let detailStepColor = 'orange';

  if (app.status === 'APPROVED') {
    detailStepText = 'Hoàn tất ▷';
    detailStepColor = 'green';
  } else if (app.status === 'NO_APPROVED' || app.status === 'CANCELED') {
    detailStepText = 'Không duyệt ▷';
    detailStepColor = 'red';
  } else if (currentStep >= 2 || deptName.includes('BAN GIÁM ĐỐC')) {
    detailStepText = 'Admin duyệt ▷';
  } else if (deptName.includes('CỬA HÀNG')) {
    detailStepText = 'QLCH Duyệt ▷';
  } else if (deptName.includes('KHO')) {
    detailStepText = 'Giám sát Kho duyệt ▷';
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Top Detail Bar */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => router.push('/hrm/applications')}
            style={{ fontWeight: 600 }}
          />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
            + {app.type || 'Đơn từ'}
          </h2>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'detail', label: 'Chi tiết' },
              { key: 'workflow', label: 'Quy trình duyệt' },
            ]}
            style={{ margin: 0 }}
          />
        </div>

        {/* Action Buttons Header */}
        <Space>
          <Button icon={<RobotOutlined />} style={{ borderColor: '#2563eb', color: '#2563eb' }}>
            1AI Monitor
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleApprove}
            style={{ background: '#059669', borderColor: '#059669' }}
          >
            Duyệt
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleRevert}>
            Hoàn duyệt
          </Button>
          <Button danger icon={<CloseOutlined />} onClick={handleReject}>
            Từ chối
          </Button>
          <Button danger type="text" icon={<DeleteOutlined />} onClick={handleDelete}>
            Xóa
          </Button>
        </Space>
      </div>

      {/* Main Content View */}
      {activeTab === 'workflow' ? (
        <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 24px' }}>
          <Card title="⚡ Quy trình phê duyệt Đơn từ 1Office" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#d1fae5', color: '#047857', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16 }}>1</div>
                <div style={{ flex: 1, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>Bước 1: Khởi tạo đơn từ</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Nhân sự <strong>{emp.name} ({emp.code})</strong> gửi {app.type} lên hệ thống.
                  </p>
                  <Tag color="green" style={{ marginTop: 8 }}>Đã gửi đơn</Tag>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: app.status === 'APPROVED' ? '#d1fae5' : '#fef3c7', color: app.status === 'APPROVED' ? '#047857' : '#b45309', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16 }}>2</div>
                <div style={{ flex: 1, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>
                    Bước 2: {emp.department?.name?.includes('CỬA HÀNG') ? 'Quản lý Cửa hàng (QLCH) duyệt' : emp.department?.name?.includes('KHO') ? 'Giám sát Kho duyệt' : 'Quản lý trực tiếp duyệt'}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Phạm Quỳnh Nhiên / Quản lý trực tiếp kiểm tra chứng từ và xác nhận.
                  </p>
                  <Tag color={app.status === 'APPROVED' ? 'green' : 'gold'} style={{ marginTop: 8 }}>
                    {app.status === 'APPROVED' ? 'Đã xác nhận' : 'Đang duyệt'}
                  </Tag>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: app.status === 'APPROVED' ? '#d1fae5' : '#f1f5f9', color: app.status === 'APPROVED' ? '#047857' : '#64748b', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16 }}>3</div>
                <div style={{ flex: 1, padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <strong style={{ fontSize: 14, color: '#0f172a' }}>Bước 3: Ban Giám Đốc / Admin Quản trị phê duyệt cuối & Tự động chốt công</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Phê duyệt chính thức. Tự động khấu trừ phép năm (Furlough) hoặc tính công OT vào Bảng công.
                  </p>
                  <Tag color={app.status === 'APPROVED' ? 'green' : 'default'} style={{ marginTop: 8 }}>
                    {app.status === 'APPROVED' ? 'Hoàn tất phê duyệt' : 'Chờ phê duyệt cuối'}
                  </Tag>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div
          style={{
            maxWidth: 1400,
            margin: '20px auto 0',
            padding: '0 24px',
            display: 'grid',
            gridTemplateColumns: '2.5fr 1fr',
            gap: 20,
          }}
        >
          {/* Left Column: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Thông tin chung Card */}
            <Card title="📄 Thông tin chung" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', fontSize: 13 }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Họ và tên</span>
                  <Tag color="magenta" style={{ fontSize: 13, padding: '2px 10px', borderRadius: 12 }}>
                    {emp.name || '—'}
                  </Tag>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Mã nhân viên</span>
                  <strong style={{ color: '#0f172a' }}>{emp.code || '—'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Phòng ban</span>
                  <strong style={{ color: '#0f172a' }}>{emp.department?.name || '—'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Vị trí / Chức vụ</span>
                  <strong style={{ color: '#0f172a' }}>{emp.position?.name || 'Chuyên viên'}</strong>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Trạng thái</span>
                  <Tag color={statusColorMap[app.status] || 'blue'}>
                    {statusTextMap[app.status] || app.status}
                  </Tag>
                </div>

                <div>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Bước duyệt</span>
                  <Tag color={detailStepColor}>
                    {detailStepText}
                  </Tag>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Người duyệt</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Avatar style={{ backgroundColor: '#2563eb' }}>A</Avatar>
                    <span style={{ fontSize: 13 }}>Admin Quản trị</span>
                    <Avatar style={{ backgroundColor: '#059669', marginLeft: 8 }}>P</Avatar>
                    <span style={{ fontSize: 13 }}>Phạm Quỳnh Nhiên</span>
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748b', display: 'block', marginBottom: 4 }}>Lý do / Mô tả</span>
                  <div
                    style={{
                      padding: 10,
                      background: '#f8fafc',
                      borderRadius: 8,
                      border: '1px solid #f1f5f9',
                      color: '#334155',
                    }}
                  >
                    {app.reason || app.description || 'Không có mô tả bổ sung.'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Chi tiết Đơn từ Card */}
            <Card title="📑 Chi tiết nội dung Đơn" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Thời gian / Ngày</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Ca làm việc</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Lý do chi tiết</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Số lượng / Công</th>
                    <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Phạt / Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      {app.payload?.startDate || new Date(app.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      <Tag color="blue">{app.payload?.shift || 'Ca Hành Chính'}</Tag>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      {app.reason || 'Lỗi thiết bị / Việc cá nhân'}
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9' }}>
                      <strong>{app.payload?.amount || 1.0} ngày/công</strong>
                    </td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                      Không
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>

            {/* Đính kèm Card */}
            <Card title="📎 File đính kèm" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#94a3b8', fontSize: 13, padding: 12, textTransform: 'none' }}>
                Bạn không có file đính kèm nào.
              </div>
            </Card>
          </div>

          {/* Right Column: Audit Timeline & Discussions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Lịch sử hoạt động Card */}
            <Card title="⏳ Lịch sử hoạt động" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    content: (
                      <div>
                        <strong style={{ fontSize: 13, display: 'block' }}>
                          {app.status === 'APPROVED' ? 'Admin Quản trị đã duyệt' : 'Phạm Quỳnh Nhiên đã duyệt'}
                        </strong>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(app.updatedAt).toLocaleString('vi-VN')}
                        </span>
                        <p style={{ fontSize: 12, color: '#334155', margin: '4px 0 0' }}>
                          Bước: {app.currentStep === 2 ? 'Hoàn tất phê duyệt' : 'Admin duyệt'}
                        </p>
                      </div>
                    ),
                  },
                  {
                    color: 'blue',
                    content: (
                      <div>
                        <strong style={{ fontSize: 13, display: 'block' }}>{emp.name || 'Nhân sự'} đã tạo mới đơn</strong>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {new Date(app.createdAt).toLocaleString('vi-VN')}
                        </span>
                        <p style={{ fontSize: 12, color: '#334155', margin: '4px 0 0' }}>
                          ID Đơn: {app.id.slice(0, 8)}
                        </p>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>

            {/* Thảo luận Card */}
            <Card title="💬 Thảo luận" size="small" style={{ borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                {comments.length === 0 ? (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>Không có thảo luận nào.</span>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: 10,
                        background: '#f8fafc',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ fontSize: 12, color: '#2563eb' }}>{c.author}</strong>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{c.time}</span>
                      </div>
                      <p style={{ fontSize: 12, margin: 0, color: '#334155' }}>{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Input Comment Box */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Input.TextArea
                  rows={2}
                  placeholder="Viết thảo luận..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <Button type="text" icon={<PaperClipOutlined />} size="small" />
                    <Button type="text" icon={<SmileOutlined />} size="small" />
                  </Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={handleSendComment}
                    style={{ background: '#2563eb' }}
                  >
                    Gửi
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
