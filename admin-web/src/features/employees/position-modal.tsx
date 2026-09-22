'use client';

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Row,
  Col,
  message,
} from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

const { TextArea } = Input;

interface PositionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (savedPos: any) => void;
  editData?: any | null;
  positionsList: any[];
  jobTitlesList?: any[];
}

export function PositionModal({
  open,
  onClose,
  onSuccess,
  editData,
  positionsList,
  jobTitlesList = [],
}: PositionModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>(jobTitlesList);

  useEffect(() => {
    if (open) {
      // Fetch roles if not loaded
      apiClient
        .get('/auth/me')
        .catch(() => {});

      // Fetch catalogs for job titles
      apiClient
        .get('/employee-catalogs')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setJobTitles(res.data.filter((c: any) => c.kind === 'JOB_TITLE'));
          }
        })
        .catch(() => {});

      // Fetch roles
      apiClient
        .get('/users?pageSize=1')
        .catch(() => {});

      if (editData) {
        form.setFieldsValue({
          code: editData.code || '',
          name: editData.name || '',
          parentId: editData.parentId || undefined,
          correspondingJobTitleId: editData.correspondingJobTitleId || undefined,
          roleId: editData.roleId || undefined,
          salaryFrom: editData.salaryFrom ?? undefined,
          salaryTo: editData.salaryTo ?? undefined,
          description: editData.description || '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: any = {
        kind: 'POSITION',
        code: values.code?.trim() || `VT_${Date.now().toString().slice(-4)}`,
        name: values.name.trim(),
        parentId: values.parentId || null,
        correspondingJobTitleId: values.correspondingJobTitleId || null,
        roleId: values.roleId || null,
        salaryFrom: values.salaryFrom !== undefined && values.salaryFrom !== null ? Number(values.salaryFrom) : null,
        salaryTo: values.salaryTo !== undefined && values.salaryTo !== null ? Number(values.salaryTo) : null,
        description: values.description?.trim() || null,
        active: true,
      };

      let result;
      if (editData?.id) {
        result = await apiClient.patch(`/employee-catalogs/${editData.id}`, payload);
        message.success('✅ Cập nhật vị trí công việc thành công!');
      } else {
        result = await apiClient.post('/employee-catalogs', payload);
        message.success('✅ Tạo mới vị trí công việc thành công!');
      }

      onSuccess(result.data);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // Form validation error
      console.error('Lỗi lưu vị trí công việc:', err);
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu vị trí công việc');
    } finally {
      setSubmitting(false);
    }
  };

  // Candidates for parent position (exclude self when editing)
  const parentCandidates = positionsList.filter((p) => p.id !== editData?.id);

  // Common role options
  const defaultRoles = [
    { value: 'Nhân viên bán hàng - Nhân viên', label: 'Nhân viên bán hàng - Nhân viên' },
    { value: 'Nhân viên kho hàng - Nhân viên', label: 'Nhân viên kho hàng - Nhân viên' },
    { value: 'Nhân viên Marketing - nhân viên', label: 'Nhân viên Marketing - nhân viên' },
    { value: 'Quản trị hệ thống', label: 'Quản trị hệ thống' },
    { value: 'Quản lý cửa hàng', label: 'Quản lý cửa hàng' },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      maskClosable={false}
      destroyOnHidden
      closeIcon={<CloseOutlined style={{ color: '#e83e8c', fontSize: 18 }} />}
      title={
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', paddingBottom: 4 }}>
          {editData ? 'Chỉnh sửa vị trí công việc' : 'Tạo mới vị trí công việc'}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        requiredMark={false}
      >
        {/* Hàng 1: Mã & Tên vị trí * (Image 3) */}
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="code" style={{ marginBottom: 14 }}>
              <Input placeholder="Mã" style={{ borderRadius: 6, height: 40 }} />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên vị trí' }]}
              style={{ marginBottom: 14 }}
            >
              <Input placeholder="Tên vị trí *" style={{ borderRadius: 6, height: 40 }} />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2: Vị trí cha (Image 3) */}
        <Form.Item name="parentId" style={{ marginBottom: 14 }}>
          <Select
            placeholder="Vị trí cha"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={parentCandidates.map((p) => ({
              value: p.id,
              label: `${p.code ? `[${p.code}] ` : ''}${p.name}`,
            }))}
            style={{ height: 40 }}
          />
        </Form.Item>

        {/* Hàng 3: Chức vụ tương ứng (Image 3) */}
        <Form.Item name="correspondingJobTitleId" style={{ marginBottom: 14 }}>
          <Select
            placeholder="Chức vụ tương ứng"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={jobTitles.map((jt) => ({
              value: jt.id,
              label: jt.name,
            }))}
            style={{ height: 40 }}
          />
        </Form.Item>

        {/* Hàng 4: Nhóm quyền 1Office (Image 3) */}
        <Form.Item name="roleId" style={{ marginBottom: 14 }}>
          <Select
            placeholder="Nhóm quyền 1Office"
            allowClear
            showSearch
            options={defaultRoles}
            style={{ height: 40 }}
          />
        </Form.Item>

        {/* Hàng 5: Mức lương Từ - Đến (Image 3) */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, marginBottom: 6 }}>
            Mức lương
          </div>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="salaryFrom" style={{ marginBottom: 0 }}>
                <InputNumber
                  placeholder="Từ"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : ('' as any))}
                  style={{ width: '100%', height: 40, borderRadius: 6 }}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salaryTo" style={{ marginBottom: 0 }}>
                <InputNumber
                  placeholder="Đến"
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (value ? Number(value.replace(/\$\s?|(,*)/g, '')) : ('' as any))}
                  style={{ width: '100%', height: 40, borderRadius: 6 }}
                  addonAfter="VNĐ"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Hàng 6: Mô tả (Image 3) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, marginBottom: 6 }}>
            Mô tả
          </div>
          <Form.Item name="description" style={{ marginBottom: 0 }}>
            <TextArea
              rows={4}
              placeholder="Nhập mô tả"
              style={{ borderRadius: 6, resize: 'none' }}
            />
          </Form.Item>
        </div>
      </Form>

      {/* Footer: HỦY BỎ | CẬP NHẬT (Image 3) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <Button
          onClick={onClose}
          style={{
            minWidth: 90,
            height: 38,
            borderRadius: 6,
            fontWeight: 600,
            color: '#475569',
            borderColor: '#cbd5e1',
          }}
        >
          HỦY BỎ
        </Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          style={{
            minWidth: 110,
            height: 38,
            borderRadius: 6,
            background: '#e83e8c',
            borderColor: '#e83e8c',
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          CẬP NHẬT
        </Button>
      </div>
    </Modal>
  );
}
