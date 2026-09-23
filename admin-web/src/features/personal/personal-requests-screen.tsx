'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Spin, Button, Modal, Form, Input, Select, DatePicker, App, Tag, Empty } from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

const APPLICATION_TYPES = [
  { value: 'Đơn xin nghỉ phép', label: '1. Đơn xin nghỉ phép' },
  { value: 'Đơn vắng mặt', label: '2. Đơn vắng mặt' },
  { value: 'Đơn làm thêm giờ (OT)', label: '3. Đơn làm thêm giờ (OT)' },
  { value: 'Đơn checkin/out (bổ sung chốt)', label: '4. Đơn checkin/out (bổ sung chốt)' },
  { value: 'Đơn đổi ca', label: '5. Đơn đổi ca' },
  { value: 'Đơn tăng ca', label: '6. Đơn tăng ca' },
  { value: 'Đơn đăng ký ca', label: '7. Đơn đăng ký ca' },
  { value: 'Đơn công tác', label: '8. Đơn công tác' },
  { value: 'Đơn giải trình', label: '9. Đơn giải trình' },
  { value: 'Đơn xin thôi việc', label: '10. Đơn xin thôi việc' },
];

export function PersonalRequestsScreen() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<'my' | 'todo'>('my');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'WAITING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ myRequests: [], toDoList: [] });
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [form] = Form.useForm();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/me/requests');
      setData(res.data);
    } catch {
      message.error('Không thể tải danh sách đơn từ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreate = async (values: any) => {
    setSubmitting(true);
    try {
      await apiClient.post('/me/requests', {
        type: values.type,
        reason: values.reason,
        description: values.description,
        payload: {
          fromDate: values.dateRange ? values.dateRange[0]?.format('YYYY-MM-DD') : undefined,
          toDate: values.dateRange ? values.dateRange[1]?.format('YYYY-MM-DD') : undefined,
          singleDate: values.singleDate ? values.singleDate.format('YYYY-MM-DD') : undefined,
          note: values.description,
          reason: values.reason,
        },
      });

      message.success('✅ Đã gửi đơn thành công! Luồng duyệt đã được khởi tạo.');
      form.resetFields();
      setModalOpen(false);
      fetchRequests();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Gửi đơn thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await apiClient.post(`/me/requests/${id}/approve`, { comment: 'Đã duyệt qua Mobile App' });
      message.success('✅ Đã duyệt đơn thành công!');
      fetchRequests();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể phê duyệt.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setApprovingId(id);
    try {
      await apiClient.post(`/me/requests/${id}/reject`, { comment: 'Từ chối qua Mobile App' });
      message.success('Đã từ chối đơn.');
      fetchRequests();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Không thể từ chối.');
    } finally {
      setApprovingId(null);
    }
  };

  const myRequests: any[] = (data?.myRequests || []).filter((r: any) => {
    if (statusFilter === 'WAITING' && !['WAITING', 'APPROVING', 'PENDING'].includes(r.status)) return false;
    if (statusFilter === 'APPROVED' && r.status !== 'APPROVED') return false;
    if (statusFilter === 'REJECTED' && !['NO_APPROVED', 'REJECTED', 'CANCELED'].includes(r.status)) return false;
    if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
    return true;
  });

  const toDoList: any[] = data?.toDoList || [];

  return (
    <div>
      {/* ── Sub Tabs ── */}
      <div className="personal-sub-tabs">
        <button
          className={`personal-tab-item ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          Đề xuất của bạn ({data?.myRequests?.length || 0})
        </button>
        <button
          className={`personal-tab-item ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => setActiveTab('todo')}
        >
          Việc cần duyệt ({toDoList.length})
        </button>
      </div>

      <div className="personal-content">
        {/* Actions Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <Tag.CheckableTag
              checked={statusFilter === 'ALL'}
              onChange={() => setStatusFilter('ALL')}
            >
              Tất cả
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={statusFilter === 'WAITING'}
              onChange={() => setStatusFilter('WAITING')}
            >
              Chờ duyệt
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={statusFilter === 'APPROVED'}
              onChange={() => setStatusFilter('APPROVED')}
            >
              Đã duyệt
            </Tag.CheckableTag>
            <Tag.CheckableTag
              checked={statusFilter === 'REJECTED'}
              onChange={() => setStatusFilter('REJECTED')}
            >
              Từ chối
            </Tag.CheckableTag>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            style={{ backgroundColor: '#0284c7', borderRadius: 6, fontWeight: 600 }}
            onClick={() => setModalOpen(true)}
          >
            Tạo đơn
          </Button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>Đang tải danh sách đơn từ…</p>
          </div>
        ) : (
          <>
            {/* TAB 1: ĐỀ XUẤT CỦA BẠN */}
            {activeTab === 'my' && (
              <div>
                {myRequests.length === 0 ? (
                  <div className="personal-empty-card">
                    <FileTextOutlined className="personal-empty-icon" />
                    <div className="personal-empty-title">Không có đơn từ nào</div>
                    <div className="personal-empty-desc">
                      Bạn chưa tạo đơn nào trong danh mục này hoặc toàn bộ đơn đã được xử lý.
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ backgroundColor: '#0284c7', marginTop: 8 }}
                      onClick={() => setModalOpen(true)}
                    >
                      Tạo đơn mới ngay
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {myRequests.map((item) => {
                      const isApproved = item.status === 'APPROVED';
                      const isRejected = item.status === 'NO_APPROVED' || item.status === 'REJECTED';
                      return (
                        <div key={item.id} className="personal-section-card" style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1e293b' }}>
                                {item.type}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                Mã: <strong>{item.code}</strong> • {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                            <Tag color={isApproved ? 'green' : isRejected ? 'red' : 'orange'}>
                              {isApproved ? 'Đã duyệt' : isRejected ? 'Bị từ chối' : 'Chờ duyệt'}
                            </Tag>
                          </div>

                          <div style={{ marginTop: 10, fontSize: 13, color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: 6 }}>
                            <strong>Lý do:</strong> {item.reason || 'Không có lý do cụ thể'}
                          </div>

                          <div style={{ marginTop: 8, fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <ClockCircleOutlined />
                            <span>Người duyệt: <strong>{item.currentApproverName || 'Quản lý trực tiếp'}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: VIỆC CẦN DUYỆT (TO-DO LIST) */}
            {activeTab === 'todo' && (
              <div>
                {toDoList.length === 0 ? (
                  <div className="personal-empty-card">
                    <CheckCircleOutlined className="personal-empty-icon" style={{ color: '#10b981' }} />
                    <div className="personal-empty-title">Thật tuyệt!</div>
                    <div className="personal-empty-desc">
                      Bạn đã xử lý hết các đơn từ và công việc cần phê duyệt.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {toDoList.map((item) => (
                      <div key={item.id} className="personal-section-card" style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#1e293b' }}>
                              {item.type}
                            </div>
                            <div style={{ fontSize: 12, color: '#0284c7', fontWeight: 600, marginTop: 2 }}>
                              <UserOutlined /> {item.applicant?.name} ({item.applicant?.code}) • {item.applicant?.department}
                            </div>
                          </div>
                          <Tag color="orange">Chờ bạn duyệt</Tag>
                        </div>

                        <div style={{ marginTop: 10, fontSize: 13, color: '#334155', background: '#f8fafc', padding: '8px 10px', borderRadius: 6 }}>
                          <strong>Lý do:</strong> {item.reason || 'Đề xuất từ nhân viên'}
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <Button
                            danger
                            size="small"
                            icon={<CloseCircleOutlined />}
                            loading={approvingId === item.id}
                            onClick={() => handleReject(item.id)}
                          >
                            Từ chối
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            loading={approvingId === item.id}
                            style={{ backgroundColor: '#10b981' }}
                            onClick={() => handleApprove(item.id)}
                          >
                            Duyệt đơn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal Tạo đơn từ mới (10 loại 1Office) ── */}
      <Modal
        title="📝 Tạo đề xuất / Đơn từ mới"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        centered
        width={440}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 14 }}>
          <Form.Item
            name="type"
            label="Loại đơn từ (10 loại chuẩn 1Office)"
            rules={[{ required: true, message: 'Vui lòng chọn loại đơn' }]}
            initialValue="Đơn xin nghỉ phép"
          >
            <Select options={APPLICATION_TYPES} size="large" />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Khoảng thời gian áp dụng"
          >
            <DatePicker.RangePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do đề xuất"
            rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
          >
            <Input size="large" placeholder="Ví dụ: Nghỉ việc riêng, Đổi ca trực..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chi tiết / Ghi chú thêm"
          >
            <Input.TextArea rows={3} placeholder="Ghi chú thêm nội dung cho người duyệt..." />
          </Form.Item>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={() => setModalOpen(false)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{ backgroundColor: '#0284c7' }}
            >
              Gửi đơn duyệt
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
