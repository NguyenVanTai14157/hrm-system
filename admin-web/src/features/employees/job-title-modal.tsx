'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Input,
  InputNumber,
  Select,
  Tooltip,
  App,
} from 'antd';
import {
  PlusCircleOutlined,
  CloseOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { apiClient } from '@/lib/api-client';

interface JobTitleRow {
  key: string;
  code: string;
  name: string;
  orderNumber: number;
  rankLevel: string;
  description: string;
}

interface JobTitleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newItem?: any) => void;
  editData?: any | null;
}

export const RANK_LEVEL_OPTIONS = [
  { value: 'Level 1', label: 'Level 1 - Ban Giám đốc' },
  { value: 'Level 2', label: 'Level 2 - Cấp Quản lý / Trưởng phòng' },
  { value: 'Level 3', label: 'Level 3 - Cửa hàng trưởng / Trưởng ca' },
  { value: 'Level 4', label: 'Level 4 - Nhân viên chính thức' },
  { value: 'Level 5', label: 'Level 5 - Thử việc / Học việc' },
];

export function JobTitleModal({
  open,
  onClose,
  onSuccess,
  editData,
}: JobTitleModalProps) {
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState<JobTitleRow[]>([
    {
      key: '1',
      code: '',
      name: '',
      orderNumber: 1,
      rankLevel: 'Level 4',
      description: '',
    },
  ]);

  useEffect(() => {
    if (open) {
      if (editData) {
        setRows([
          {
            key: 'edit-1',
            code: editData.code || '',
            name: editData.name || '',
            orderNumber: editData.orderNumber || 1,
            rankLevel: editData.rankLevel || 'Level 4',
            description: editData.description || '',
          },
        ]);
      } else {
        setRows([
          {
            key: '1',
            code: '',
            name: '',
            orderNumber: 1,
            rankLevel: 'Level 4',
            description: '',
          },
        ]);
      }
    }
  }, [open, editData]);

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        key: Date.now().toString(),
        code: '',
        name: '',
        orderNumber: prev.length + 1,
        rankLevel: 'Level 4',
        description: '',
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index: number, field: keyof JobTitleRow, value: any) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async () => {
    // Validate rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name || !row.name.trim()) {
        message.warning(`Vui lòng nhập Tên chức vụ ở dòng số ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      if (editData) {
        // Edit single item
        const payload = {
          code: rows[0].code?.trim() || `CV_${Date.now()}`,
          name: rows[0].name.trim(),
          orderNumber: rows[0].orderNumber || 1,
          rankLevel: rows[0].rankLevel,
          description: rows[0].description?.trim() || null,
        };
        const res = await apiClient.patch(`/employee-catalogs/${editData.id}`, payload);
        message.success('✅ Cập nhật chức vụ thành công!');
        onSuccess(res.data);
        onClose();
      } else {
        // Create 1 or multiple items
        let lastCreated: any = null;
        for (const row of rows) {
          const autoCode = row.code?.trim() || `CV_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const payload = {
            kind: 'JOB_TITLE',
            code: autoCode,
            name: row.name.trim(),
            orderNumber: row.orderNumber || 1,
            rankLevel: row.rankLevel,
            description: row.description?.trim() || null,
            active: true,
          };
          const res = await apiClient.post('/employee-catalogs', payload);
          lastCreated = res.data;
        }
        message.success(`✅ Đã tạo thành công ${rows.length} chức vụ!`);
        onSuccess(lastCreated);
        onClose();
      }
    } catch (err: any) {
      console.error('Lỗi lưu chức vụ:', err);
      message.error(err?.response?.data?.message || 'Không thể lưu chức vụ. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      maskClosable={false}
      footer={null}
      width={1000}
      title={
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
          {editData ? 'Chỉnh sửa Chức vụ' : 'Tạo mới Chức vụ'}
        </div>
      }
      styles={{
        body: {
          padding: '24px 28px',
          borderRadius: 12,
        },
      }}
    >
      <div style={{ marginTop: 20 }}>
        {/* Table Headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '170px 230px 100px 180px 1fr 36px',
            gap: 12,
            marginBottom: 8,
            fontSize: 13,
            fontWeight: 600,
            color: '#475569',
          }}
        >
          <div>Mã chức vụ</div>
          <div>
            Tên chức vụ <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div>
            Thứ tự <span style={{ color: '#ef4444' }}>*</span>{' '}
            <Tooltip title="Thứ tự hiển thị và sắp xếp cấp bậc trong hệ thống">
              <QuestionCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
            </Tooltip>
          </div>
          <div>
            Cấp bậc{' '}
            <Tooltip title="Cấp bậc hành chính dùng cho quy trình duyệt đơn tự động">
              <QuestionCircleOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
            </Tooltip>
          </div>
          <div>Mô tả</div>
          <div></div>
        </div>

        {/* Dynamic Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row, index) => (
            <div
              key={row.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '170px 230px 100px 180px 1fr 36px',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <Input
                placeholder="Mã chức vụ"
                value={row.code}
                onChange={(e) => handleRowChange(index, 'code', e.target.value)}
                style={{ borderRadius: 6 }}
              />
              <Input
                placeholder="Nhập tên chức vụ"
                value={row.name}
                onChange={(e) => handleRowChange(index, 'name', e.target.value)}
                style={{ borderRadius: 6 }}
              />
              <InputNumber
                min={1}
                max={999}
                value={row.orderNumber}
                onChange={(val) => handleRowChange(index, 'orderNumber', val || 1)}
                style={{ width: '100%', borderRadius: 6 }}
              />
              <Select
                placeholder="Cấp bậc"
                value={row.rankLevel}
                onChange={(val) => handleRowChange(index, 'rankLevel', val)}
                options={RANK_LEVEL_OPTIONS}
                style={{ width: '100%' }}
              />
              <Input
                placeholder="Nhập mô tả"
                value={row.description}
                onChange={(e) => handleRowChange(index, 'description', e.target.value)}
                style={{ borderRadius: 6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                {rows.length > 1 && !editData ? (
                  <Button
                    type="text"
                    size="small"
                    icon={<CloseOutlined style={{ color: '#94a3b8', fontSize: 13 }} />}
                    onClick={() => handleRemoveRow(index)}
                    title="Xóa dòng"
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Plus Button to add new row (Image 3) */}
        {!editData && (
          <div style={{ marginTop: 14 }}>
            <Button
              type="text"
              shape="circle"
              icon={<PlusCircleOutlined style={{ color: '#e83e8c', fontSize: 20 }} />}
              onClick={handleAddRow}
              title="Thêm dòng chức vụ mới"
              style={{ width: 32, height: 32, padding: 0 }}
            />
          </div>
        )}

        {/* Modal Action Buttons Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 30,
            borderTop: '1px solid #f1f5f9',
            paddingTop: 16,
          }}
        >
          <Button
            onClick={onClose}
            style={{
              padding: '0 20px',
              height: 38,
              borderRadius: 6,
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            HỦY BỎ
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            style={{
              background: '#e83e8c',
              borderColor: '#e83e8c',
              padding: '0 24px',
              height: 38,
              borderRadius: 6,
              fontWeight: 600,
              boxShadow: '0 2px 4px rgba(232, 62, 140, 0.2)',
            }}
          >
            CẬP NHẬT
          </Button>
        </div>
      </div>
    </Modal>
  );
}
