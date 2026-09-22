'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Form, Input, InputNumber, Select, DatePicker, Tabs, Row, Col, Typography, Checkbox, Upload, Tooltip, Space } from 'antd';
import { PortalIcon } from '@/components/portal-icon';
import { apiClient, authError } from '@/lib/api-client';
import { BankList, WorkPermitList, VisaList, FamilyList, EducationList, PartyHistoryList, ExperienceList, CertificateList } from './employee-dynamic-lists';
import { DepartmentModal } from '@/features/admin/department-modal';
import { PositionModal } from '@/features/employees/position-modal';
import { JobTitleModal } from '@/features/employees/job-title-modal';
import './employees.css';

const { Title, Text } = Typography;

export function ImageUploadBox({ name, label, height = 135 }: { name: string; label: string; height?: number }) {
  return (
    <Form.Item name={name} label={label} style={{ marginBottom: 16 }}>
      <UploadBoxInner height={height} />
    </Form.Item>
  );
}

function UploadBoxInner({ value, onChange, height = 135 }: { value?: any; onChange?: (val: any) => void; height?: number }) {
  const [preview, setPreview] = useState<string | null>(typeof value === 'string' ? value : null);

  useEffect(() => {
    if (typeof value === 'string') setPreview(value);
    else if (!value) setPreview(null);
  }, [value]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setPreview(compressedDataUrl);
        onChange?.(compressedDataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange?.(null);
  };

  return (
    <Upload.Dragger
      name="file"
      showUploadList={false}
      beforeUpload={handleFile}
      className="custom-upload-dragger"
      style={{
        background: '#f6f7f9',
        border: '1.5px dashed #cfd5de',
        borderRadius: 8,
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {preview ? (
        <div style={{ position: 'relative', width: '100%', height: height - 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={preview} alt="preview" style={{ maxHeight: height - 20, maxWidth: '90%', objectFit: 'contain', borderRadius: 4 }} />
          <Button
            type="primary"
            danger
            size="small"
            shape="circle"
            icon={<PortalIcon name="x" size={12} />}
            style={{ position: 'absolute', top: 2, right: 6, zIndex: 10 }}
            onClick={handleClear}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#a0aab8', height: '100%' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </div>
      )}
    </Upload.Dragger>
  );
}

function SectionTitle({ title, tooltip }: { title: string; tooltip?: string }) {
  return (
    <div className="section-title-pink">
      <span className="pink-text">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {title}
        {tooltip && (
          <Tooltip title={tooltip}>
            <span style={{ color: '#fa8c16', cursor: 'pointer', marginLeft: 4 }}>❓</span>
          </Tooltip>
        )}
      </span>
    </div>
  );
}

export function EmployeeCreateScreen() {
  const router = useRouter();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [managersData, setManagersData] = useState<{items: any[]}>({ items: [] });
  const [quickDeptModalOpen, setQuickDeptModalOpen] = useState(false);
  const [quickPosModalOpen, setQuickPosModalOpen] = useState(false);
  const [quickJobTitleModalOpen, setQuickJobTitleModalOpen] = useState(false);

  const refreshCatalogs = () => {
    apiClient.get('/employee-catalogs').then(r => {
      if (Array.isArray(r.data)) setCatalogs(r.data);
    }).catch(console.error);
  };

  useEffect(() => {
    let active = true;
    apiClient.get('/employee-catalogs').then(r => {
      if (active && Array.isArray(r.data)) setCatalogs(r.data);
    }).catch(console.error);

    apiClient.get('/employees?status=WORKING&pageSize=100').then(r => {
      if (active) setManagersData(r.data);
    }).catch(console.error);

    apiClient.get('/employees/next-code').then(r => {
      if (active && r.data?.code) {
        form.setFieldsValue({ code: r.data.code });
      }
    }).catch(console.error);

    return () => { active = false; };
  }, [form]);

  const departments = catalogs.filter((c: any) => c.kind === 'DEPARTMENT' && c.active);
  const positions = catalogs.filter((c: any) => c.kind === 'POSITION' && c.active);
  const jobTitles = catalogs.filter((c: any) => c.kind === 'JOB_TITLE' && c.active);
  const managers = managersData.items;

  const formatDate = (val: any) => {
    if (!val) return undefined;
    if (typeof val === 'string') return val;
    if (val.format) return val.format('YYYY-MM-DD');
    return undefined;
  };

  const handleFinish = async (values: any) => {
    setSaving(true);
    try {
      const {
        identityNo, identityIssueDate, identityIssuePlace, identityFrontImg, identityBackImg,
        passportType, passportNo, passportIssueDate, passportExpiryDate, passportIssuePlace, passportImg,
        ...restValues
      } = values;

      const identities: any[] = [];
      if (identityNo || identityFrontImg || identityBackImg) {
        identities.push({
          type: 'CCCD',
          identityNo: identityNo || '',
          issueDate: formatDate(identityIssueDate),
          issuePlace: identityIssuePlace || '',
          frontImg: typeof identityFrontImg === 'string' ? identityFrontImg : undefined,
          backImg: typeof identityBackImg === 'string' ? identityBackImg : undefined,
        });
      }
      if (passportNo || passportImg) {
        identities.push({
          type: passportType || 'PASSPORT',
          identityNo: passportNo || '',
          issueDate: formatDate(passportIssueDate),
          expiryDate: formatDate(passportExpiryDate),
          issuePlace: passportIssuePlace || '',
          frontImg: typeof passportImg === 'string' ? passportImg : undefined,
        });
      }

      const payload: any = {
        ...restValues,
        salaryBase: restValues.salaryBase ? Number(String(restValues.salaryBase).replace(/,/g, '')) : undefined,
        birthday: formatDate(restValues.birthday),
        joinDate: formatDate(restValues.joinDate),
        officialContractDate: formatDate(restValues.officialContractDate),
        identities: identities.length > 0 ? identities : undefined,
        status: 'WORKING',
      };

      // Clean up empty string, null, or undefined fields before sending
      Object.keys(payload).forEach(key => {
        if (payload[key] === '' || payload[key] === undefined || payload[key] === null || Number.isNaN(payload[key])) {
          delete payload[key];
        }
      });

      await apiClient.post('/employees', payload);
      message.success('Đã tạo hồ sơ nhân sự thành công');
      router.push('/hrm/employees');
    } catch (error: any) {
      message.error(authError(error));
    } finally {
      setSaving(false);
    }
  };

  const personalInfoTab = (
    <div className="employee-form-section">
      <SectionTitle title="Thông tin cá nhân" />
      
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="code" label="Mã NS" tooltip="Để trống hệ thống sẽ tự động sinh mã nhân sự (NV001, NV002...)">
            <Input placeholder="Tự động sinh hoặc nhập tự chọn" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="syncCode" label="Mã chấm công" tooltip="Mã dùng cho máy chấm công">
            <Input placeholder="Mã chấm công" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="workType" label="Mã hồ sơ">
            <Input placeholder="Mã hồ sơ cứng" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="birthday" label="Ngày sinh">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="gender" label="Giới tính">
            <Select placeholder="Chọn giới tính" allowClear>
              <Select.Option value="MALE">Nam</Select.Option>
              <Select.Option value="FEMALE">Nữ</Select.Option>
              <Select.Option value="OTHER">Khác</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="militaryService" label="Nghĩa vụ quân sự">
            <Select placeholder="Chọn trạng thái" allowClear>
              <Select.Option value="DONE">Đã hoàn thành</Select.Option>
              <Select.Option value="PENDING">Chưa hoàn thành</Select.Option>
              <Select.Option value="EXEMPT">Miễn nghĩa vụ</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="birthPlace" label="Nơi sinh">
            <Input placeholder="Nhập nơi sinh" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="hometown" label="Nguyên quán">
            <Input placeholder="Nhập nguyên quán" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="nationality" label="Quốc tịch">
            <Input placeholder="Quốc tịch" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="maritalStatus" label="Tình trạng hôn nhân">
            <Select placeholder="Tình trạng hôn nhân" allowClear>
              <Select.Option value="SINGLE">Độc thân</Select.Option>
              <Select.Option value="MARRIED">Đã kết hôn</Select.Option>
              <Select.Option value="DIVORCED">Ly hôn</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="ethnicity" label="Dân tộc">
            <Select placeholder="Chọn dân tộc" allowClear>
              <Select.Option value="KINH">Kinh</Select.Option>
              <Select.Option value="OTHER">Khác</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="religion" label="Tôn giáo">
            <Select placeholder="Chọn tôn giáo" allowClear>
              <Select.Option value="NONE">Không</Select.Option>
              <Select.Option value="BUDDHISM">Phật giáo</Select.Option>
              <Select.Option value="CATHOLICISM">Công giáo</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="taxCode" label="Mã số thuế cá nhân">
            <Input placeholder="Nhập mã số thuế" />
          </Form.Item>
        </Col>
        <Col span={12} style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Item name="createUserAccount" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Checkbox>Tạo tài khoản đăng nhập cho nhân sự này (Mật khẩu mặc định: 123456aA@)</Checkbox>
          </Form.Item>
        </Col>
      </Row>

      <SectionTitle title="Thông tin công việc & Vận hành (Chuẩn 4 Phân hệ 1Office)" tooltip="Bắt buộc chọn Phòng ban, Vị trí, Chức vụ, Quản lý, GPS, Lương cơ bản để 4 phân hệ liên thông tự động" />
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="departmentId"
            label={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Phòng ban</span>
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuickDeptModalOpen(true);
                  }}
                  style={{ color: '#e83e8c', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}
                  title="Tạo nhanh phòng ban mới"
                >
                  + Tạo nhanh
                </span>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng chọn Phòng ban' }]}
            tooltip="Dùng để tự động gán ca và đổ vào Bảng công / Bảng lương"
          >
            <Select placeholder="Chọn phòng ban" allowClear showSearch optionFilterProp="children">
              {departments.map((d: any) => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="positionId"
            label={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Vị trí (chuyên môn)</span>
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuickPosModalOpen(true);
                  }}
                  style={{ color: '#e83e8c', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}
                  title="Tạo nhanh vị trí công việc mới"
                >
                  + Tạo nhanh
                </span>
              </div>
            }
            tooltip="Vị trí công việc cụ thể (ví dụ: Nhân viên bán hàng, Thu ngân, Marketing...) dùng làm bộ lọc phân ca và tính lương"
          >
            <Select placeholder="Chọn vị trí chuyên môn" allowClear showSearch optionFilterProp="children">
              {positions.map((p: any) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="jobTitleId"
            label={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Chức danh / Chức vụ</span>
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuickJobTitleModalOpen(true);
                  }}
                  style={{ color: '#e83e8c', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}
                  title="Tạo nhanh chức vụ mới"
                >
                  + Tạo nhanh
                </span>
              </div>
            }
            tooltip="Cấp bậc hành chính (ví dụ: Nhân viên, Quản lý, Trưởng phòng...)"
          >
            <Select placeholder="Chọn chức danh / chức vụ" allowClear showSearch optionFilterProp="children">
              {jobTitles.map((j: any) => <Select.Option key={j.id} value={j.id}>{j.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="managerId" label="Người quản lý trực tiếp" rules={[{ required: true, message: 'Vui lòng chọn Người quản lý trực tiếp' }]} tooltip="Bắt buộc để khi nhân viên gửi Đơn từ (nghỉ phép, OT) hệ thống gửi thông báo duyệt">
            <Select placeholder="Chọn người quản lý trực tiếp" allowClear showSearch optionFilterProp="children">
              {managers.map((m: any) => <Select.Option key={m.id} value={m.id}>{m.name} ({m.code}) — {m.department?.name || ''}</Select.Option>)}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="gpsLocation" label="Địa điểm chấm công GPS / Mã quẹt thẻ" rules={[{ required: true, message: 'Vui lòng nhập Địa điểm chấm công GPS' }]} tooltip="Cho phép nhân viên dập thẻ GPS trên mobile hoặc quẹt vân tay">
            <Input placeholder="Ví dụ: Tòa nhà 1Office Võ Văn Tần (GPS: 10.7626, 106.6602)" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="salaryBase" label="Lương cơ bản / Lương ngày công" rules={[{ required: true, message: 'Vui lòng nhập Lương cơ bản' }]} tooltip="Dùng để Bảng lương tự động tính LUONG_NC và BHXH">
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                style={{ width: '100%' }}
                formatter={val => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={val => Number(val?.replace(/\,/g, '') || 0)}
                placeholder="12,500,000"
              />
              <Button disabled style={{ background: '#f5f5f5', color: '#555' }}>VNĐ</Button>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="joinDate" label="Ngày vào làm" rules={[{ required: true, message: 'Vui lòng chọn Ngày vào làm' }]} tooltip="Bắt đầu tính chu kỳ chấm công và cấp 1 ngày phép năm">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày vào làm" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="officialContractDate" label="Ngày ký HĐLĐ chính thức">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày ký HĐLĐ" />
          </Form.Item>
        </Col>
      </Row>

      {/* Thông tin CMT/CC/CCCD/Hộ chiếu section matching 1Office UI exact screenshot */}
      <SectionTitle title="Thông tin CMT/CC/CCCD/Hộ chiếu" />
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="identityNo" label="Số CC/CCCD/CMT">
            <Input placeholder="Số CC/CCCD/CMT" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="identityIssueDate" label="Ngày cấp">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày cấp" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="identityIssuePlace" label="Nơi cấp">
            <Input placeholder="Nơi cấp" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <ImageUploadBox name="identityFrontImg" label="Ảnh CC/CCCD/CMND mặt trước" />
        </Col>
        <Col span={12}>
          <ImageUploadBox name="identityBackImg" label="Ảnh CC/CCCD/CMND mặt sau" />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="passportType" label="Loại hộ chiếu">
            <Select placeholder="Loại hộ chiếu" allowClear>
              <Select.Option value="PASSPORT_ORDINARY">Hộ chiếu phổ thông</Select.Option>
              <Select.Option value="PASSPORT_OFFICIAL">Hộ chiếu công vụ</Select.Option>
              <Select.Option value="PASSPORT_DIPLOMATIC">Hộ chiếu ngoại giao</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="passportNo" label="Số hộ chiếu">
            <Input placeholder="Số hộ chiếu" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="passportIssueDate" label="Ngày cấp">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày cấp" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="passportExpiryDate" label="Ngày hết hạn">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Ngày hết hạn" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="passportIssuePlace" label="Nơi cấp">
            <Input placeholder="Nơi cấp" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <ImageUploadBox name="passportImg" label="Ảnh hộ chiếu" />
        </Col>
      </Row>

      <SectionTitle title="Thông tin liên hệ" />
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="phone" label="Điện thoại">
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="email" label="Email">
            <Input placeholder="Nhập email" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="permanentAddress" label="Thường trú, số nhà, đường">
            <Input placeholder="Nhập địa chỉ thường trú" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="address" label="Chỗ ở hiện nay, số nhà, đường">
            <Input placeholder="Nhập chỗ ở hiện nay" />
          </Form.Item>
        </Col>
      </Row>

      <BankList />
      <WorkPermitList />
      <VisaList />
      <FamilyList />
      <EducationList />
      <PartyHistoryList />
      <ExperienceList />
      <CertificateList />
    </div>
  );

  return (
    <div className="employee-create-page">
      <div className="employee-create-header">
        <Button type="text" icon={<PortalIcon name="arrow" style={{ transform: 'rotate(180deg)' }} />} onClick={() => router.back()} />
        <Title level={4} style={{ margin: 0, marginLeft: 12 }}>
          Tạo mới hồ sơ nhân sự
        </Title>
      </div>

      <div className="employee-create-content">
        <Form form={form} layout="vertical" onFinish={handleFinish} className="employee-create-form">
          <Tabs defaultActiveKey="1" items={[
            { key: '1', label: 'Sơ yếu lý lịch', children: personalInfoTab },
            { key: '2', label: 'Hợp đồng', children: <div className="placeholder-tab">Đang phát triển</div> },
            { key: '3', label: 'Sức khỏe', children: <div className="placeholder-tab">Đang phát triển</div> },
            { key: '4', label: 'Tiếp nhận', children: <div className="placeholder-tab">Đang phát triển</div> },
            { key: '5', label: 'Đính kèm', children: <div className="placeholder-tab">Đang phát triển</div> },
          ]} />

          <div className="form-actions">
            <Button type="primary" htmlType="submit" loading={saving} style={{ backgroundColor: '#e83e8c', border: 'none' }}>CẬP NHẬT</Button>
            <Button onClick={() => router.back()} style={{ marginLeft: 12 }}>HỦY BỎ</Button>
          </div>
        </Form>
      </div>

      <DepartmentModal
        open={quickDeptModalOpen}
        onClose={() => setQuickDeptModalOpen(false)}
        onSuccess={(savedDept) => {
          refreshCatalogs();
          if (savedDept?.id) {
            form.setFieldValue('departmentId', savedDept.id);
          }
        }}
        departmentsList={departments}
      />

      <PositionModal
        open={quickPosModalOpen}
        onClose={() => setQuickPosModalOpen(false)}
        onSuccess={(savedPos) => {
          refreshCatalogs();
          if (savedPos?.id) {
            form.setFieldValue('positionId', savedPos.id);
          }
        }}
        positionsList={positions}
        jobTitlesList={jobTitles}
      />

      <JobTitleModal
        open={quickJobTitleModalOpen}
        onClose={() => setQuickJobTitleModalOpen(false)}
        onSuccess={(savedJobTitle) => {
          refreshCatalogs();
          if (savedJobTitle?.id) {
            form.setFieldValue('jobTitleId', savedJobTitle.id);
          }
        }}
      />
    </div>
  );
}

