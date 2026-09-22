'use client';

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  Row,
  Col,
  Tooltip,
  message,
} from 'antd';
import { CloseOutlined, QuestionCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

const { TextArea } = Input;

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (savedDept: any) => void;
  editData?: any | null;
  departmentsList: any[];
}

export function DepartmentModal({
  open,
  onClose,
  onSuccess,
  editData,
  departmentsList,
}: DepartmentModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      // Load active employees for supervisor select
      apiClient
        .get('/attendance/employees')
        .then((res) => {
          if (Array.isArray(res.data)) {
            setEmployees(res.data);
          } else if (res.data?.items) {
            setEmployees(res.data.items);
          }
        })
        .catch(() => {
          // fallback to /employees
          apiClient.get('/employees?pageSize=100').then((r) => {
            if (r.data?.items) setEmployees(r.data.items);
          }).catch(() => {});
        });

      if (editData) {
        form.setFieldsValue({
          permissionStructure: editData.permissionStructure || 'Phòng ban',
          code: editData.code,
          name: editData.name,
          isManagementUnit: editData.isManagementUnit || false,
          supervisorId: editData.supervisorId || undefined,
          parentId: editData.parentId || undefined,
          businessBlock: editData.businessBlock || undefined,
          departmentType: editData.departmentType || undefined,
          description: editData.description || '',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          permissionStructure: 'Phòng ban',
          isManagementUnit: false,
        });
      }
    }
  }, [open, editData, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload: any = {
        kind: 'DEPARTMENT',
        code: values.code || `PB_${Date.now().toString().slice(-4)}`,
        name: values.name.trim(),
        permissionStructure: values.permissionStructure || 'Phòng ban',
        isManagementUnit: !!values.isManagementUnit,
        supervisorId: values.supervisorId || null,
        parentId: values.parentId || null,
        businessBlock: values.businessBlock || null,
        departmentType: values.departmentType || null,
        description: values.description || null,
        active: true,
      };

      let result;
      if (editData?.id) {
        result = await apiClient.patch(`/employee-catalogs/${editData.id}`, payload);
        message.success('✅ Cập nhật phòng ban thành công!');
      } else {
        result = await apiClient.post('/employee-catalogs', payload);
        message.success('✅ Tạo mới phòng ban thành công!');
      }

      onSuccess(result.data);
      onClose();
    } catch (err: any) {
      if (err?.errorFields) return; // Validation error
      console.error('Lỗi lưu phòng ban:', err);
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu phòng ban');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter out self when picking parent
  const parentCandidates = departmentsList.filter(
    (d) => d.id !== editData?.id
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={680}
      centered
      maskClosable={false}
      destroyOnHidden
      closeIcon={<CloseOutlined style={{ color: '#e83e8c', fontSize: 18 }} />}
      title={
        <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', paddingBottom: 4 }}>
          {editData ? 'Chỉnh sửa phòng ban' : 'Tạo mới phòng ban'}
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
        requiredMark={false}
      >
        {/* Hàng 1: Cấu trúc quyền * (Select) | Mã ❓ (Input) */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="permissionStructure"
              label={
                <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
                  Cấu trúc quyền <span style={{ color: '#ef4444' }}>*</span>
                </span>
              }
              rules={[{ required: true, message: 'Vui lòng chọn cấu trúc quyền' }]}
            >
              <Select
                placeholder="Chọn cấu trúc quyền"
                allowClear
                options={[
                  { value: 'Công ty', label: 'Công ty' },
                  { value: 'Chi nhánh', label: 'Chi nhánh' },
                  { value: 'Phòng ban', label: 'Phòng ban' },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="code"
              label={
                <span style={{ fontSize: 13, fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tooltip title="Mã phòng ban viết liền không dấu (VD: CH126, MKT, KHO...)">
                    <QuestionCircleOutlined style={{ color: '#fa8c16' }} />
                  </Tooltip>
                  Mã
                </span>
              }
            >
              <Input placeholder="Mã" />
            </Form.Item>
          </Col>
        </Row>

        {/* Hàng 2: Tên phòng ban * */}
        <Form.Item
          name="name"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Tên phòng ban <span style={{ color: '#ef4444' }}>*</span>
            </span>
          }
          rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
        >
          <Input placeholder="Tên phòng ban *" />
        </Form.Item>

        {/* Hàng 3: Checkbox Là đơn vị cấp quản lý ❓ */}
        <Form.Item name="isManagementUnit" valuePropName="checked" style={{ marginBottom: 12 }}>
          <Checkbox>
            <span style={{ fontSize: 13, color: '#334155' }}>
              Là đơn vị cấp quản lý{' '}
              <Tooltip title="Đánh dấu nếu đây là đơn vị có quyền quản lý và điều hành các phòng ban trực thuộc">
                <QuestionCircleOutlined style={{ color: '#fa8c16' }} />
              </Tooltip>
            </span>
          </Checkbox>
        </Form.Item>

        {/* Hàng 4: Giám sát công việc ❓ */}
        <Form.Item
          name="supervisorId"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Tooltip title="Người chịu trách nhiệm giám sát và theo dõi toàn bộ công việc của phòng ban">
                <QuestionCircleOutlined style={{ color: '#fa8c16' }} />
              </Tooltip>
              Giám sát công việc
            </span>
          }
        >
          <Select
            showSearch
            placeholder="Giám sát công việc"
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map((emp) => ({
              value: emp.id,
              label: `${emp.name} (${emp.code || 'NV'}${emp.position?.name ? ` - ${emp.position.name}` : ''})`,
            }))}
            suffixIcon={<SearchOutlined style={{ color: '#94a3b8' }} />}
          />
        </Form.Item>

        {/* Hàng 5: Thuộc phòng ban (Phòng ban cha - Cây tổ chức) */}
        <Form.Item
          name="parentId"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Thuộc phòng ban
            </span>
          }
        >
          <Select
            showSearch
            placeholder="Thuộc phòng ban"
            allowClear
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={parentCandidates.map((d) => ({
              value: d.id,
              label: `${d.code ? `[${d.code}] ` : ''}${d.name}`,
            }))}
          />
        </Form.Item>

        {/* Hàng 6: Khối nghiệp vụ */}
        <Form.Item
          name="businessBlock"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Khối nghiệp vụ
            </span>
          }
          help={
            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
              Lựa chọn cài đặt này giúp người quản trị có thể xuất ra các báo cáo theo nghiệp vụ. VD: Báo cáo lương của khối nghiệp vụ kế toán, kinh doanh,...
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Select
            placeholder="Khối nghiệp vụ"
            allowClear
            options={[
              { value: 'Khối Kinh doanh', label: 'Khối Kinh doanh' },
              { value: 'Khối Vận hành', label: 'Khối Vận hành' },
              { value: 'Khối Kế toán', label: 'Khối Kế toán' },
              { value: 'Khối Nhân sự', label: 'Khối Nhân sự' },
              { value: 'Khối Hỗ trợ', label: 'Khối Hỗ trợ' },
              { value: 'Khối Kỹ thuật / IT', label: 'Khối Kỹ thuật / IT' },
            ]}
          />
        </Form.Item>

        {/* Hàng 7: Loại phòng ban */}
        <Form.Item
          name="departmentType"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Loại phòng ban
            </span>
          }
          help={
            <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
              Phòng ban là 1 đơn vị nội bộ trực thuộc doanh nghiệp, nó được hiểu là 1 nhóm / 1 đội / 1 phòng / 1 ban / 1 khối... Để lên báo cáo một cách tường minh hơn, bạn nên cấu hình và lựa chọn loại cài đặt này
            </div>
          }
          style={{ marginBottom: 16 }}
        >
          <Select
            placeholder="Loại phòng ban"
            allowClear
            options={[
              { value: 'Khối', label: 'Khối' },
              { value: 'Phòng', label: 'Phòng' },
              { value: 'Ban', label: 'Ban' },
              { value: 'Chi nhánh', label: 'Chi nhánh' },
              { value: 'Cửa hàng', label: 'Cửa hàng' },
              { value: 'Kho bãi', label: 'Kho bãi' },
              { value: 'Tổ / Nhóm / Đội', label: 'Tổ / Nhóm / Đội' },
            ]}
          />
        </Form.Item>

        {/* Hàng 8: Mô tả */}
        <Form.Item
          name="description"
          label={
            <span style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>
              Mô tả
            </span>
          }
        >
          <TextArea rows={3} placeholder="Mô tả ghi chú hoặc địa chỉ cụ thể của phòng ban..." />
        </Form.Item>
      </Form>

      {/* Footer: HỦY BỎ | CẬP NHẬT (1Office style) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12,
          paddingTop: 16,
          borderTop: '1px solid #f1f5f9',
          marginTop: 8,
        }}
      >
        <Button
          onClick={onClose}
          style={{
            minWidth: 100,
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
            minWidth: 120,
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
