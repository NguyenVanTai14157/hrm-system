'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Button,
  Input,
  Select,
  Dropdown,
  message,
} from 'antd';
import {
  RightOutlined,
  ClockCircleOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  LinkOutlined,
  TableOutlined,
  SmileOutlined,
  AudioOutlined,
  CloseOutlined,
  SearchOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  ClearOutlined,
  UndoOutlined,
  RedoOutlined,
  FullscreenOutlined,
  ArrowLeftOutlined,
  DownOutlined,
  AlignLeftOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/components/auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';
import { apiClient } from '@/lib/api-client';

export const applicationTypes = [
  { key: 'leave', label: 'Đơn xin nghỉ', title: 'đơn xin nghỉ', defaultType: 'Đơn xin nghỉ phép' },
  { key: 'overtime', label: 'Đơn làm thêm', title: 'đơn làm thêm', defaultType: 'Đơn làm thêm giờ OT' },
  { key: 'inout', label: 'Đơn checkin/out', title: 'đơn checkin/out', defaultType: 'Đơn checkin/out' },
  { key: 'shift_change', label: 'Đơn đổi ca', title: 'đơn đổi ca', defaultType: 'Đơn đổi ca' },
  { key: 'overtime_plus', label: 'Đơn tăng ca', title: 'đơn tăng ca', defaultType: 'Đơn tăng ca' },
  { key: 'shift_register', label: 'Đơn đăng ký ca', title: 'đơn đăng ký ca', defaultType: 'Đơn đăng ký ca' },
  { key: 'resignation', label: 'Đơn thôi việc', title: 'đơn xin thôi việc', defaultType: 'Đơn xin thôi việc' },
];

export function ApplicationCreateScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTypeKey = searchParams.get('type') || 'leave';

  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);
  const employeeId = user?.employeeId;

  const [currentTypeKey, setCurrentTypeKey] = useState(initialTypeKey);
  const currentType = applicationTypes.find((t) => t.key === currentTypeKey) || applicationTypes[0];

  const [submitting, setSubmitting] = useState(false);
  const [shifts, setShifts] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Update current type when searchParams change
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && applicationTypes.some((t) => t.key === typeParam)) {
      setCurrentTypeKey(typeParam);
    }
  }, [searchParams]);

  // Common form fields
  const [description, setDescription] = useState('');
  const [relatedPerson, setRelatedPerson] = useState<string | undefined>(undefined);

  // 1. Leave (Đơn xin nghỉ)
  const [leaveReason, setLeaveReason] = useState<string | undefined>(undefined);
  const [leavePaidWork, setLeavePaidWork] = useState('Không');
  const [leaveStartTime, setLeaveStartTime] = useState('');
  const [leaveStartDate, setLeaveStartDate] = useState('2026-09-21');
  const [leaveEndTime, setLeaveEndTime] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-09-21');

  // 2. Overtime (Đơn làm thêm)
  const [otDate, setOtDate] = useState('2026-09-21');
  const [otStartTime, setOtStartTime] = useState('');
  const [otEndTime, setOtEndTime] = useState('');
  const [otShift, setOtShift] = useState('Không có ca');
  const [otReason, setOtReason] = useState<string | undefined>(undefined);
  const [otCloseType, setOtCloseType] = useState<string | undefined>(undefined);
  const [otLocation, setOtLocation] = useState('');
  const [otNote, setOtNote] = useState('');

  // 3. In/Out (Đơn checkin/out)
  const [inOutDate, setInOutDate] = useState('2026-09-21');
  const [inOutTime, setInOutTime] = useState('');
  const [inOutShift, setInOutShift] = useState<string | undefined>(undefined);
  const [inOutReason, setInOutReason] = useState<string | undefined>(undefined);
  const [inOutFine, setInOutFine] = useState('Có');

  // 4. Shift Change (Đơn đổi ca)
  const [shiftChangeMode, setShiftChangeMode] = useState('Chính mình');
  const [shiftChangeOriginDate, setShiftChangeOriginDate] = useState('2026-09-21');
  const [shiftChangeOriginShift, setShiftChangeOriginShift] = useState<string | undefined>(undefined);
  const [shiftChangeTargetDate, setShiftChangeTargetDate] = useState('2026-09-21');
  const [shiftChangeTargetShift, setShiftChangeTargetShift] = useState<string | undefined>(undefined);

  // 5. Overtime Plus (Đơn tăng ca)
  const [otPlusDate, setOtPlusDate] = useState('2026-09-21');
  const [otPlusRelatedShift, setOtPlusRelatedShift] = useState<string | undefined>(undefined);
  const [otPlusShift, setOtPlusShift] = useState<string | undefined>(undefined);
  const [otPlusRequireLock, setOtPlusRequireLock] = useState('Có');
  const [otPlusReason, setOtPlusReason] = useState<string | undefined>(undefined);

  // 6. Shift Register (Đơn đăng ký ca)
  const [regMode, setRegMode] = useState('Theo khoảng ngày');
  const [regFromDate, setRegFromDate] = useState('2026-09-21');
  const [regToDate, setRegToDate] = useState('2026-09-21');
  const [regDetailDate, setRegDetailDate] = useState('2026-09-21');
  const [regDetailShift, setRegDetailShift] = useState<string | undefined>(undefined);

  // 7. Resignation (Đơn xin thôi việc)
  const [resignReason, setResignReason] = useState<string | undefined>(undefined);
  const [resignSubmitDate, setResignSubmitDate] = useState('2026-09-21');
  const [resignLastWorkDate, setResignLastWorkDate] = useState('2026-09-20');
  const [resignEffectiveDate, setResignEffectiveDate] = useState('2026-09-21');

  useEffect(() => {
    apiClient.get('/attendance/shifts').then((res) => {
      if (res.data) setShifts(res.data);
    }).catch(() => {});

    apiClient.get('/employees?pageSize=100').then((res) => {
      if (res.data?.items) setEmployees(res.data.items);
    }).catch(() => {});
  }, []);

  const handleSelectType = (key: string) => {
    setCurrentTypeKey(key);
    router.replace(`/hrm/applications/create?type=${key}`);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let targetEmployeeId = employeeId;
      if (!targetEmployeeId && employees.length > 0) {
        targetEmployeeId = employees[0].id;
      }
      if (!targetEmployeeId) {
        message.warning('Không tìm thấy mã nhân viên của bạn trong hệ thống.');
        setSubmitting(false);
        return;
      }

      let payloadData: any = {};
      let finalReason = '';

      if (currentTypeKey === 'leave') {
        finalReason = leaveReason || 'Nghỉ phép năm';
        payloadData = {
          leaveReason: finalReason,
          leavePaidWork,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          startTime: leaveStartTime,
          endTime: leaveEndTime,
        };
      } else if (currentTypeKey === 'overtime') {
        finalReason = otReason || 'Làm thêm ngoài giờ';
        payloadData = {
          otDate,
          startTime: otStartTime,
          endTime: otEndTime,
          shift: otShift,
          otReason: finalReason,
          closeType: otCloseType,
          location: otLocation,
          note: otNote,
        };
      } else if (currentTypeKey === 'inout') {
        finalReason = inOutReason || 'Giải trình check in/out';
        payloadData = {
          date: inOutDate,
          time: inOutTime,
          shift: inOutShift,
          reason: finalReason,
          fine: inOutFine,
        };
      } else if (currentTypeKey === 'shift_change') {
        finalReason = `Đổi ca ${shiftChangeMode}`;
        payloadData = {
          mode: shiftChangeMode,
          originDate: shiftChangeOriginDate,
          originShift: shiftChangeOriginShift,
          targetDate: shiftChangeTargetDate,
          targetShift: shiftChangeTargetShift,
        };
      } else if (currentTypeKey === 'overtime_plus') {
        finalReason = otPlusReason || 'Tăng ca';
        payloadData = {
          date: otPlusDate,
          relatedShift: otPlusRelatedShift,
          shift: otPlusShift,
          requireLock: otPlusRequireLock,
          reason: finalReason,
        };
      } else if (currentTypeKey === 'shift_register') {
        finalReason = 'Đăng ký ca làm việc';
        payloadData = {
          mode: regMode,
          fromDate: regFromDate,
          toDate: regToDate,
          detailDate: regDetailDate,
          shift: regDetailShift,
        };
      } else if (currentTypeKey === 'resignation') {
        finalReason = resignReason || 'Thôi việc theo nguyện vọng cá nhân';
        payloadData = {
          submitDate: resignSubmitDate,
          lastWorkDate: resignLastWorkDate,
          effectiveDate: resignEffectiveDate,
          reason: finalReason,
        };
      } else {
        finalReason = 'Đơn đề nghị';
        payloadData = { date: '2026-09-21' };
      }

      await apiClient.post('/applications', {
        employeeId: targetEmployeeId,
        type: currentType.defaultType,
        reason: finalReason,
        description: description || finalReason,
        payload: payloadData,
      });

      message.success(`Khởi tạo ${currentType.title} thành công!`);
      router.push('/hrm/applications');
    } catch (err: any) {
      message.error(err.message || 'Lỗi khi khởi tạo đơn từ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%', padding: '16px 28px 80px', boxSizing: 'border-box' }}>
      {/* Unified Navigation & Type Selector Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          background: '#ffffff',
          padding: '10px 20px',
          borderRadius: 6,
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined style={{ fontSize: 13 }} />}
            onClick={() => router.push('/hrm/applications')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#64748b',
              fontWeight: 600,
              fontSize: 13.5,
              padding: '4px 10px',
              height: 32,
              borderRadius: 4,
            }}
          >
            Danh sách đơn từ
          </Button>

          <span style={{ color: '#cbd5e1', fontSize: 15 }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 22,
                height: 22,
                border: '1.5px solid #ef4444',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                fontWeight: 800,
                fontSize: 15,
                lineHeight: 1,
                backgroundColor: '#ffffff',
              }}
            >
              +
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              Tạo mới:
            </span>

            {/* Dropdown Type Selector */}
            <Dropdown
              menu={{
                items: applicationTypes.map((t) => ({
                  key: t.key,
                  label: (
                    <div
                      style={{
                        padding: '6px 14px',
                        fontWeight: currentTypeKey === t.key ? 700 : 500,
                        color: currentTypeKey === t.key ? '#ef4444' : '#1e293b',
                        fontSize: 13.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minWidth: 160,
                      }}
                    >
                      <span>{t.label}</span>
                      {currentTypeKey === t.key && <span style={{ color: '#ef4444', marginLeft: 8 }}>✓</span>}
                    </div>
                  ),
                  onClick: () => handleSelectType(t.key),
                })),
              }}
              placement="bottomLeft"
              trigger={['click', 'hover']}
            >
              <Button
                style={{
                  borderRadius: 4,
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  fontWeight: 600,
                  fontSize: 13.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 14px',
                  height: 34,
                  color: '#0f172a',
                }}
              >
                <span>{currentType.label}</span>
                <DownOutlined style={{ fontSize: 10, color: '#64748b' }} />
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* Search box right-aligned */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Input
            placeholder="Tìm kiếm"
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ width: 220, borderRadius: 4, height: 34 }}
          />
        </div>
      </div>

      {/* Main Form Box with spacious padding */}
      <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #e2e8f0', padding: '28px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
        {/* ================= SECTION 1: THÔNG TIN CHUNG ================= */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
            <span style={{ fontSize: 11, transform: 'scaleY(0.7)' }}>˅</span>
            <span>Thông tin chung</span>
          </div>

          {/* TYPE 1: ĐƠN XIN NGHỈ */}
          {currentTypeKey === 'leave' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Lý do <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn lý do"
                    value={leaveReason}
                    onChange={setLeaveReason}
                    options={[
                      { value: 'Nghỉ phép năm (hưởng nguyên lương)', label: 'Nghỉ phép năm (hưởng nguyên lương)' },
                      { value: 'Nghỉ ốm đau có giấy bệnh viện', label: 'Nghỉ ốm đau có giấy bệnh viện' },
                      { value: 'Nghỉ việc riêng (kết hôn, tang lễ)', label: 'Nghỉ việc riêng (kết hôn, tang lễ)' },
                      { value: 'Nghỉ không hưởng lương', label: 'Nghỉ không hưởng lương' },
                      { value: 'Nghỉ chế độ thai sản', label: 'Nghỉ chế độ thai sản' },
                      { value: 'Lý do khác', label: 'Lý do khác' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Tính công
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    value={leavePaidWork}
                    onChange={setLeavePaidWork}
                    options={[
                      { value: 'Không', label: 'Không' },
                      { value: 'Có', label: 'Có' },
                    ]}
                  />
                </div>
              </div>

              {/* Time & Date Range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 1.2fr 1.8fr 40px', gap: 16, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Từ giờ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input
                    placeholder="hh:mm"
                    suffix={<ClockCircleOutlined style={{ color: '#94a3b8' }} />}
                    value={leaveStartTime}
                    onChange={(e) => setLeaveStartTime(e.target.value)}
                    style={{ height: 38, fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Từ ngày <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    style={{ height: 38, fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Đến giờ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input
                    placeholder="hh:mm"
                    suffix={<ClockCircleOutlined style={{ color: '#94a3b8' }} />}
                    value={leaveEndTime}
                    onChange={(e) => setLeaveEndTime(e.target.value)}
                    style={{ height: 38, fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Đến ngày <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    style={{ height: 38, fontSize: 13.5 }}
                  />
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <Button type="text" icon={<CloseOutlined />} style={{ color: '#94a3b8' }} />
                </div>
              </div>

              {/* Red plus circle (+) */}
              <div style={{ marginTop: 2 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1.5px solid #ef4444',
                    color: '#ef4444',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Thêm khoảng thời gian"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* TYPE 2: ĐƠN LÀM THÊM */}
          {currentTypeKey === 'overtime' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1.1fr 1.8fr 1.8fr 1.3fr 1.8fr 1.2fr 36px', gap: 12, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày làm thêm <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input type="date" value={otDate} onChange={(e) => setOtDate(e.target.value)} style={{ height: 38, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Từ giờ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input placeholder="Từ" suffix={<ClockCircleOutlined style={{ color: '#94a3b8' }} />} value={otStartTime} onChange={(e) => setOtStartTime(e.target.value)} style={{ height: 38, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Đến giờ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input placeholder="Đến" suffix={<ClockCircleOutlined style={{ color: '#94a3b8' }} />} value={otEndTime} onChange={(e) => setOtEndTime(e.target.value)} style={{ height: 38, fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ca làm việc
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    value={otShift}
                    onChange={setOtShift}
                    options={[
                      { value: 'Không có ca', label: 'Không có ca' },
                      ...shifts.map((s) => ({ value: s.name, label: s.name })),
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Lý do
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn lý do"
                    value={otReason}
                    onChange={setOtReason}
                    options={[
                      { value: 'Hỗ trợ hoàn thành chỉ tiêu cuối tháng', label: 'Hỗ trợ chỉ tiêu cuối tháng' },
                      { value: 'Xử lý đơn hàng tồn kho gấp', label: 'Xử lý đơn hàng tồn kho gấp' },
                      { value: 'Dự án cao điểm theo chỉ đạo', label: 'Dự án cao điểm theo chỉ đạo' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Chốt
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn..."
                    value={otCloseType}
                    onChange={setOtCloseType}
                    options={[
                      { value: 'Tính tiền OT', label: 'Tính tiền OT' },
                      { value: 'Nghỉ bù', label: 'Nghỉ bù' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Địa điểm chấm công
                  </label>
                  <Input
                    placeholder="Tìm kiếm"
                    suffix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    value={otLocation}
                    onChange={(e) => setOtLocation(e.target.value)}
                    style={{ height: 38, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ghi chú
                  </label>
                  <Input placeholder="--" value={otNote} onChange={(e) => setOtNote(e.target.value)} style={{ height: 38, fontSize: 13 }} />
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <RightOutlined style={{ color: '#94a3b8', fontSize: 12 }} />
                </div>
              </div>

              {/* Red plus circle (+) */}
              <div style={{ marginTop: 2 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1.5px solid #ef4444',
                    color: '#ef4444',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Thêm ca làm thêm"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* TYPE 3: ĐƠN CHECKIN/OUT */}
          {currentTypeKey === 'inout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr 2fr 2.4fr 1.2fr 40px', gap: 16, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input type="date" value={inOutDate} onChange={(e) => setInOutDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Giờ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input
                    placeholder="hh:mm"
                    suffix={<ClockCircleOutlined style={{ color: '#94a3b8' }} />}
                    value={inOutTime}
                    onChange={(e) => setInOutTime(e.target.value)}
                    style={{ height: 38, fontSize: 13.5 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ca
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn một"
                    value={inOutShift}
                    onChange={setInOutShift}
                    options={[
                      { value: 'Ca hành chính (08:00 - 17:30)', label: 'Ca hành chính (08:00 - 17:30)' },
                      ...shifts.map((s) => ({ value: s.name, label: s.name })),
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Lý do <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn lý do"
                    value={inOutReason}
                    onChange={setInOutReason}
                    options={[
                      { value: 'Quên quẹt thẻ vào ca sáng', label: 'Quên quẹt thẻ vào ca sáng' },
                      { value: 'Quên quẹt thẻ ra ca chiều', label: 'Quên quẹt thẻ ra ca chiều' },
                      { value: 'Máy chấm công mất kết nối / không nhận vân tay', label: 'Máy chấm công mất kết nối' },
                      { value: 'Đi công tác / gặp đối tác đột xuất', label: 'Đi công tác / gặp đối tác đột xuất' },
                      { value: 'Khác', label: 'Khác' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Phạt tiền
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    value={inOutFine}
                    onChange={setInOutFine}
                    options={[
                      { value: 'Có', label: 'Có' },
                      { value: 'Không', label: 'Không' },
                    ]}
                  />
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <Button type="text" icon={<CloseOutlined />} style={{ color: '#94a3b8' }} />
                </div>
              </div>

              {/* Red plus circle (+) */}
              <div style={{ marginTop: 2 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1.5px solid #ef4444',
                    color: '#ef4444',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Thêm thời gian checkin/out"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* TYPE 4: ĐƠN ĐỔI CA */}
          {currentTypeKey === 'shift_change' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ maxWidth: 360 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Kiểu đổi ca
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    value={shiftChangeMode}
                    onChange={setShiftChangeMode}
                    options={[
                      { value: 'Chính mình', label: 'Chính mình' },
                      { value: 'Với đồng nghiệp', label: 'Với đồng nghiệp' },
                    ]}
                  />
                  <Button type="text" icon={<CloseOutlined />} style={{ color: '#94a3b8' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.5fr 2fr 40px', gap: 16, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày cần đổi <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input type="date" value={shiftChangeOriginDate} onChange={(e) => setShiftChangeOriginDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ca cần đổi <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn ca"
                    value={shiftChangeOriginShift}
                    onChange={setShiftChangeOriginShift}
                    options={[
                      { value: 'Ca hành chính (08:00 - 17:30)', label: 'Ca hành chính (08:00 - 17:30)' },
                      ...shifts.map((s) => ({ value: s.name, label: s.name })),
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày đổi
                  </label>
                  <Input type="date" value={shiftChangeTargetDate} onChange={(e) => setShiftChangeTargetDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ca muốn làm <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn ca"
                    value={shiftChangeTargetShift}
                    onChange={setShiftChangeTargetShift}
                    options={[
                      { value: 'Ca tối (18:00 - 22:00)', label: 'Ca tối (18:00 - 22:00)' },
                      ...shifts.map((s) => ({ value: s.name, label: s.name })),
                    ]}
                  />
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <Button type="text" icon={<CloseOutlined />} style={{ color: '#94a3b8' }} />
                </div>
              </div>

              {/* Red plus circle (+) */}
              <div style={{ marginTop: 2 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1.5px solid #ef4444',
                    color: '#ef4444',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Thêm ca đổi"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* TYPE 5: ĐƠN TĂNG CA */}
          {currentTypeKey === 'overtime_plus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.8fr 1.8fr 1.2fr 2.4fr 40px', gap: 16, alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày tăng ca <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input type="date" value={otPlusDate} onChange={(e) => setOtPlusDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ca liên quan <ClockCircleOutlined style={{ color: '#f59e0b', fontSize: 12, marginLeft: 2 }} />
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Ca liên quan"
                    value={otPlusRelatedShift}
                    onChange={setOtPlusRelatedShift}
                    options={[
                      { value: 'Ca hành chính (08:00 - 17:30)', label: 'Ca hành chính (08:00 - 17:30)' },
                      ...shifts.map((s) => ({ value: s.name, label: s.name })),
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ca tăng <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn ca"
                    value={otPlusShift}
                    onChange={setOtPlusShift}
                    options={[
                      { value: 'Tăng ca 1 (17:30 - 19:30)', label: 'Tăng ca 1 (17:30 - 19:30)' },
                      { value: 'Tăng ca 2 (17:30 - 21:00)', label: 'Tăng ca 2 (17:30 - 21:00)' },
                      { value: 'Tăng ca đêm (22:00 - 06:00)', label: 'Tăng ca đêm (22:00 - 06:00)' },
                      ...shifts.map((s) => ({ value: s.name, label: s.name })),
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Yêu cầu chốt <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    value={otPlusRequireLock}
                    onChange={setOtPlusRequireLock}
                    options={[
                      { value: 'Có', label: 'Có' },
                      { value: 'Không', label: 'Không' },
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Lý do
                  </label>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    placeholder="Chọn lý do"
                    value={otPlusReason}
                    onChange={setOtPlusReason}
                    options={[
                      { value: 'Hoàn thành tiến độ đơn hàng gấp', label: 'Hoàn thành tiến độ đơn hàng gấp' },
                      { value: 'Phục vụ chương trình khuyến mãi cao điểm', label: 'Phục vụ chương trình khuyến mãi' },
                      { value: 'Trực ca thay nhân sự nghỉ đột xuất', label: 'Trực ca thay nhân sự nghỉ đột xuất' },
                      { value: 'Lý do khác', label: 'Lý do khác' },
                    ]}
                  />
                </div>
                <div style={{ paddingBottom: 6 }}>
                  <Button type="text" icon={<CloseOutlined />} style={{ color: '#94a3b8' }} />
                </div>
              </div>

              {/* Red plus circle (+) */}
              <div style={{ marginTop: 2 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1.5px solid #ef4444',
                    color: '#ef4444',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                  }}
                  title="Thêm ca tăng"
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* TYPE 6: ĐƠN ĐĂNG KÝ CA */}
          {currentTypeKey === 'shift_register' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Section 1 Fields: Kiểu đăng ký & Từ ngày - Đến ngày */}
              <div style={{ maxWidth: 360 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Kiểu đăng ký <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Select
                    style={{ width: '100%', height: 38 }}
                    value={regMode}
                    onChange={setRegMode}
                    options={[
                      { value: 'Theo khoảng ngày', label: 'Theo khoảng ngày' },
                      { value: 'Theo từng ngày', label: 'Theo từng ngày' },
                    ]}
                  />
                  <Button type="text" icon={<CloseOutlined />} style={{ color: '#94a3b8' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 640 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Từ ngày <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input type="date" value={regFromDate} onChange={(e) => setRegFromDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Đến ngày <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input type="date" value={regToDate} onChange={(e) => setRegToDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
              </div>

              {/* Section 2: Chi tiết đăng ký ca */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, transform: 'scaleY(0.7)' }}>˅</span>
                  <span>Chi tiết đăng ký ca</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 640 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Ngày
                    </label>
                    <Input type="date" value={regDetailDate} onChange={(e) => setRegDetailDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                      Ca
                    </label>
                    <Select
                      style={{ width: '100%', height: 38 }}
                      placeholder="Chọn ca ..."
                      value={regDetailShift}
                      onChange={setRegDetailShift}
                      options={[
                        { value: 'Ca hành chính (08:00 - 17:30)', label: 'Ca hành chính (08:00 - 17:30)' },
                        { value: 'Ca sáng (08:00 - 12:00)', label: 'Ca sáng (08:00 - 12:00)' },
                        { value: 'Ca chiều (13:30 - 17:30)', label: 'Ca chiều (13:30 - 17:30)' },
                        { value: 'Ca tối (18:00 - 22:00)', label: 'Ca tối (18:00 - 22:00)' },
                        ...shifts.map((s) => ({ value: s.name, label: s.name })),
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TYPE 7: ĐƠN XIN THÔI VIỆC */}
          {currentTypeKey === 'resignation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Lý do thôi việc <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <Select
                  style={{ width: '100%', height: 38 }}
                  placeholder="Lý do thôi việc"
                  value={resignReason}
                  onChange={setResignReason}
                  options={[
                    { value: 'Định hướng cá nhân mới', label: 'Định hướng cá nhân mới' },
                    { value: 'Lý do gia đình / chuyển nơi sinh sống', label: 'Lý do gia đình / chuyển nơi sinh sống' },
                    { value: 'Sức khỏe không đảm bảo', label: 'Sức khỏe không đảm bảo' },
                    { value: 'Học tập nâng cao trình độ', label: 'Học tập nâng cao trình độ' },
                    { value: 'Khác', label: 'Khác' },
                  ]}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày nộp đơn
                  </label>
                  <Input type="date" value={resignSubmitDate} onChange={(e) => setResignSubmitDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày làm việc cuối
                  </label>
                  <Input type="date" value={resignLastWorkDate} onChange={(e) => setResignLastWorkDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Ngày thôi việc <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <Input type="date" value={resignEffectiveDate} onChange={(e) => setResignEffectiveDate(e.target.value)} style={{ height: 38, fontSize: 13.5 }} />
                </div>
              </div>
            </div>
          )}

          {/* Mô tả: Rich text toolbar for leave/overtime/inout/shift_change/overtime_plus, simple input for shift_register & resignation */}
          <div style={{ marginTop: 22 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Mô tả <span style={{ color: '#ef4444' }}>*</span>
            </label>

            {currentTypeKey === 'shift_register' || currentTypeKey === 'resignation' ? (
              <Input
                placeholder={currentTypeKey === 'resignation' ? 'Nhập mô tả...' : 'Nhập mô tả'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ height: 40, borderRadius: 4, fontSize: 14 }}
              />
            ) : (
              <div style={{ border: '1px solid #d1d5db', borderRadius: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '8px 14px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    color: '#64748b',
                    fontSize: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <AudioOutlined title="Ghi âm" style={{ cursor: 'pointer' }} />
                  <LinkOutlined title="Chèn liên kết" style={{ cursor: 'pointer' }} />
                  <span title="Màu chữ" style={{ fontWeight: 700, textDecoration: 'underline red', cursor: 'pointer' }}>A</span>
                  <SmileOutlined title="Biểu tượng cảm xúc" style={{ cursor: 'pointer' }} />
                  <AlignLeftOutlined title="Căn lề" style={{ cursor: 'pointer' }} />
                  <BgColorsOutlined title="Màu nền" style={{ cursor: 'pointer' }} />
                  <span title="Nhắc đến ai đó" style={{ fontWeight: 600, cursor: 'pointer' }}>@</span>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <BoldOutlined title="In đậm" style={{ cursor: 'pointer' }} />
                  <ItalicOutlined title="In nghiêng" style={{ cursor: 'pointer' }} />
                  <StrikethroughOutlined title="Gạch ngang" style={{ cursor: 'pointer' }} />
                  <UnderlineOutlined title="Gạch chân" style={{ cursor: 'pointer' }} />
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <UnorderedListOutlined title="Danh sách không thứ tự" style={{ cursor: 'pointer' }} />
                  <OrderedListOutlined title="Danh sách thứ tự" style={{ cursor: 'pointer' }} />
                  <TableOutlined title="Bảng" style={{ cursor: 'pointer' }} />
                  <ClearOutlined title="Xóa định dạng" style={{ cursor: 'pointer' }} />
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <UndoOutlined title="Hoàn tác" style={{ cursor: 'pointer' }} />
                  <RedoOutlined title="Làm lại" style={{ cursor: 'pointer' }} />
                  <FullscreenOutlined title="Toàn màn hình" style={{ cursor: 'pointer' }} />
                </div>
                <Input.TextArea
                  rows={6}
                  bordered={false}
                  placeholder="Nhập mô tả"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ padding: 14, fontSize: 14, minHeight: 140 }}
                />
              </div>
            )}
          </div>

          {/* Attachment upload zone */}
          <div style={{ marginTop: 22 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Đính kèm
            </label>
            <div
              style={{
                border: '1.5px dashed #cbd5e1',
                borderRadius: 6,
                padding: '36px 20px',
                textAlign: 'center',
                background: '#ffffff',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#fef2f2',
                  border: '1px solid #fee2e2',
                  margin: '0 auto 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  fontSize: 22,
                }}
              >
                <CloudUploadOutlined />
              </div>
              <div style={{ fontSize: 13.5, color: '#64748b', marginBottom: 14 }}>
                Kéo thả file vào đây để tải lên hoặc
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <Button
                  danger
                  type="primary"
                  icon={<UploadOutlined />}
                  style={{
                    background: '#ef4444',
                    borderColor: '#ef4444',
                    borderRadius: 4,
                    fontWeight: 600,
                    fontSize: 13,
                    height: 34,
                    padding: '0 18px',
                  }}
                >
                  CHỌN TỪ MÁY
                </Button>
                <Button
                  icon={<CloudUploadOutlined />}
                  style={{
                    borderRadius: 4,
                    fontWeight: 600,
                    fontSize: 13,
                    height: 34,
                    borderColor: '#cbd5e1',
                    padding: '0 18px',
                  }}
                >
                  CHỌN TỪ CLOUD
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: ĐỐI TƯỢNG LIÊN QUAN ================= */}
        {currentTypeKey !== 'shift_change' && currentTypeKey !== 'shift_register' && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 11, transform: 'scaleY(0.7)' }}>˅</span>
              <span>Đối tượng liên quan</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px', gap: 10, maxWidth: 560, alignItems: 'center' }}>
              <Select
                style={{ width: '100%', height: 38 }}
                placeholder="Đối tượng liên quan"
                value={relatedPerson}
                onChange={setRelatedPerson}
                options={employees.map((e) => ({
                  value: e.id,
                  label: `${e.name} (${e.code}) - ${e.department?.name || 'Phòng ban'}`,
                }))}
              />
              <Button type="text" icon={<CloseOutlined />} onClick={() => setRelatedPerson(undefined)} style={{ color: '#94a3b8' }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '1.5px solid #ef4444',
                  color: '#ef4444',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
                title="Thêm đối tượng liên quan"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Bottom Action Bar: [ CẬP NHẬT ] [ HỦY BỎ ] */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <Button
            type="primary"
            danger
            loading={submitting}
            onClick={handleSubmit}
            style={{
              background: '#ef4444',
              borderColor: '#ef4444',
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
              padding: '0 28px',
              height: 38,
              letterSpacing: '0.3px',
            }}
          >
            CẬP NHẬT
          </Button>
          <Button
            onClick={() => router.push('/hrm/applications')}
            style={{
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 13,
              padding: '0 22px',
              height: 38,
              borderColor: '#cbd5e1',
              color: '#334155',
            }}
          >
            HỦY BỎ
          </Button>
        </div>
      </div>
    </div>
  );
}
