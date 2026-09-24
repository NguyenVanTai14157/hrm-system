'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Tabs,
  Row,
  Col,
  Typography,
  Checkbox,
  Upload,
  Tooltip,
  Space,
  Spin,
  Alert,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { PortalIcon } from '@/components/portal-icon';
import { apiClient, authError } from '@/lib/api-client';
import {
  BankList,
  WorkPermitList,
  VisaList,
  FamilyList,
  EducationList,
  PartyHistoryList,
  ExperienceList,
  CertificateList,
} from './employee-dynamic-lists';
import { DepartmentModal } from '@/features/admin/department-modal';
import { PositionModal } from '@/features/employees/position-modal';
import { JobTitleModal } from '@/features/employees/job-title-modal';
import './employees.css';

const { Title } = Typography;

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

function EmployeeCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);

  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [loadingEmployee, setLoadingEmployee] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState<any>(null);
  const [employeeVersion, setEmployeeVersion] = useState<number>(0);
  const [legacyGpsText, setLegacyGpsText] = useState<string | null>(null);

  // Catalogs
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [managersData, setManagersData] = useState<{ items: any[] }>({ items: [] });
  const [loadingManagers, setLoadingManagers] = useState(false);

  // GPS Locations
  const [gpsLocations, setGpsLocations] = useState<any[]>([]);
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Quick modals
  const [quickDeptModalOpen, setQuickDeptModalOpen] = useState(false);
  const [quickPosModalOpen, setQuickPosModalOpen] = useState(false);
  const [quickJobTitleModalOpen, setQuickJobTitleModalOpen] = useState(false);

  const refreshCatalogs = () => {
    setLoadingCatalogs(true);
    apiClient
      .get('/employee-catalogs')
      .then((r) => {
        if (Array.isArray(r.data)) setCatalogs(r.data);
      })
      .catch((err) => {
        message.error('Lỗi tải danh mục: ' + authError(err));
      })
      .finally(() => {
        setLoadingCatalogs(false);
      });
  };

  const fetchGpsLocations = (active = true) => {
    setLoadingGps(true);
    setGpsError(null);
    apiClient
      .get('/employees/gps-locations')
      .then((r) => {
        if (active && Array.isArray(r.data)) {
          setGpsLocations(r.data);
        }
      })
      .catch((err) => {
        // Fallback to /attendance/settings/gps if needed
        apiClient
          .get('/attendance/settings/gps')
          .then((r) => {
            if (active && Array.isArray(r.data)) {
              setGpsLocations(r.data);
            }
          })
          .catch((e2) => {
            if (active) {
              const msg = authError(e2 || err);
              setGpsError(msg);
              console.error('Không thể tải địa điểm GPS:', msg);
            }
          });
      })
      .finally(() => {
        if (active) setLoadingGps(false);
      });
  };

  const fetchNextCodes = (active = true) => {
    if (isEdit) return;
    apiClient
      .get('/employees/next-code')
      .then((r) => {
        if (active && r.data) {
          if (r.data.code) {
            form.setFieldsValue({ code: r.data.code });
          }
          if (r.data.syncCode !== undefined && r.data.syncCode !== null) {
            form.setFieldsValue({ syncCode: String(r.data.syncCode) });
          }
        }
      })
      .catch(console.error);
  };

  const fetchManagers = (q = '', active = true) => {
    setLoadingManagers(true);
    apiClient
      .get('/employees', { params: { status: 'WORKING', pageSize: 100, q: q.trim() || undefined } })
      .then((r) => {
        if (active && r.data?.items) {
          setManagersData(r.data);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoadingManagers(false);
      });
  };

  // Initial load
  useEffect(() => {
    let active = true;
    refreshCatalogs();
    fetchGpsLocations(active);
    fetchManagers('', active);
    fetchNextCodes(active);

    return () => {
      active = false;
    };
  }, []);

  // Load employee detail for edit mode
  useEffect(() => {
    if (!editId) return;
    let active = true;
    setLoadingEmployee(true);

    apiClient
      .get(`/employees/${editId}`)
      .then((r) => {
        if (!active) return;
        const emp = r.data;
        if (!emp) return;

        setCurrentEmployee(emp);
        setEmployeeVersion(emp.version ?? 0);

        const gpsIds =
          emp.gpsLocationIds && emp.gpsLocationIds.length > 0
            ? emp.gpsLocationIds
            : (emp.gpsLocations || []).map((l: any) => l.gpsLocationId || l.id).filter(Boolean);

        if ((!gpsIds || gpsIds.length === 0) && emp.gpsLocation) {
          setLegacyGpsText(emp.gpsLocation);
        } else {
          setLegacyGpsText(null);
        }

        // Format identities
        let identityNo = '';
        let identityIssueDate: any = undefined;
        let identityIssuePlace = '';
        let identityFrontImg: any = undefined;
        let identityBackImg: any = undefined;

        let passportType = undefined;
        let passportNo = '';
        let passportIssueDate: any = undefined;
        let passportExpiryDate: any = undefined;
        let passportIssuePlace = '';
        let passportImg: any = undefined;

        if (Array.isArray(emp.identities)) {
          const cccd = emp.identities.find((i: any) => i.type === 'CCCD' || i.type === 'CMND');
          if (cccd) {
            identityNo = cccd.identityNo || '';
            identityIssueDate = cccd.issueDate ? dayjs(cccd.issueDate) : undefined;
            identityIssuePlace = cccd.issuePlace || '';
            identityFrontImg = cccd.frontImg;
            identityBackImg = cccd.backImg;
          }
          const pass = emp.identities.find((i: any) => i.type && i.type.startsWith('PASSPORT'));
          if (pass) {
            passportType = pass.type;
            passportNo = pass.identityNo || '';
            passportIssueDate = pass.issueDate ? dayjs(pass.issueDate) : undefined;
            passportExpiryDate = pass.expiryDate ? dayjs(pass.expiryDate) : undefined;
            passportIssuePlace = pass.issuePlace || '';
            passportImg = pass.frontImg;
          }
        }

        form.setFieldsValue({
          ...emp,
          birthday: emp.birthday ? dayjs(emp.birthday) : undefined,
          joinDate: emp.joinDate ? dayjs(emp.joinDate) : undefined,
          officialContractDate: emp.officialContractDate ? dayjs(emp.officialContractDate) : undefined,
          gpsLocationIds: gpsIds,
          identityNo,
          identityIssueDate,
          identityIssuePlace,
          identityFrontImg,
          identityBackImg,
          passportType,
          passportNo,
          passportIssueDate,
          passportExpiryDate,
          passportIssuePlace,
          passportImg,
          banks: emp.banks || [],
          workPermits: (emp.workPermits || []).map((w: any) => ({
            ...w,
            issueDate: w.issueDate ? dayjs(w.issueDate) : undefined,
            expiryDate: w.expiryDate ? dayjs(w.expiryDate) : undefined,
          })),
          visas: (emp.visas || []).map((v: any) => ({
            ...v,
            issueDate: v.issueDate ? dayjs(v.issueDate) : undefined,
            expiryDate: v.expiryDate ? dayjs(v.expiryDate) : undefined,
          })),
          families: (emp.families || []).map((f: any) => ({
            ...f,
            birthday: f.birthday ? dayjs(f.birthday) : undefined,
            issueDate: f.issueDate ? dayjs(f.issueDate) : undefined,
          })),
          educations: (emp.educations || []).map((e: any) => ({
            ...e,
            fromDate: e.fromDate ? dayjs(e.fromDate) : undefined,
            toDate: e.toDate ? dayjs(e.toDate) : undefined,
          })),
          partyHistories: (emp.partyHistories || []).map((p: any) => ({
            ...p,
            fromDate: p.fromDate ? dayjs(p.fromDate) : undefined,
            toDate: p.toDate ? dayjs(p.toDate) : undefined,
          })),
          experiences: (emp.experiences || []).map((ex: any) => ({
            ...ex,
            fromMonth: ex.fromMonth ? dayjs(ex.fromMonth) : undefined,
            toMonth: ex.toMonth ? dayjs(ex.toMonth) : undefined,
          })),
          certificates: (emp.certificates || []).map((c: any) => ({
            ...c,
            validFrom: c.validFrom ? dayjs(c.validFrom) : undefined,
            validTo: c.validTo ? dayjs(c.validTo) : undefined,
          })),
        });
      })
      .catch((err) => {
        message.error('Không thể tải thông tin hồ sơ: ' + authError(err));
      })
      .finally(() => {
        if (active) setLoadingEmployee(false);
      });

    return () => {
      active = false;
    };
  }, [editId, form, message]);

  // Catalogs filtered with support for inactive items of current record
  const departments = catalogs.filter(
    (c: any) => c.kind === 'DEPARTMENT' && (c.active || c.id === currentEmployee?.departmentId),
  );
  const positions = catalogs.filter(
    (c: any) => c.kind === 'POSITION' && (c.active || c.id === currentEmployee?.positionId),
  );
  const jobTitles = catalogs.filter(
    (c: any) => c.kind === 'JOB_TITLE' && (c.active || c.id === currentEmployee?.jobTitleId),
  );

  // Managers list with current manager included and current employee excluded
  const managerOptions = [
    ...(currentEmployee?.manager ? [currentEmployee.manager] : []),
    ...managersData.items,
  ]
    .filter((m: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === m.id) === i)
    .filter((m: any) => !editId || m.id !== editId);

  // Set of already assigned GPS location IDs for current employee
  const assignedGpsIds = new Set(
    (currentEmployee?.gpsLocations || []).map((l: any) => l.gpsLocationId || l.id),
  );

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
        identityNo,
        identityIssueDate,
        identityIssuePlace,
        identityFrontImg,
        identityBackImg,
        passportType,
        passportNo,
        passportIssueDate,
        passportExpiryDate,
        passportIssuePlace,
        passportImg,
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
        gpsLocationIds: Array.isArray(restValues.gpsLocationIds) ? restValues.gpsLocationIds : [],
        identities: identities.length > 0 ? identities : undefined,
        status: restValues.status || (isEdit ? currentEmployee?.status : 'WORKING'),
      };

      // Format dynamic lists if present
      if (Array.isArray(payload.workPermits)) {
        payload.workPermits = payload.workPermits.map((w: any) => ({
          ...w,
          issueDate: formatDate(w.issueDate),
          expiryDate: formatDate(w.expiryDate),
        }));
      }
      if (Array.isArray(payload.visas)) {
        payload.visas = payload.visas.map((v: any) => ({
          ...v,
          issueDate: formatDate(v.issueDate),
          expiryDate: formatDate(v.expiryDate),
        }));
      }
      if (Array.isArray(payload.families)) {
        payload.families = payload.families.map((f: any) => ({
          ...f,
          birthday: formatDate(f.birthday),
          issueDate: formatDate(f.issueDate),
        }));
      }
      if (Array.isArray(payload.educations)) {
        payload.educations = payload.educations.map((e: any) => ({
          ...e,
          fromDate: formatDate(e.fromDate),
          toDate: formatDate(e.toDate),
        }));
      }
      if (Array.isArray(payload.partyHistories)) {
        payload.partyHistories = payload.partyHistories.map((p: any) => ({
          ...p,
          fromDate: formatDate(p.fromDate),
          toDate: formatDate(p.toDate),
        }));
      }
      if (Array.isArray(payload.experiences)) {
        payload.experiences = payload.experiences.map((ex: any) => ({
          ...ex,
          fromMonth: formatDate(ex.fromMonth),
          toMonth: formatDate(ex.toMonth),
        }));
      }
      if (Array.isArray(payload.certificates)) {
        payload.certificates = payload.certificates.map((c: any) => ({
          ...c,
          validFrom: formatDate(c.validFrom),
          validTo: formatDate(c.validTo),
        }));
      }

      // Clean up empty string or null values for non-relation fields
      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === '' ||
          payload[key] === undefined ||
          payload[key] === null ||
          Number.isNaN(payload[key])
        ) {
          delete payload[key];
        }
      });

      if (isEdit && editId) {
        await apiClient.patch(`/employees/${editId}`, {
          ...payload,
          version: employeeVersion,
        });
        message.success('Đã cập nhật hồ sơ nhân sự thành công');
      } else {
        const res = await apiClient.post('/employees', payload);
        const codeInfo = res.data?.code ? ` [Mã NS: ${res.data.code}]` : '';
        message.success(`Đã tạo hồ sơ nhân sự thành công${codeInfo}`);
      }
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
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="code"
            label="Mã NS"
            tooltip="Hệ thống tự động cấp duy nhất khi lưu. Mã hiển thị là mã dự kiến; mã chính thức do hệ thống cấp tại thời điểm lưu."
            extra={<span style={{ fontSize: 11, color: '#64748b' }}>Hệ thống tự động cấp (Mã dự kiến)</span>}
          >
            <Input
              readOnly
              disabled
              className="locked-auto-code-input"
              placeholder="Đang cấp mã dự kiến..."
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            name="syncCode"
            label="Mã chấm công (Mã quẹt thẻ/vân tay)"
            tooltip="Mã định danh cá nhân duy nhất dùng cho thiết bị máy chấm công (quẹt thẻ / vân tay). Được hệ thống tự động cấp phát duy nhất."
            extra={<span style={{ fontSize: 11, color: '#64748b' }}>Hệ thống tự động cấp cho máy chấm công</span>}
          >
            <Input
              readOnly
              disabled
              className="locked-auto-code-input"
              placeholder="Đang cấp mã chấm công..."
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Form.Item name="workType" label="Mã hồ sơ">
            <Input placeholder="Mã hồ sơ cứng" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}>
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
            <Select placeholder="Chọn dân tộc" allowClear showSearch>
              <Select.Option value="KINH">Kinh</Select.Option>
              <Select.Option value="TAY">Tày</Select.Option>
              <Select.Option value="THAI">Thái</Select.Option>
              <Select.Option value="HOA">Hoa</Select.Option>
              <Select.Option value="KHMER">Khmer</Select.Option>
              <Select.Option value="MUONG">Mường</Select.Option>
              <Select.Option value="NUNG">Nùng</Select.Option>
              <Select.Option value="HMONG">H'Mông</Select.Option>
              <Select.Option value="DAO">Dao</Select.Option>
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
              <Select.Option value="PROTESTANTISM">Tin lành</Select.Option>
              <Select.Option value="OTHER">Khác</Select.Option>
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
        {!isEdit && (
          <Col span={12} style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Item name="createUserAccount" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Checkbox>Tạo tài khoản đăng nhập cho nhân sự này (Mật khẩu mặc định: 123456aA@)</Checkbox>
            </Form.Item>
          </Col>
        )}
      </Row>

      <SectionTitle
        title="Thông tin công việc & Vận hành (Chuẩn 4 Phân hệ 1Office)"
        tooltip="Bắt buộc chọn Phòng ban, Vị trí, Chức vụ, Quản lý, Địa điểm GPS, Lương cơ bản để 4 phân hệ liên thông tự động"
      />
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
            <Select
              placeholder="Chọn phòng ban"
              allowClear
              showSearch
              loading={loadingCatalogs}
              optionFilterProp="children"
              notFoundContent={
                loadingCatalogs ? (
                  <Spin size="small" />
                ) : (
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                    Chưa có phòng ban. Bấm <b>+ Tạo nhanh</b> hoặc vào Cài đặt tổ chức.
                  </div>
                )
              }
            >
              {departments.map((d: any) => (
                <Select.Option key={d.id} value={d.id}>
                  {d.name} {!d.active ? <span style={{ color: '#94a3b8' }}>[Ngừng dùng]</span> : ''}
                </Select.Option>
              ))}
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
            <Select
              placeholder="Chọn vị trí chuyên môn"
              allowClear
              showSearch
              loading={loadingCatalogs}
              optionFilterProp="children"
              notFoundContent={
                loadingCatalogs ? (
                  <Spin size="small" />
                ) : (
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                    Chưa có vị trí. Bấm <b>+ Tạo nhanh</b> để thêm mới.
                  </div>
                )
              }
            >
              {positions.map((p: any) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.name} {!p.active ? <span style={{ color: '#94a3b8' }}>[Ngừng dùng]</span> : ''}
                </Select.Option>
              ))}
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
            <Select
              placeholder="Chọn chức danh / chức vụ"
              allowClear
              showSearch
              loading={loadingCatalogs}
              optionFilterProp="children"
              notFoundContent={
                loadingCatalogs ? (
                  <Spin size="small" />
                ) : (
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                    Chưa có chức danh. Bấm <b>+ Tạo nhanh</b> để thêm mới.
                  </div>
                )
              }
            >
              {jobTitles.map((j: any) => (
                <Select.Option key={j.id} value={j.id}>
                  {j.name} {!j.active ? <span style={{ color: '#94a3b8' }}>[Ngừng dùng]</span> : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="managerId"
            label="Người quản lý trực tiếp"
            rules={[{ required: true, message: 'Vui lòng chọn Người quản lý trực tiếp' }]}
            tooltip="Bắt buộc để khi nhân viên gửi Đơn từ (nghỉ phép, OT) hệ thống gửi thông báo duyệt"
          >
            <Select
              placeholder="Tìm kiếm và chọn người quản lý trực tiếp"
              allowClear
              showSearch
              loading={loadingManagers}
              onSearch={(q) => fetchManagers(q)}
              filterOption={false}
              notFoundContent={
                loadingManagers ? (
                  <Spin size="small" />
                ) : (
                  <div style={{ padding: '8px 12px', textAlign: 'center' }}>Chưa có nhân sự đang làm việc phù hợp</div>
                )
              }
            >
              {managerOptions.map((m: any) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} ({m.code}) {m.department?.name ? `— ${m.department.name}` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="gpsLocationIds"
            label={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>Địa điểm chấm công GPS</span>
                <a
                  href="/hrm/attendance/settings"
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ color: '#e83e8c', fontSize: 12, fontWeight: 600 }}
                  title="Mở trang cài đặt địa điểm GPS để quản lý danh mục"
                >
                  ⚙️ Quản lý địa điểm
                </a>
              </div>
            }
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một địa điểm chấm công GPS' }]}
            tooltip="Chọn địa điểm chấm công đã lưu trong cơ sở dữ liệu để nhân viên dập thẻ GPS trên ứng dụng mobile. Bạn có thể chọn nhiều chi nhánh/văn phòng."
            extra={
              legacyGpsText ? (
                <div style={{ marginTop: 4, fontSize: 12, color: '#d97706' }}>
                  ℹ️ Dữ liệu cũ đang lưu dạng chuỗi: &quot;<b>{legacyGpsText}</b>&quot;. Vui lòng chọn địa điểm chuẩn trong danh sách trên để lưu liên kết ID chính thức.
                </div>
              ) : undefined
            }
          >
            <Select
              mode="multiple"
              allowClear
              showSearch
              loading={loadingGps}
              placeholder="Chọn địa điểm chấm công GPS đã lưu (chọn một hoặc nhiều)"
              filterOption={(input, option) => {
                const loc = gpsLocations.find((l) => l.id === option?.value);
                if (!loc) return false;
                const q = input.toLowerCase();
                return (
                  loc.name?.toLowerCase().includes(q) ||
                  loc.code?.toLowerCase().includes(q) ||
                  (loc.address && loc.address.toLowerCase().includes(q))
                );
              }}
              notFoundContent={
                loadingGps ? (
                  <div style={{ textAlign: 'center', padding: 12 }}>
                    <Spin size="small" /> Đang tải danh sách địa điểm...
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '12px 8px' }}>
                    <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>Chưa có địa điểm chấm công GPS nào được tạo.</p>
                    <a
                      href="/hrm/attendance/settings"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#e83e8c', fontWeight: 600, fontSize: 13 }}
                    >
                      + Thêm địa điểm GPS tại Cài đặt chấm công →
                    </a>
                  </div>
                )
              }
            >
              {gpsLocations.map((loc: any) => {
                const isAssigned = assignedGpsIds.has(loc.id);
                const isInactive = !loc.isActive;
                return (
                  <Select.Option
                    key={loc.id}
                    value={loc.id}
                    disabled={isInactive && !isAssigned}
                    label={`${loc.name} (${loc.code})`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', padding: '2px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, color: isInactive ? '#94a3b8' : '#1e293b' }}>
                          📍 {loc.name} {loc.code ? `(${loc.code})` : ''}
                        </span>
                        {isInactive && (
                          <Tag color="default" style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>
                            Ngừng hoạt động
                          </Tag>
                        )}
                        {loc.radius && (
                          <span style={{ fontSize: 11, color: '#0ea5e9' }}>
                            (Bán kính: {loc.radius}m)
                          </span>
                        )}
                      </div>
                      {loc.address ? (
                        <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{loc.address}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }}>
                          Chưa có địa chỉ chi tiết
                        </span>
                      )}
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {gpsError && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Không thể kết nối lấy danh sách địa điểm chấm công GPS"
          description={
            <div>
              <span>Lỗi: {gpsError}. Vui lòng kiểm tra quyền truy cập hoặc cấu hình tại </span>
              <a href="/hrm/attendance/settings" target="_blank" rel="noreferrer" style={{ color: '#e83e8c' }}>
                Cài đặt chấm công
              </a>.
            </div>
          }
        />
      )}

      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="salaryBase"
            label="Lương cơ bản / Lương ngày công"
            rules={[{ required: true, message: 'Vui lòng nhập Lương cơ bản' }]}
            tooltip="Dùng để Bảng lương tự động tính LUONG_NC và BHXH"
          >
            <Space.Compact style={{ width: '100%' }}>
              <InputNumber
                style={{ width: '100%' }}
                formatter={(val) => `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(val) => Number(val?.replace(/\,/g, '') || 0)}
                placeholder="12,500,000"
              />
              <Button disabled style={{ background: '#f5f5f5', color: '#555' }}>
                VNĐ
              </Button>
            </Space.Compact>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="joinDate"
            label="Ngày vào làm"
            rules={[{ required: true, message: 'Vui lòng chọn Ngày vào làm' }]}
            tooltip="Bắt đầu tính chu kỳ chấm công và cấp 1 ngày phép năm"
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày vào làm" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="officialContractDate" label="Ngày ký HĐLĐ chính thức">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày ký HĐLĐ" />
          </Form.Item>
        </Col>
      </Row>

      {/* Thông tin CMT/CC/CCCD/Hộ chiếu */}
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
        <Button
          type="text"
          icon={<PortalIcon name="arrow" style={{ transform: 'rotate(180deg)' }} />}
          onClick={() => router.back()}
        />
        <Title level={4} style={{ margin: 0, marginLeft: 12 }}>
          {isEdit
            ? `Cập nhật hồ sơ nhân sự${currentEmployee?.name ? `: ${currentEmployee.name}` : ''}${currentEmployee?.code ? ` (${currentEmployee.code})` : ''}`
            : 'Tạo mới hồ sơ nhân sự'}
        </Title>
      </div>

      <div className="employee-create-content">
        <Spin spinning={loadingEmployee}>
          <Form form={form} layout="vertical" onFinish={handleFinish} className="employee-create-form">
            <Tabs
              defaultActiveKey="1"
              items={[
                { key: '1', label: 'Sơ yếu lý lịch', children: personalInfoTab },
                { key: '2', label: 'Hợp đồng', children: <div className="placeholder-tab">Đang phát triển</div> },
                { key: '3', label: 'Sức khỏe', children: <div className="placeholder-tab">Đang phát triển</div> },
                { key: '4', label: 'Tiếp nhận', children: <div className="placeholder-tab">Đang phát triển</div> },
                { key: '5', label: 'Đính kèm', children: <div className="placeholder-tab">Đang phát triển</div> },
              ]}
            />

            <div className="form-actions">
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                style={{ backgroundColor: '#e83e8c', border: 'none' }}
              >
                {isEdit ? 'LƯU THAY ĐỔI' : 'CẬP NHẬT'}
              </Button>
              <Button onClick={() => router.back()} style={{ marginLeft: 12 }}>
                HỦY BỎ
              </Button>
            </div>
          </Form>
        </Spin>
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

export function EmployeeCreateScreen() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      }
    >
      <EmployeeCreateForm />
    </Suspense>
  );
}
