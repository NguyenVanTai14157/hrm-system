'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Input,
  InputNumber,
  Button,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Switch,
  Radio,
  Tag,
  App,
  Checkbox,
  Space,
  Tooltip,
  Row,
  Col,
  Drawer,
  Avatar,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  UserAddOutlined,
  SearchOutlined,
  UploadOutlined,
  CloudUploadOutlined,
  PaperClipOutlined,
  FilterOutlined,
  SettingOutlined,
  CloseOutlined,
  ArrowLeftOutlined,
  QuestionCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  SmileOutlined,
  SendOutlined,
  EditOutlined,
  CopyOutlined,
  MessageOutlined,
  FolderOpenOutlined,
  MinusOutlined,
  DeleteOutlined,
  RightOutlined,
  LeftOutlined,
  DownOutlined,
  FileTextOutlined,
  SlidersOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '@/lib/api-client';
import './attendance.css';

interface ShiftRuleItem {
  id: string;
  title: string;
  category: 'Ca kíp' | 'Hành chính';
  assignmentType: 'Phân ca cho cá nhân' | 'Phân ca cho phòng ban, vị trí';
  repeatType: 'Lập theo tuần' | 'Theo ngày cố định' | 'Lập theo chu kỳ ngày' | 'Theo khoảng ngày';
  startDate: string;
  endDate: string;
  status: 'Đã duyệt' | 'Chờ duyệt';
  createdAt: string;
  departmentName?: string;
  positionName?: string;
  jobTitleName?: string;
  shiftName?: string;
  groupKey?: string;
  assignments?: any[];
  mondayShift?: string;
  tuesdayShift?: string;
  wednesdayShift?: string;
  thursdayShift?: string;
  fridayShift?: string;
  saturdayOddShift?: string;
  saturdayEvenShift?: string;
  sundayShift?: string;
}

function groupAssignmentsToRules(assignments: any[]): ShiftRuleItem[] {
  if (!assignments || assignments.length === 0) return [];

  const rawGroups: Record<string, any[]> = {};
  assignments.forEach((a) => {
    const titleVal = a.title?.trim();
    const deptId = a.employee?.department?.id || a.employee?.departmentId;
    const monthKey = dayjs(a.date).format('YYYY-MM');
    const groupKey = titleVal ? `title_${titleVal}` : (deptId ? `${deptId}_${monthKey}` : `${a.employeeId || 'all'}_${monthKey}`);

    if (!rawGroups[groupKey]) rawGroups[groupKey] = [];
    rawGroups[groupKey].push(a);
  });

  const result: ShiftRuleItem[] = [];

  for (const [groupKey, groupItems] of Object.entries(rawGroups)) {
    // Check if there are DRAFT assignments in this group (edited version pending approval)
    const draftItems = groupItems.filter((a) => a.status === 'DRAFT');
    const hasDraft = draftItems.length > 0;

    // If there is a DRAFT version, Admin view displays the DRAFT version.
    // Otherwise Admin displays the non-draft version (APPROVED or PENDING).
    const activeAssignments = hasDraft ? draftItems : groupItems;
    const firstItem = activeAssignments[0] || groupItems[0];

    const empName = firstItem.employee?.name || firstItem.employee?.code || 'Cá nhân';
    const deptName = firstItem.employee?.department?.name || 'Toàn hệ thống';
    const posName = firstItem.employee?.position?.name || firstItem.employee?.jobTitle?.name || 'Nhân viên';
    const shiftName = firstItem.shift?.name || 'Ca làm việc';
    const monthStr = dayjs(firstItem.date).format('MM/YYYY');
    const titleVal = firstItem.title?.trim();
    const repType = firstItem.repeatType || (shiftName.toLowerCase().includes('kíp') ? 'Lập theo chu kỳ ngày' : 'Lập theo tuần');

    let startDate = dayjs(firstItem.date).format('DD/MM/YYYY');
    let endDate = dayjs(firstItem.date).format('DD/MM/YYYY');

    activeAssignments.forEach((a) => {
      const d = dayjs(a.date);
      if (d.isBefore(dayjs(startDate, 'DD/MM/YYYY'))) startDate = d.format('DD/MM/YYYY');
      if (d.isAfter(dayjs(endDate, 'DD/MM/YYYY'))) endDate = d.format('DD/MM/YYYY');
    });

    // If there is a DRAFT, it is 'Chờ duyệt'
    // If all active assignments are APPROVED, it is 'Đã duyệt'
    // Otherwise 'Chờ duyệt'
    const isAllApproved = !hasDraft && activeAssignments.every((a) => a.status === 'APPROVED');
    const ruleStatus: 'Đã duyệt' | 'Chờ duyệt' = isAllApproved ? 'Đã duyệt' : 'Chờ duyệt';

    result.push({
      id: firstItem.id || `sr-${Date.now()}-${Math.random()}`,
      title: titleVal || (firstItem.employee?.department?.name
        ? `Phân ca ${firstItem.employee.department.name} - T${monthStr}`
        : `Phân ca ${empName} - T${monthStr}`),
      category: shiftName.toLowerCase().includes('kíp') || repType === 'Lập theo chu kỳ ngày' ? 'Ca kíp' : 'Hành chính',
      assignmentType: firstItem.employee?.department?.name
        ? 'Phân ca cho phòng ban, vị trí'
        : 'Phân ca cho cá nhân',
      repeatType: repType,
      startDate,
      endDate,
      status: ruleStatus,
      createdAt: dayjs(firstItem.createdAt || firstItem.date).format('DD/MM/YYYY'),
      departmentName: deptName,
      positionName: posName,
      shiftName: shiftName,
      groupKey: groupKey,
      assignments: activeAssignments,
    });
  }

  return result;
}

export function ShiftsScreen() {
  const { message } = App.useApp();
  const [shiftRules, setShiftRules] = useState<ShiftRuleItem[]>([]);
  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [selectedDetailRule, setSelectedDetailRule] = useState<ShiftRuleItem | null>(null);

  // Detail Approval & Edit States (1Office Workflow)
  const [detailStatus, setDetailStatus] = useState<'Đã duyệt' | 'Chờ duyệt'>('Đã duyệt');
  const [isDetailEditing, setIsDetailEditing] = useState<boolean>(false);
  const [detailRuleAssignments, setDetailRuleAssignments] = useState<any[]>([]);
  const [submittingDetailEdit, setSubmittingDetailEdit] = useState<boolean>(false);

  useEffect(() => {
    if (selectedDetailRule) {
      setDetailStatus(selectedDetailRule.status || 'Đã duyệt');
      setIsDetailEditing(false);
      setDetailRuleAssignments(selectedDetailRule.assignments || []);
    } else {
      setIsDetailEditing(false);
      setDetailRuleAssignments([]);
    }
  }, [selectedDetailRule]);
  const [discussionComments, setDiscussionComments] = useState<{ id: string; author: string; time: string; text: string }[]>([]);
  const [commentText, setCommentText] = useState('');
  const [activeRightTab, setActiveRightTab] = useState<'discussion' | 'history'>('discussion');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Context Menu State (1Office Image 2)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    record: ShiftRuleItem | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    record: null,
  });

  // Close context menu on outside click or scroll
  useEffect(() => {
    const handleClose = () => {
      setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  // Settings & Shift Template States
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createShiftTemplateModalOpen, setCreateShiftTemplateModalOpen] = useState(false);
  const [submittingTemplate, setSubmittingTemplate] = useState(false);

  // Catalog option lists
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [shiftsList, setShiftsList] = useState<any[]>([]);

  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [employeeShiftRows, setEmployeeShiftRows] = useState<any[]>([{ id: 'row-1' }]);

  const [form] = Form.useForm();
  const [templateForm] = Form.useForm();
  const currentAssignmentType = Form.useWatch('assignmentType', form);
  const watchedRepeatType = Form.useWatch('repeatType', form) || 'Lập theo tuần';
  const watchedDeptIds: string[] = Form.useWatch('departmentIds', form) || [];
  const watchedPosIds: string[] = Form.useWatch('positionIds', form) || [];
  const watchedJobTitleIds: string[] = Form.useWatch('jobTitleIds', form) || [];

  // State for "Theo ngày cố định" (Image 2)
  const [fixedDateRows, setFixedDateRows] = useState<{ id: string; date: dayjs.Dayjs; shiftId?: string }[]>([
    { id: 'fdr-1', date: dayjs(), shiftId: undefined },
  ]);

  // State for "Lập theo chu kỳ ngày" (Image 3)
  const [cycleDaysCount, setCycleDaysCount] = useState<number>(3);
  const [cycleShifts, setCycleShifts] = useState<Record<number, string>>({});

  // State for "Theo khoảng ngày" (Image 4)
  const [rangeShiftId, setRangeShiftId] = useState<string | undefined>(undefined);

  const matchedEmployees = useMemo(() => {
    return employeesList.filter((emp) => {
      if (emp.status && emp.status !== 'WORKING' && emp.status !== 'ACTIVE') return false;
      const deptId = emp.departmentId || emp.department?.id;
      const posId = emp.positionId || emp.position?.id;
      const jobTitleId = emp.jobTitleId || emp.jobTitle?.id;

      if (Array.isArray(watchedDeptIds) && watchedDeptIds.length > 0) {
        if (!deptId || !watchedDeptIds.includes(deptId)) return false;
      }
      if (Array.isArray(watchedPosIds) && watchedPosIds.length > 0) {
        if (!posId || !watchedPosIds.includes(posId)) return false;
      }
      if (Array.isArray(watchedJobTitleIds) && watchedJobTitleIds.length > 0) {
        if (!jobTitleId || !watchedJobTitleIds.includes(jobTitleId)) return false;
      }
      return true;
    });
  }, [employeesList, watchedDeptIds, watchedPosIds, watchedJobTitleIds]);

  // 🎯 Auto-fill rows directly with matched employees from filters (1Office style)
  useEffect(() => {
    const hasFilter =
      (Array.isArray(watchedDeptIds) && watchedDeptIds.length > 0) ||
      (Array.isArray(watchedPosIds) && watchedPosIds.length > 0) ||
      (Array.isArray(watchedJobTitleIds) && watchedJobTitleIds.length > 0);

    if (hasFilter) {
      if (matchedEmployees.length > 0) {
        setEmployeeShiftRows((prevRows) => {
          return matchedEmployees.map((emp) => {
            const existing = prevRows.find((r) => r.employeeId === emp.id);
            if (existing) {
              return {
                ...existing,
                code: emp.code,
                name: emp.name,
                position: emp.position?.name || emp.position || '',
                department: emp.department?.name || emp.department || '',
              };
            }
            return {
              id: emp.id,
              employeeId: emp.id,
              code: emp.code,
              name: emp.name,
              position: emp.position?.name || emp.position || '',
              department: emp.department?.name || emp.department || '',
            };
          });
        });
      } else {
        setEmployeeShiftRows([{ id: `row-${Date.now()}` }]);
      }
    }
  }, [matchedEmployees, watchedDeptIds, watchedPosIds, watchedJobTitleIds]);

  const handleSelectEmployeeForRow = (empId: string, rowIndex: number) => {
    if (!empId) {
      setEmployeeShiftRows((prev) => {
        const next = [...prev];
        next[rowIndex] = {
          ...next[rowIndex],
          employeeId: undefined,
          code: '',
          name: '',
          position: '',
          department: '',
        };
        return next;
      });
      return;
    }

    const emp = employeesList.find((e) => e.id === empId);
    if (!emp) return;

    setEmployeeShiftRows((prev) => {
      const next = [...prev];
      next[rowIndex] = {
        ...next[rowIndex],
        employeeId: emp.id,
        code: emp.code,
        name: emp.name,
        position: emp.position?.name || emp.position || '',
        department: emp.department?.name || emp.department || '',
      };
      return next;
    });
  };

  const handleChangeRowShift = (rowIndex: number, field: string, val?: string) => {
    setEmployeeShiftRows((prev) => {
      const next = [...prev];
      next[rowIndex] = {
        ...next[rowIndex],
        [field]: val,
      };
      return next;
    });
  };

  const handleAddEmployeeRow = () => {
    setEmployeeShiftRows((prev) => [...prev, { id: `row-${Date.now()}` }]);
  };

  const handleDeleteEmployeeRow = (index: number) => {
    if (employeeShiftRows.length <= 1) {
      setEmployeeShiftRows([{ id: `row-${Date.now()}` }]);
      return;
    }
    setEmployeeShiftRows((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const monthStr = dayjs().format('YYYY-MM');
      const [catalogsRes, shiftsRes, assignmentsRes, employeesRes] = await Promise.all([
        apiClient.get('/employee-catalogs').catch(() => apiClient.get('/attendance/catalogs').catch(() => ({ data: [] }))),
        apiClient.get('/attendance/shifts').catch(() => ({ data: [] })),
        apiClient.get(`/attendance/shift-assignments?month=${monthStr}`).catch(() => ({ data: [] })),
        apiClient.get('/attendance/employees').catch(() => apiClient.get('/employees?pageSize=200').catch(() => ({ data: [] }))),
      ]);

      const empList = Array.isArray(employeesRes.data)
        ? employeesRes.data
        : employeesRes.data?.items && Array.isArray(employeesRes.data.items)
        ? employeesRes.data.items
        : [];
      setEmployeesList(empList);

      const catList = Array.isArray(catalogsRes.data)
        ? catalogsRes.data
        : catalogsRes.data?.items && Array.isArray(catalogsRes.data.items)
        ? catalogsRes.data.items
        : [];
      setDepartments(catList.filter((c: any) => c.kind === 'DEPARTMENT'));
      setPositions(catList.filter((c: any) => c.kind === 'POSITION'));
      setJobTitles(catList.filter((c: any) => c.kind === 'JOB_TITLE'));

      if (shiftsRes.data && Array.isArray(shiftsRes.data)) {
        setShiftsList(shiftsRes.data);
      }

      if (assignmentsRes.data && Array.isArray(assignmentsRes.data)) {
        setRawAssignments(assignmentsRes.data);
        const mapped = groupAssignmentsToRules(assignmentsRes.data);
        setShiftRules(mapped);
        setSelectedDetailRule((prev) => {
          if (!prev) return null;
          const found = mapped.find(
            (r) => (r.title && prev.title && r.title.trim() === prev.title.trim()) || r.id === prev.id
          );
          return found || prev;
        });
      } else {
        setRawAssignments([]);
        setShiftRules([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu phân ca:', err);
      setShiftRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open "Tạo mới phân ca" form modal
  const handleOpenCreateModal = () => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const endOfMonthStr = dayjs().endOf('month').format('YYYY-MM-DD');
    form.setFieldsValue({
      title: '',
      assignmentType: 'Phân ca cho phòng ban, vị trí',
      category: 'Ca kíp',
      repeatType: 'Lập theo tuần',
      startDate: dayjs(todayStr),
      endDate: dayjs(endOfMonthStr),
      departmentIds: [],
      positionIds: [],
      jobTitleIds: [],
      mondayShift: undefined,
      tuesdayShift: undefined,
      wednesdayShift: undefined,
      thursdayShift: undefined,
      fridayShift: undefined,
      saturdayOddShift: undefined,
      saturdayEvenShift: undefined,
      sundayShift: undefined,
    });
    setEmployeeShiftRows([{ id: 'row-1' }]);
    setFixedDateRows([{ id: `fdr-${Date.now()}`, date: dayjs(), shiftId: undefined }]);
    setCycleDaysCount(3);
    setCycleShifts({});
    setRangeShiftId(undefined);
    setIsCreateMode(true);
  };

  // Open "Tạo mới ca làm việc" modal (Image 3 & 4)
  const handleOpenCreateTemplateModal = () => {
    templateForm.setFieldsValue({
      code: '',
      name: '',
      multipleIntervals: false,
      active: true,
      startTime: dayjs('08:00', 'HH:mm'),
      endTime: dayjs('17:30', 'HH:mm'),
      overnight: 'Không',
      breakStart: dayjs('12:00', 'HH:mm'),
      breakEnd: dayjs('13:30', 'HH:mm'),
      checkInEarly: dayjs('01:00', 'HH:mm'),
      checkOutLate: dayjs('04:00', 'HH:mm'),
      totalHours: '8',
      standardHours: 1,
      flexibleOption: 'Không áp dụng',
      recalculateLeave: false,
      autoDetectDept: false,
      autoHoliday: false,
      autoTimekeep: false,
      autoCheckout: false,
      midShiftCheckoutRequired: false,
      midShiftOvertime: 'NO_ACCEPT',
      midShiftLateEarly: false,
      gpsOption: 'Chấm công qua GPS',
    });
    setCreateShiftTemplateModalOpen(true);
  };

  // Submit "Tạo mới ca làm việc" (Shift template) form
  const handleCreateShiftTemplateSubmit = async (values: any) => {
    setSubmittingTemplate(true);
    try {
      const startTimeStr = values.startTime ? dayjs(values.startTime).format('HH:mm') : '08:00';
      const endTimeStr = values.endTime ? dayjs(values.endTime).format('HH:mm') : '17:30';
      const breakStartStr = values.breakStart ? dayjs(values.breakStart).format('HH:mm') : '12:00';
      const breakEndStr = values.breakEnd ? dayjs(values.breakEnd).format('HH:mm') : '13:30';

      const payload = {
        code: values.code || `CA_${Date.now()}`,
        name: values.name,
        startTime: startTimeStr,
        endTime: endTimeStr,
        breakStart: breakStartStr,
        breakEnd: breakEndStr,
        standardHours: Number(values.standardHours) || 1,
        graceLateMinutes: 15,
        color: 'green',
        description: values.description || '',
      };

      await apiClient.post('/attendance/shifts', payload);
      message.success('✅ Đã tạo mới ca làm việc thành công!');
      setCreateShiftTemplateModalOpen(false);
      templateForm.resetFields();
      await fetchData();
    } catch (err: any) {
      console.error('Lỗi khi tạo mới ca làm việc:', err);
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo mới ca làm việc');
    } finally {
      setSubmittingTemplate(false);
    }
  };

  // Submit "Tạo mới phân ca" form
  const handleCreateShiftSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const repeatType = values.repeatType || 'Lập theo tuần';
      let startDate = values.startDate ? dayjs(values.startDate) : dayjs();
      let endDate = values.endDate ? dayjs(values.endDate) : dayjs().endOf('month');

      if (repeatType === 'Theo ngày cố định') {
        const validDates = fixedDateRows.filter((r) => r.date && r.date.isValid());
        if (validDates.length === 0) {
          message.warning('Vui lòng chọn ít nhất một ngày cố định');
          setSubmitting(false);
          return;
        }
        const sorted = [...validDates].sort((a, b) => a.date.valueOf() - b.date.valueOf());
        startDate = sorted[0].date;
        endDate = sorted[sorted.length - 1].date;
      }

      const selectedDeptNames = watchedDeptIds && watchedDeptIds.length > 0
        ? departments.filter((d) => watchedDeptIds.includes(d.id)).map((d) => d.name).join(', ')
        : '';
      const autoTitle = selectedDeptNames
        ? `Phân ca ${selectedDeptNames} - T${startDate.format('MM/YYYY')}`
        : `Phân ca - ${startDate.format('DD/MM/YYYY')}`;
      const scheduleTitle = values.title?.trim() || autoTitle;

      const bulkAssignments: { employeeId: string; shiftId: string; date: string; title?: string; repeatType?: string; status?: string }[] = [];
      const targetEmpIds: string[] = [];

      // Determine target employees
      const targetEmployees = matchedEmployees.length > 0 ? matchedEmployees : employeesList;
      if (targetEmployees.length === 0) {
        message.warning('Không tìm thấy nhân viên phù hợp với bộ lọc để phân ca');
        setSubmitting(false);
        return;
      }
      targetEmployees.forEach((e) => targetEmpIds.push(e.id));

      // ── CASE 1: Lập theo tuần (Ảnh 1) ──────────────────────────────────────────
      if (repeatType === 'Lập theo tuần') {
        const dateList: dayjs.Dayjs[] = [];
        let curr = startDate.clone();
        while (curr.isBefore(endDate) || curr.isSame(endDate, 'day')) {
          dateList.push(curr.clone());
          curr = curr.add(1, 'day');
        }

        const isPersonal = values.assignmentType === 'Phân ca cá nhân';
        if (isPersonal) {
          const validRows = employeeShiftRows.filter((r) => r.employeeId);
          if (validRows.length === 0) {
            message.warning('Vui lòng chọn ít nhất một nhân sự để phân ca');
            setSubmitting(false);
            return;
          }

          for (const row of validRows) {
            for (const d of dateList) {
              const dow = d.day(); // 0=Sun, 1=Mon, ..., 6=Sat
              let shiftId: string | undefined;

              if (dow === 1) shiftId = row.mondayShift;
              else if (dow === 2) shiftId = row.tuesdayShift;
              else if (dow === 3) shiftId = row.wednesdayShift;
              else if (dow === 4) shiftId = row.thursdayShift;
              else if (dow === 5) shiftId = row.fridayShift;
              else if (dow === 6) {
                const weekNum = Math.ceil(d.date() / 7);
                shiftId =
                  (weekNum % 2 !== 0 ? row.saturdayOddShift : row.saturdayEvenShift) ||
                  row.saturdayOddShift ||
                  row.saturdayEvenShift ||
                  row.saturdayShift;
              } else if (dow === 0) {
                shiftId = row.sundayShift;
              }

              if (shiftId) {
                bulkAssignments.push({
                  employeeId: row.employeeId,
                  shiftId,
                  date: d.format('YYYY-MM-DD'),
                  title: scheduleTitle,
                  repeatType: repeatType,
                  status: 'PENDING',
                });
              }
            }
          }
        } else {
          for (const emp of targetEmployees) {
            for (const d of dateList) {
              const dow = d.day();
              let shiftId: string | undefined;

              if (dow === 1) shiftId = values.mondayShift;
              else if (dow === 2) shiftId = values.tuesdayShift;
              else if (dow === 3) shiftId = values.wednesdayShift;
              else if (dow === 4) shiftId = values.thursdayShift;
              else if (dow === 5) shiftId = values.fridayShift;
              else if (dow === 6) {
                const weekNum = Math.ceil(d.date() / 7);
                shiftId =
                  (weekNum % 2 !== 0 ? values.saturdayOddShift : values.saturdayEvenShift) ||
                  values.saturdayOddShift ||
                  values.saturdayEvenShift ||
                  values.saturdayShift;
              } else if (dow === 0) {
                shiftId = values.sundayShift;
              }

              if (shiftId) {
                bulkAssignments.push({
                  employeeId: emp.id,
                  shiftId,
                  date: d.format('YYYY-MM-DD'),
                  title: scheduleTitle,
                  repeatType: repeatType,
                  status: 'PENDING',
                });
              }
            }
          }
        }
      }
      // ── CASE 2: Theo ngày cố định (Ảnh 2) ─────────────────────────────────────
      else if (repeatType === 'Theo ngày cố định') {
        const validRows = fixedDateRows.filter((r) => r.date && r.shiftId);
        if (validRows.length === 0) {
          message.warning('Vui lòng chọn ngày và ca làm việc cho ít nhất một ngày cố định');
          setSubmitting(false);
          return;
        }

        for (const emp of targetEmployees) {
          for (const row of validRows) {
            bulkAssignments.push({
              employeeId: emp.id,
              shiftId: row.shiftId!,
              date: row.date.format('YYYY-MM-DD'),
              title: scheduleTitle,
              repeatType: repeatType,
              status: 'PENDING',
            });
          }
        }
      }
      // ── CASE 3: Lập theo chu kỳ ngày (Ảnh 3) ───────────────────────────────────
      else if (repeatType === 'Lập theo chu kỳ ngày') {
        const nDays = Math.max(Number(cycleDaysCount) || 3, 1);
        const hasAnyShift = Object.values(cycleShifts).some(Boolean);
        if (!hasAnyShift) {
          message.warning('Vui lòng chọn ca làm việc cho ít nhất một ngày trong chu kỳ');
          setSubmitting(false);
          return;
        }

        const dateList: dayjs.Dayjs[] = [];
        let curr = startDate.clone();
        while (curr.isBefore(endDate) || curr.isSame(endDate, 'day')) {
          dateList.push(curr.clone());
          curr = curr.add(1, 'day');
        }

        for (const emp of targetEmployees) {
          for (const d of dateList) {
            const diffDays = d.diff(startDate, 'day');
            if (diffDays >= 0) {
              const dayInCycle = (diffDays % nDays) + 1;
              const shiftId = cycleShifts[dayInCycle];
              if (shiftId) {
                bulkAssignments.push({
                  employeeId: emp.id,
                  shiftId,
                  date: d.format('YYYY-MM-DD'),
                  title: scheduleTitle,
                  repeatType: repeatType,
                  status: 'PENDING',
                });
              }
            }
          }
        }
      }
      // ── CASE 4: Theo khoảng ngày (Ảnh 4) ───────────────────────────────────────
      else if (repeatType === 'Theo khoảng ngày') {
        const shiftIdToUse = rangeShiftId || values.rangeShiftId;
        if (!shiftIdToUse) {
          message.warning('Vui lòng chọn ca làm việc áp dụng cho khoảng ngày');
          setSubmitting(false);
          return;
        }

        const dateList: dayjs.Dayjs[] = [];
        let curr = startDate.clone();
        while (curr.isBefore(endDate) || curr.isSame(endDate, 'day')) {
          dateList.push(curr.clone());
          curr = curr.add(1, 'day');
        }

        for (const emp of targetEmployees) {
          for (const d of dateList) {
            bulkAssignments.push({
              employeeId: emp.id,
              shiftId: shiftIdToUse,
              date: d.format('YYYY-MM-DD'),
              title: scheduleTitle,
              repeatType: repeatType,
              status: 'PENDING',
            });
          }
        }
      }

      if (bulkAssignments.length === 0) {
        message.warning('Vui lòng chọn ít nhất một ca làm việc');
        setSubmitting(false);
        return;
      }

      // Only clear stale assignments belonging to the SAME schedule title (e.g. if re-saving/updating)
      // Never delete assignments belonging to other schedules!
      const newKeySet = new Set(bulkAssignments.map((a) => `${a.employeeId}_${a.date}`));
      const staleIds = rawAssignments
        .filter((a) => {
          const dStr = dayjs(a.date).format('YYYY-MM-DD');
          const isSameTitle = (a.title || '').trim() === scheduleTitle;
          return (
            isSameTitle &&
            targetEmpIds.includes(a.employeeId || a.employee?.id) &&
            dStr >= startDate.format('YYYY-MM-DD') &&
            dStr <= endDate.format('YYYY-MM-DD') &&
            !newKeySet.has(`${a.employeeId || a.employee?.id}_${dStr}`)
          );
        })
        .map((a) => a.id)
        .filter(Boolean);

      if (staleIds.length > 0) {
        await apiClient.post('/attendance/shift-assignments/delete', { ids: staleIds }).catch(() => {});
      }

      await apiClient.post('/attendance/shift-assignments/bulk', {
        assignments: bulkAssignments,
      });

      message.success('✅ Đã tạo mới phân ca và lưu vào cơ sở dữ liệu thành công!');
      setIsCreateMode(false);
      form.resetFields();
      setEmployeeShiftRows([{ id: 'row-1' }]);
      await fetchData();
    } catch (err: any) {
      console.error('Lỗi khi tạo mới phân ca:', err);
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo mới phân ca');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRules = shiftRules.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.assignmentType.toLowerCase().includes(q) ||
      (r.departmentName && r.departmentName.toLowerCase().includes(q))
    );
  });

  // Helper to add discussion comment
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    setDiscussionComments((prev) => [
      ...prev,
      {
        id: `cmt-${Date.now()}`,
        author: 'Admin',
        time: dayjs().format('DD/MM/YYYY HH:mm'),
        text: commentText.trim(),
      },
    ]);
    setCommentText('');
  };

  // Helper to get date list for Detail matrix table
  const getDateRangeDays = (startDateStr?: string, endDateStr?: string) => {
    const start = startDateStr ? dayjs(startDateStr, 'DD/MM/YYYY') : dayjs();
    const end = endDateStr ? dayjs(endDateStr, 'DD/MM/YYYY') : start.add(6, 'day');
    const validStart = start.isValid() ? start : dayjs();
    const validEnd = end.isValid() ? end : validStart.add(6, 'day');
    const diff = validEnd.diff(validStart, 'day');
    const count = Math.min(Math.max(diff + 1, 1), 31);

    const days: dayjs.Dayjs[] = [];
    for (let i = 0; i < count; i++) {
      days.push(validStart.add(i, 'day'));
    }
    return days;
  };

  const vnDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Helper to get unique employees for a rule (support dynamic detail editing)
  const getEmployeesInRule = (rule: ShiftRuleItem) => {
    const empMap = new Map<string, any>();
    const sourceAssignments = detailRuleAssignments.length > 0 ? detailRuleAssignments : (rule.assignments || []);

    sourceAssignments.forEach((a: any) => {
      const emp = a.employee || employeesList.find((e) => e.id === (a.employeeId || a.employee?.id));
      if (emp && !empMap.has(emp.id)) {
        empMap.set(emp.id, emp);
      }
    });

    if (empMap.size > 0) {
      return Array.from(empMap.values());
    }

    const matched = employeesList.filter((e) =>
      rule.departmentName && (e.department?.name === rule.departmentName || e.department === rule.departmentName)
    );
    if (matched.length > 0) return matched;
    return employeesList.slice(0, 3);
  };

  // Helper to get assigned shift on a day for employee
  const getShiftForEmpDate = (empId: string, d: dayjs.Dayjs, rule: ShiftRuleItem) => {
    const dateStr = d.format('YYYY-MM-DD');
    const dow = d.day();

    const source = detailRuleAssignments.length > 0
      ? detailRuleAssignments
      : (rule.assignments && rule.assignments.length > 0 ? rule.assignments : rawAssignments);
      
    const match = source.find(
      (a: any) =>
        (a.employeeId === empId || a.employee?.id === empId) &&
        dayjs(a.date).format('YYYY-MM-DD') === dateStr
    );
    if (match) {
      return match.shift?.name || match.shift?.code || 'Ca làm việc';
    }

    if (dow === 0) {
      return 'Nghỉ tuần';
    }

    return 'Nghỉ';
  };

  // Helper to get assigned shift ID on a day for employee
  const getShiftIdForEmpDate = (empId: string, d: dayjs.Dayjs, rule: ShiftRuleItem) => {
    const dateStr = d.format('YYYY-MM-DD');
    const source = detailRuleAssignments.length > 0
      ? detailRuleAssignments
      : (rule.assignments && rule.assignments.length > 0 ? rule.assignments : rawAssignments);
      
    const match = source.find(
      (a: any) =>
        (a.employeeId === empId || a.employee?.id === empId) &&
        dayjs(a.date).format('YYYY-MM-DD') === dateStr
    );
    return match?.shiftId || match?.shift?.id || 'OFF';
  };

  // Handler to update a shift on a specific cell during detail editing
  const handleCellShiftChange = (empId: string, d: dayjs.Dayjs, shiftId: string) => {
    const dateStr = d.format('YYYY-MM-DD');
    const shiftObj = shiftsList.find((s) => s.id === shiftId);
    const empObj = employeesList.find((e) => e.id === empId);

    setDetailRuleAssignments((prev) => {
      const filtered = prev.filter(
        (a) =>
          !((a.employeeId === empId || a.employee?.id === empId) &&
            dayjs(a.date).format('YYYY-MM-DD') === dateStr)
      );

      if (!shiftId || shiftId === 'OFF') {
        return filtered;
      }

      return [
        ...filtered,
        {
          id: `edit-${Date.now()}-${empId}-${dateStr}`,
          employeeId: empId,
          employee: empObj,
          shiftId: shiftId,
          shift: shiftObj,
          date: dateStr,
          title: selectedDetailRule?.title,
          repeatType: selectedDetailRule?.repeatType,
        },
      ];
    });
  };

  // Handler to remove an employee from this rule
  const handleRemoveEmployeeFromRule = (empId: string) => {
    setDetailRuleAssignments((prev) =>
      prev.filter((a) => a.employeeId !== empId && a.employee?.id !== empId)
    );
    message.info('Đã xóa nhân viên khỏi ca này. Bấm [Lưu thay đổi] để cập nhật vào CSDL.');
  };

  // Handler to add an employee directly into this rule from the inline '+' row
  const handleAddEmployeeInline = (empId: string) => {
    if (!empId) return;

    const empObj = employeesList.find((e) => e.id === empId);
    if (!empObj) return;

    const defaultShift = shiftsList[0];
    const newAssignmentsToAdd: any[] = [];
    const dateRangeDaysList = selectedDetailRule
      ? getDateRangeDays(selectedDetailRule.startDate, selectedDetailRule.endDate)
      : [];

    // Copy shift pattern from the first employee in rule if available
    const firstEmp = getEmployeesInRule(selectedDetailRule!)[0];

    dateRangeDaysList.forEach((d) => {
      const dateStr = d.format('YYYY-MM-DD');
      const dow = d.day();

      let shouldAssign = false;
      let shiftToUse = defaultShift;

      if (firstEmp) {
        const sampleShiftName = getShiftForEmpDate(firstEmp.id, d, selectedDetailRule!);
        if (sampleShiftName && sampleShiftName !== 'Nghỉ' && sampleShiftName !== 'Nghỉ tuần') {
          const matchedShift = shiftsList.find(
            (s) => s.name === sampleShiftName || s.code === sampleShiftName
          );
          shiftToUse = matchedShift || defaultShift;
          shouldAssign = true;
        }
      } else {
        shouldAssign = dow !== 0 && dow !== 6; // Monday-Friday
      }

      if (shouldAssign && shiftToUse) {
        newAssignmentsToAdd.push({
          id: `new-${Date.now()}-${d.format('YYYYMMDD')}-${Math.random()}`,
          employeeId: empObj.id,
          employee: empObj,
          shiftId: shiftToUse.id,
          shift: shiftToUse,
          date: dateStr,
          title: selectedDetailRule?.title,
          repeatType: selectedDetailRule?.repeatType,
        });
      }
    });

    setDetailRuleAssignments((prev) => [...prev, ...newAssignmentsToAdd]);
    message.success(`Đã thêm ${empObj.name || empObj.fullName} vào ca làm việc! Bạn có thể chọn/sửa ca trực tiếp trên dòng.`);
  };

  // Handler to save detail edits to CSDL
  const handleSaveDetailEdits = async () => {
    if (!selectedDetailRule) return;
    setSubmittingDetailEdit(true);
    try {
      const scheduleTitle = (selectedDetailRule.title || '').trim();
      const currentRuleEmployees = getEmployeesInRule(selectedDetailRule);
      const currentEmpIds = currentRuleEmployees.map((e) => e.id);

      // Check if this schedule has already been approved before (has APPROVED records)
      const hasApproved = rawAssignments.some(
        (a) => (a.title || '').trim() === scheduleTitle && a.status === 'APPROVED'
      );

      // If it was already approved, the new edits MUST be saved as 'DRAFT'
      // so the old 'APPROVED' records remain active for employees!
      // If it was never approved before, save as 'PENDING'.
      const saveStatus = hasApproved ? 'DRAFT' : 'PENDING';

      // Prepare bulk payload with saveStatus
      const bulkPayload = detailRuleAssignments
        .filter((a) => a.shiftId && a.shiftId !== 'OFF')
        .map((a) => ({
          employeeId: a.employeeId || a.employee?.id,
          shiftId: a.shiftId,
          date: dayjs(a.date).format('YYYY-MM-DD'),
          title: scheduleTitle,
          repeatType: selectedDetailRule.repeatType,
          status: saveStatus,
        }));

      // Only delete stale DRAFT assignments for this schedule (NEVER delete existing APPROVED records!)
      const newKeySet = new Set(bulkPayload.map((a) => `${a.employeeId}_${a.date}`));
      const staleDraftIds = rawAssignments
        .filter((a) => {
          const dStr = dayjs(a.date).format('YYYY-MM-DD');
          const isSameTitle = (a.title || '').trim() === scheduleTitle;
          return (
            isSameTitle &&
            a.status === saveStatus &&
            currentEmpIds.includes(a.employeeId || a.employee?.id) &&
            !newKeySet.has(`${a.employeeId || a.employee?.id}_${dStr}`)
          );
        })
        .map((a) => a.id)
        .filter(Boolean);

      if (staleDraftIds.length > 0) {
        await apiClient.post('/attendance/shift-assignments/delete', { ids: staleDraftIds }).catch(() => {});
      }

      await apiClient.post('/attendance/shift-assignments/bulk', {
        assignments: bulkPayload,
      });

      setDetailStatus('Chờ duyệt');
      if (selectedDetailRule) {
        selectedDetailRule.status = 'Chờ duyệt';
      }

      message.success('✅ Đã lưu thay đổi vào bản nháp (Chờ duyệt). Nhân viên vẫn giữ lịch cũ cho đến khi bạn bấm [Duyệt]!');
      setIsDetailEditing(false);
      await fetchData();

      setSelectedDetailRule((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          assignments: detailRuleAssignments,
        };
      });
    } catch (err: any) {
      console.error('Lỗi khi lưu chỉnh sửa phân ca:', err);
      message.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu phân ca');
    } finally {
      setSubmittingDetailEdit(false);
    }
  };

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ShiftRuleItem) => (
        <span
          style={{ color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}
          className="hover-pink"
          onClick={() => setSelectedDetailRule(record)}
          title="Bấm để xem chi tiết (hoặc chuột phải để thao tác nhanh)"
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Loại ca',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (text: string) => <span style={{ color: '#475569', fontSize: 13 }}>{text}</span>,
    },
    {
      title: 'Kiểu phân ca',
      dataIndex: 'assignmentType',
      key: 'assignmentType',
      width: 220,
      render: (text: string) => <span style={{ color: '#475569', fontSize: 13 }}>{text}</span>,
    },
    {
      title: 'Từ ngày',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (text: string) => <span style={{ color: '#475569', fontSize: 13 }}>{text}</span>,
    },
    {
      title: 'Đến ngày',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (text: string) => <span style={{ color: '#475569', fontSize: 13 }}>{text}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (text: string) => (
        <Tag color={text === 'Đã duyệt' ? 'success' : 'warning'} style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (text: string) => <span style={{ color: '#64748b', fontSize: 13 }}>{text}</span>,
    },
  ];

  // Shift Template Columns (Image 1 Settings table)
  const shiftTemplateColumns = [
    { title: 'Mã ca', dataIndex: 'code', key: 'code', width: 140 },
    {
      title: 'Tên ca',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span style={{ fontWeight: 600, color: '#0f172a' }}>{text}</span>,
    },
    { title: 'Giờ vào', dataIndex: 'startTime', key: 'startTime', width: 100 },
    { title: 'Giờ ra', dataIndex: 'endTime', key: 'endTime', width: 100 },
    {
      title: 'Giờ nghỉ',
      dataIndex: 'breakStart',
      key: 'breakStart',
      width: 100,
      render: (text?: string) => text || '--',
    },
    {
      title: 'Kết thúc nghỉ',
      dataIndex: 'breakEnd',
      key: 'breakEnd',
      width: 120,
      render: (text?: string) => text || '--',
    },
    {
      title: 'Check in trước',
      key: 'checkInEarly',
      width: 120,
      render: () => '01:00',
    },
    {
      title: 'Check out sau',
      key: 'checkOutLate',
      width: 120,
      render: () => '04:00',
    },
    {
      title: 'Tổng công',
      dataIndex: 'standardHours',
      key: 'standardHours',
      width: 100,
      render: (val?: number) => val || 1,
    },
  ];

  const shiftOptions =
    shiftsList.length > 0
      ? shiftsList.map((s) => ({
        value: s.id,
        label: `${s.name || s.code} (${s.startTime || '08:00'} - ${s.endTime || '17:30'})`,
      }))
      : [];

  const dateRangeDays = selectedDetailRule
    ? getDateRangeDays(selectedDetailRule.startDate, selectedDetailRule.endDate)
    : [];

  const ruleEmployees = selectedDetailRule
    ? getEmployeesInRule(selectedDetailRule)
    : [];

  return (
    <div className="admin-status-container" style={{ padding: '0 16px 24px 16px' }}>
      {selectedDetailRule ? (
        /* MÀN HÌNH CHI TIẾT PHÂN CA (Matching 1Office Image 3) */
        <div style={{ minHeight: '85vh', margin: '0 -4px', padding: '8px 0 24px 0' }}>
          {/* Top Bar: Tab Chi tiết + Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              background: '#ffffff',
              padding: '12px 20px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 16,
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button
                icon={<LeftOutlined />}
                style={{
                  borderColor: '#e83e8c',
                  color: '#e83e8c',
                  fontWeight: 600,
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
                onClick={() => setSelectedDetailRule(null)}
              >
                Quay lại danh sách
              </Button>
              <div
                style={{
                  color: '#e83e8c',
                  fontWeight: 700,
                  fontSize: 15,
                  borderBottom: '2px solid #e83e8c',
                  paddingBottom: 4,
                  cursor: 'pointer',
                }}
              >
                Chi tiết
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Button
                type="primary"
                style={{ backgroundColor: '#ea580c', borderColor: '#ea580c', fontWeight: 600, borderRadius: 4 }}
                onClick={() => message.info('Đang tải dữ liệu Monitor...')}
              >
                Tải Monitor
              </Button>

              {/* Button Hoàn duyệt / Duyệt (1Office Workflow) */}
              {detailStatus === 'Đã duyệt' ? (
                <Button
                  style={{ fontWeight: 600, borderRadius: 4 }}
                  onClick={() => {
                    setDetailStatus('Chờ duyệt');
                    if (selectedDetailRule) {
                      selectedDetailRule.status = 'Chờ duyệt';
                    }
                    message.success('Đã hoàn duyệt phân ca! Nút [Sửa] đã sáng lên để bạn chỉnh sửa. Nhân viên vẫn giữ lịch cũ cho đến khi bạn bấm [Duyệt].');
                  }}
                >
                  Hoàn duyệt
                </Button>
              ) : (
                <Button
                  type="primary"
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#ffffff', fontWeight: 600, borderRadius: 4 }}
                  onClick={async () => {
                    try {
                      const title = selectedDetailRule?.title;
                      await apiClient.post('/attendance/shift-assignments/approve', { title });
                      setDetailStatus('Đã duyệt');
                      setIsDetailEditing(false);
                      if (selectedDetailRule) {
                        selectedDetailRule.status = 'Đã duyệt';
                      }
                      message.success('✅ Đã phê duyệt phân ca thành công! Ca làm việc mới đã được cập nhật chính thức cho nhân viên.');
                      await fetchData();
                    } catch (err: any) {
                      console.error('Lỗi khi phê duyệt:', err);
                      message.error('Không thể phê duyệt phân ca');
                    }
                  }}
                >
                  Duyệt
                </Button>
              )}

              <Button icon={<UploadOutlined />} onClick={() => message.info('Tải lên tài liệu đính kèm')}>
                Tải lên
              </Button>

              {/* Button Sửa: Khi Đã duyệt thì bị mờ (disabled); Khi Chờ duyệt thì sáng lên, bấm vào thì cho phép thêm người */}
              {detailStatus === 'Đã duyệt' ? (
                <Tooltip title="Phân ca đã duyệt không thể sửa. Vui lòng bấm 'Hoàn duyệt' trước khi chỉnh sửa.">
                  <Button
                    icon={<EditOutlined />}
                    disabled
                    style={{ opacity: 0.5, cursor: 'not-allowed', color: '#94a3b8', borderRadius: 4 }}
                  >
                    Sửa
                  </Button>
                </Tooltip>
              ) : isDetailEditing ? (
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={submittingDetailEdit}
                    onClick={handleSaveDetailEdits}
                    style={{ backgroundColor: '#e83e8c', borderColor: '#e83e8c', fontWeight: 600, borderRadius: 4 }}
                  >
                    Lưu thay đổi
                  </Button>
                  <Button onClick={() => setIsDetailEditing(false)} style={{ borderRadius: 4 }}>
                    Hủy
                  </Button>
                </Space>
              ) : (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setIsDetailEditing(true)}
                  style={{ borderColor: '#e83e8c', color: '#e83e8c', fontWeight: 600, borderRadius: 4 }}
                >
                  Sửa
                </Button>
              )}

              <Button icon={<CopyOutlined />} onClick={() => message.info('Nhân bản phân ca này')}>
                Nhân bản
              </Button>
            </div>
          </div>

          {/* 2-Column Main Layout: Left (73%) + Right (27%) - Stacks on Mobile */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* LEFT COLUMN: Thông tin chung, Chi tiết phân ca, Đính kèm */}
            <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* CARD 1: Thông tin chung */}
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Thông tin chung</span>
                  <MinusOutlined style={{ color: '#94a3b8', cursor: 'pointer' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px 32px' }}>
                  {/* Left Column Fields */}
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Tiêu đề</div>
                      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 13 }}>{selectedDetailRule.title}</div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Vị trí</div>
                      <div style={{ color: '#0f172a', fontWeight: 500, fontSize: 13 }}>
                        {selectedDetailRule.positionName || 'Nhân viên bán hàng, Cửa hàng trưởng'}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Loại ca</div>
                      <div style={{ color: '#0f172a', fontWeight: 500, fontSize: 13 }}>{selectedDetailRule.category}</div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Thời gian</div>
                      <div style={{ color: '#0f172a', fontWeight: 500, fontSize: 13 }}>
                        {selectedDetailRule.startDate} - {selectedDetailRule.endDate}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Người duyệt</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar size={22} style={{ backgroundColor: '#10b981', fontSize: 12 }}>A</Avatar>
                        <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 13 }}>Admin</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Fields */}
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Phòng ban</div>
                      <div style={{ color: '#0f172a', fontWeight: 600, fontSize: 13 }}>
                        {selectedDetailRule.departmentName || 'Toàn hệ thống'}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Kiểu phân ca</div>
                      <div style={{ color: '#0f172a', fontWeight: 500, fontSize: 13 }}>{selectedDetailRule.assignmentType}</div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Phân công</div>
                      <div style={{ color: '#0f172a', fontWeight: 500, fontSize: 13 }}>{selectedDetailRule.repeatType}</div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Trạng thái</div>
                      <div>
                        <Tag
                          color={detailStatus === 'Đã duyệt' ? 'success' : 'warning'}
                          style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}
                        >
                          {detailStatus}
                        </Tag>
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#64748b', fontSize: 12, marginBottom: 3 }}>Bước duyệt</div>
                      <div>
                        <Tag
                          color={detailStatus === 'Đã duyệt' ? 'success' : 'processing'}
                          style={{ borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}
                        >
                          {detailStatus === 'Đã duyệt' ? 'Duyệt ✓' : 'Chưa duyệt'}
                        </Tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: Chi tiết phân ca (Daily Schedule Matrix Table matching Image 3) */}
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Chi tiết phân ca</span>
                    {isDetailEditing && (
                      <Tag color="magenta" style={{ fontWeight: 600 }}>
                        Đang chỉnh sửa
                      </Tag>
                    )}
                  </div>
                  <MinusOutlined style={{ color: '#94a3b8', cursor: 'pointer' }} />
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'left', minWidth: 70, borderRight: '1px solid #e2e8f0' }}>Mã NV</th>
                        <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'left', minWidth: 160, borderRight: '1px solid #e2e8f0' }}>Họ và tên</th>
                        <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'left', minWidth: 150, borderRight: '1px solid #e2e8f0' }}>Vị trí</th>
                        <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#475569', textAlign: 'left', minWidth: 130, borderRight: '1px solid #e2e8f0' }}>Phòng ban</th>
                        {dateRangeDays.map((d) => {
                          const dow = d.day();
                          const isSunday = dow === 0;
                          return (
                            <th
                              key={d.format('YYYY-MM-DD')}
                              style={{
                                padding: '10px 12px',
                                fontSize: 12,
                                fontWeight: 600,
                                color: isSunday ? '#ef4444' : '#475569',
                                textAlign: 'center',
                                minWidth: 105,
                                borderRight: '1px solid #e2e8f0',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {vnDays[dow]}, {d.format('DD/MM/YYYY')}
                            </th>
                          );
                        })}
                        {isDetailEditing && (
                          <th style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#ef4444', textAlign: 'center', width: 60 }}>
                            Xóa
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {ruleEmployees.map((emp, idx) => (
                        <tr key={emp.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                            {emp.code || `NV${100 + idx}`}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, color: '#0f172a', borderRight: '1px solid #e2e8f0' }}>
                            {emp.name || emp.fullName}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                            {emp.position?.name || emp.position || selectedDetailRule.positionName || 'Nhân viên'}
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 12, color: '#475569', borderRight: '1px solid #e2e8f0' }}>
                            {emp.department?.name || emp.department || selectedDetailRule.departmentName || 'CỬA HÀNG 126'}
                          </td>
                          {dateRangeDays.map((d) => {
                            const shiftText = getShiftForEmpDate(emp.id, d, selectedDetailRule);
                            const currentShiftId = getShiftIdForEmpDate(emp.id, d, selectedDetailRule);
                            const isOff = shiftText === 'Nghỉ' || shiftText === 'Nghỉ tuần';

                            return (
                              <td
                                key={d.format('YYYY-MM-DD')}
                                style={{
                                  padding: isDetailEditing ? '4px 6px' : '9px 12px',
                                  fontSize: 12,
                                  textAlign: 'center',
                                  borderRight: '1px solid #e2e8f0',
                                  color: isOff ? '#94a3b8' : '#0f172a',
                                  fontWeight: isOff ? 400 : 600,
                                  fontStyle: isOff ? 'italic' : 'normal',
                                  background: isOff ? '#fafbfc' : '#ffffff',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {isDetailEditing ? (
                                  <Select
                                    size="small"
                                    value={currentShiftId}
                                    style={{ width: '100%', minWidth: 95 }}
                                    onChange={(val) => handleCellShiftChange(emp.id, d, val)}
                                    options={[
                                      { value: 'OFF', label: 'Nghỉ' },
                                      ...shiftsList.map((s) => ({
                                        value: s.id,
                                        label: s.name || s.code,
                                      })),
                                    ]}
                                  />
                                ) : (
                                  shiftText
                                )}
                              </td>
                            );
                          })}
                          {isDetailEditing && (
                            <td style={{ padding: '6px 8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                title="Xóa nhân sự này khỏi ca"
                                onClick={() => handleRemoveEmployeeFromRule(emp.id)}
                              />
                            </td>
                          )}
                        </tr>
                      ))}

                      {/* Dòng dấu + thêm nhân viên trực tiếp dưới bảng khi đang Sửa */}
                      {isDetailEditing && (
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 12px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                border: '1px dashed #2563eb',
                                background: '#eff6ff',
                                color: '#2563eb',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 16,
                              }}
                              title="Thêm nhân sự vào ca"
                            >
                              +
                            </div>
                          </td>
                          <td style={{ padding: '6px 8px', borderRight: '1px solid #e2e8f0', minWidth: 200 }}>
                            <Select
                              showSearch
                              placeholder="+ Chọn nhân sự thêm vào ca..."
                              style={{ width: '100%' }}
                              value={undefined}
                              filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                              }
                              onChange={(empId) => {
                                if (empId) handleAddEmployeeInline(empId);
                              }}
                              options={employeesList
                                .filter((e) => !ruleEmployees.some((re) => re.id === e.id))
                                .map((e) => ({
                                  value: e.id,
                                  label: `[${e.code || 'NV'}] ${e.name || e.fullName}`,
                                }))}
                            />
                          </td>
                          <td style={{ padding: '8px 12px', color: '#94a3b8', fontStyle: 'italic', fontSize: 12, borderRight: '1px solid #e2e8f0' }}>
                            --
                          </td>
                          <td style={{ padding: '8px 12px', color: '#94a3b8', fontStyle: 'italic', fontSize: 12, borderRight: '1px solid #e2e8f0' }}>
                            --
                          </td>
                          {dateRangeDays.map((d) => (
                            <td
                              key={`empty-add-${d.format('YYYY-MM-DD')}`}
                              style={{ padding: '8px 12px', textAlign: 'center', color: '#cbd5e1', borderRight: '1px solid #e2e8f0', fontSize: 11 }}
                            >
                              --
                            </td>
                          ))}
                          <td style={{ borderRight: '1px solid #e2e8f0' }}></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CARD 3: Đính kèm */}
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Đính kèm</span>
                  <MinusOutlined style={{ color: '#94a3b8', cursor: 'pointer' }} />
                </div>

                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                  <FolderOpenOutlined style={{ fontSize: 32, marginBottom: 8, color: '#cbd5e1' }} />
                  <div style={{ fontSize: 13 }}>Bạn không có file đính kèm nào</div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Thảo luận & Lịch sử hoạt động */}
            <div style={{ width: 340, flexShrink: 0 }}>
              <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', minHeight: 460 }}>
                {/* Tabs Header */}
                <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid #f1f5f9', paddingBottom: 10, marginBottom: 16 }}>
                  <span
                    onClick={() => setActiveRightTab('discussion')}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: activeRightTab === 'discussion' ? '#e83e8c' : '#64748b',
                      borderBottom: activeRightTab === 'discussion' ? '2px solid #e83e8c' : 'none',
                      paddingBottom: 6,
                    }}
                  >
                    Thảo luận
                  </span>
                  <span
                    onClick={() => setActiveRightTab('history')}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: activeRightTab === 'history' ? '#e83e8c' : '#64748b',
                      borderBottom: activeRightTab === 'history' ? '2px solid #e83e8c' : 'none',
                      paddingBottom: 6,
                    }}
                  >
                    Lịch sử hoạt động
                  </span>
                </div>

                {/* Tab 1: Thảo luận */}
                {activeRightTab === 'discussion' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320, paddingRight: 4 }}>
                      {discussionComments.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                          <MessageOutlined style={{ fontSize: 28, marginBottom: 8, color: '#cbd5e1' }} />
                          <div style={{ fontSize: 13 }}>Không có thảo luận nào</div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {discussionComments.map((c) => (
                            <div key={c.id} style={{ background: '#f8fafc', borderRadius: 6, padding: '8px 12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, fontSize: 12, color: '#0f172a' }}>{c.author}</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.time}</span>
                              </div>
                              <div style={{ fontSize: 13, color: '#334155' }}>{c.text}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Comment Input Box */}
                    <div style={{ marginTop: 12, border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', background: '#ffffff' }}>
                      <Input.TextArea
                        placeholder="Viết thảo luận..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        bordered={false}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onPressEnter={(e) => {
                          if (!e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        style={{ padding: 0, resize: 'none', fontSize: 13 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTop: '1px solid #f8fafc' }}>
                        <div style={{ display: 'flex', gap: 8, color: '#94a3b8' }}>
                          <PaperClipOutlined style={{ cursor: 'pointer', fontSize: 16 }} title="Đính kèm tệp" />
                          <SmileOutlined style={{ cursor: 'pointer', fontSize: 16 }} title="Biểu cảm" />
                        </div>
                        <Button
                          type="text"
                          icon={<SendOutlined style={{ color: commentText.trim() ? '#e83e8c' : '#cbd5e1', fontSize: 16 }} />}
                          onClick={handleAddComment}
                          disabled={!commentText.trim()}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Lịch sử hoạt động */
                  <div style={{ padding: '8px 0', fontSize: 13 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', marginTop: 5 }}></div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Admin đã duyệt phân ca</div>
                        <div style={{ color: '#94a3b8', fontSize: 11 }}>{selectedDetailRule.createdAt} 09:00</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6', marginTop: 5 }}></div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>Admin đã tạo phân ca</div>
                        <div style={{ color: '#94a3b8', fontSize: 11 }}>{selectedDetailRule.createdAt} 08:30</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : !isCreateMode ? (
        <>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={handleOpenCreateModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#e83e8c',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(232, 62, 140, 0.4)',
                }}
                title="Tạo mới phân ca"
              >
                +
              </button>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Phân công ca làm việc</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Input
                placeholder="Tìm kiếm"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 240, borderRadius: 20 }}
                allowClear
              />
              <Button
                icon={<SettingOutlined />}
                onClick={() => setSettingsOpen(true)}
                style={{ borderRadius: 20 }}
              >
                Cài đặt
              </Button>
            </div>
          </div>

          {/* Sub-bar Info matching Image 2 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '9px 16px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
              marginTop: 12,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: '#475569', fontWeight: 500 }}>
                Hiển thị {filteredRules.length === 0 ? 0 : `1 - ${filteredRules.length}`} / {shiftRules.length} bản ghi
              </span>
              <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                Trang: 01 / 01 <DownOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#94a3b8' }}>
                <LeftOutlined style={{ cursor: 'pointer', fontSize: 11 }} />
                <RightOutlined style={{ cursor: 'pointer', fontSize: 11 }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, color: '#475569', fontSize: 13 }}>
              <span
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={() => message.info('Export danh sách phân ca')}
              >
                <ExportOutlined /> Export
              </span>
              <span
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={() => message.info('Import phân ca từ file Excel')}
              >
                <ImportOutlined /> Import
              </span>
              <span
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                onClick={() => setSettingsOpen(true)}
              >
                <SettingOutlined /> Cài đặt
              </span>
            </div>
          </div>

          {/* Main Table */}
          <div className="admin-table-container" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
            <Table
              columns={columns}
              dataSource={filteredRules}
              rowKey="id"
              loading={loading}
              pagination={false}
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              onRow={(record) => ({
                onContextMenu: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    visible: true,
                    x: Math.min(e.clientX, window.innerWidth - 210),
                    y: Math.min(e.clientY, window.innerHeight - 270),
                    record,
                  });
                },
              })}
            />
          </div>

          {/* ── Context Menu Floating Card (1Office Image 2) ────────────────── */}
          {contextMenu.visible && contextMenu.record && (
            <div
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 1050,
                background: '#ffffff',
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.08)',
                border: '1px solid #e2e8f0',
                padding: '6px 0',
                minWidth: 190,
                fontSize: 13,
                color: '#1e293b',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Quick Action: Duyệt / Hoàn duyệt */}
              {contextMenu.record.status === 'Đã duyệt' ? (
                <div
                  className="context-menu-item"
                  onClick={async () => {
                    const r = contextMenu.record!;
                    setContextMenu((prev) => ({ ...prev, visible: false }));
                    try {
                      const ids = (r.assignments || []).map((a: any) => a.id).filter(Boolean);
                      await apiClient.post('/attendance/shift-assignments/revert', { title: r.title, ids });
                      message.success(`Đã hoàn duyệt "${r.title}". Ca làm việc tạm ẩn với nhân viên.`);
                      await fetchData();
                    } catch (err) {
                      message.error('Không thể hoàn duyệt');
                    }
                  }}
                  style={{
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <RollbackOutlined style={{ color: '#ea580c', fontSize: 14 }} />
                  <span>Hoàn duyệt</span>
                </div>
              ) : (
                <div
                  className="context-menu-item"
                  onClick={async () => {
                    const r = contextMenu.record!;
                    setContextMenu((prev) => ({ ...prev, visible: false }));
                    try {
                      await apiClient.post('/attendance/shift-assignments/approve', { title: r.title });
                      message.success(`✅ Đã phê duyệt "${r.title}". Ca làm việc đã cập nhật cho nhân viên.`);
                      await fetchData();
                    } catch (err) {
                      message.error('Không thể phê duyệt');
                    }
                  }}
                  style={{
                    padding: '9px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircleOutlined style={{ color: '#16a34a', fontSize: 14 }} />
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Duyệt phân ca</span>
                </div>
              )}

              {/* Item 1: Thêm tài liệu */}
              <div
                className="context-menu-item"
                onClick={() => {
                  message.info(`Đính kèm tài liệu cho: ${contextMenu.record?.title}`);
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                }}
                style={{
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CloudUploadOutlined style={{ color: '#64748b', fontSize: 14 }} />
                  <span>Thêm tài liệu</span>
                </div>
                <RightOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
              </div>

              {/* Item 2: Sửa */}
              <div
                className="context-menu-item"
                onClick={() => {
                  const r = contextMenu.record!;
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                  handleOpenCreateModal();
                  form.setFieldsValue({
                    title: r.title,
                    assignmentType: r.assignmentType,
                    category: r.category,
                    repeatType: r.repeatType,
                    startDate: dayjs(r.startDate, 'DD/MM/YYYY'),
                    endDate: dayjs(r.endDate, 'DD/MM/YYYY'),
                  });
                }}
                style={{
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <EditOutlined style={{ color: '#64748b', fontSize: 14 }} />
                <span>Sửa</span>
              </div>

              {/* Item 3: Xóa */}
              <div
                className="context-menu-item is-danger"
                onClick={() => {
                  const r = contextMenu.record!;
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                  Modal.confirm({
                    title: 'Xóa phân ca làm việc?',
                    content: `Bạn có chắc chắn muốn xóa "${r.title}"?`,
                    okText: 'Xóa',
                    cancelText: 'Hủy',
                    okButtonProps: { danger: true },
                    onOk: async () => {
                      try {
                        const ids = (r.assignments || []).map((a: any) => a.id).filter(Boolean);
                        if (ids.length > 0) {
                          await apiClient.post('/attendance/shift-assignments/delete', { ids });
                        }
                        message.success('✅ Đã xóa phân ca thành công!');
                        await fetchData();
                      } catch (err: any) {
                        message.error('Không thể xóa phân ca này');
                      }
                    },
                  });
                }}
                style={{
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <DeleteOutlined style={{ color: '#64748b', fontSize: 14 }} />
                <span>Xóa</span>
              </div>

              {/* Item 4: Nhân bản */}
              <div
                className="context-menu-item"
                onClick={() => {
                  const r = contextMenu.record!;
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                  handleOpenCreateModal();
                  form.setFieldsValue({
                    title: `${r.title} (Bản sao)`,
                    assignmentType: r.assignmentType,
                    category: r.category,
                    repeatType: r.repeatType,
                    startDate: dayjs(r.startDate, 'DD/MM/YYYY'),
                    endDate: dayjs(r.endDate, 'DD/MM/YYYY'),
                  });
                  message.success('Đã nhân bản thông tin phân ca vào biểu mẫu!');
                }}
                style={{
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <CopyOutlined style={{ color: '#64748b', fontSize: 14 }} />
                <span>Nhân bản</span>
              </div>

              {/* Item 5: Chi tiết */}
              <div
                className="context-menu-item"
                onClick={() => {
                  setSelectedDetailRule(contextMenu.record);
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                }}
                style={{
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileTextOutlined style={{ color: '#64748b', fontSize: 14 }} />
                  <span>Chi tiết</span>
                </div>
                <RightOutlined style={{ fontSize: 10, color: '#94a3b8' }} />
              </div>

              {/* Item 6: Tùy chỉnh */}
              <div
                className="context-menu-item"
                onClick={() => {
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                  setSettingsOpen(true);
                }}
                style={{
                  padding: '9px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <SlidersOutlined style={{ color: '#64748b', fontSize: 14 }} />
                <span>Tùy chỉnh</span>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Full Page View: Tạo mới phân ca (Matching Image 2) */
        <div style={{ background: '#ffffff', borderRadius: 8, padding: '16px 24px 32px 24px', minHeight: '85vh', marginTop: 8 }}>
          {/* Header Bar matching Image 2 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: 16,
              borderBottom: '1px solid #f1f5f9',
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsCreateMode(false)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: '1px solid #e83e8c',
                  backgroundColor: '#ffffff',
                  color: '#e83e8c',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Quay lại danh sách phân ca"
              >
                +
              </button>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Tạo mới phân ca</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Input
                placeholder="Tìm kiếm"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                style={{ width: 220, borderRadius: 20 }}
                allowClear
              />
              <Button onClick={() => setIsCreateMode(false)} style={{ borderRadius: 20 }}>
                ‹ Quay lại danh sách
              </Button>
            </div>
          </div>

          {/* Form Content */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateShiftSubmit}
          >
            {/* Form Fields Container: Max width 640px for inputs */}
            <div style={{ maxWidth: 640 }}>
              {/* SECTION 1: Thông tin chung */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#e83e8c', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  ∨ Thông tin chung
                </div>

                <Form.Item
                  name="title"
                  label={<span>Tiêu đề <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề phân ca' }]}
                >
                  <Input placeholder="Tiêu đề" />
                </Form.Item>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <Form.Item
                    name="assignmentType"
                    label={<span>Kiểu phân ca <span style={{ color: '#ef4444' }}>*</span></span>}
                    rules={[{ required: true, message: 'Vui lòng chọn kiểu phân ca' }]}
                  >
                    <Select
                      options={[
                        { value: 'Phân ca cho phòng ban, vị trí', label: 'Phân ca cho phòng ban, vị trí' },
                        { value: 'Phân ca cá nhân', label: 'Phân ca cá nhân' },
                      ]}
                      allowClear
                    />
                  </Form.Item>

                  <Form.Item
                    name="category"
                    label={<span>Loại ca <span style={{ color: '#ef4444' }}>*</span> ❓</span>}
                    rules={[{ required: true, message: 'Vui lòng chọn loại ca' }]}
                  >
                    <Select
                      options={[
                        { value: 'Hành chính', label: 'Hành chính' },
                        { value: 'Ca kíp', label: 'Ca kíp' },
                      ]}
                      allowClear
                    />
                  </Form.Item>

                  <Form.Item
                    name="repeatType"
                    label={<span>Phân công <span style={{ color: '#ef4444' }}>*</span></span>}
                    rules={[{ required: true, message: 'Vui lòng chọn hình thức phân công' }]}
                  >
                    <Select
                      options={[
                        { value: 'Lập theo tuần', label: 'Lập theo tuần' },
                        { value: 'Theo ngày cố định', label: 'Theo ngày cố định' },
                        { value: 'Lập theo chu kỳ ngày', label: 'Lập theo chu kỳ ngày' },
                        { value: 'Theo khoảng ngày', label: 'Theo khoảng ngày' },
                      ]}
                      allowClear={false}
                    />
                  </Form.Item>
                </div>

                {watchedRepeatType !== 'Theo ngày cố định' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <Form.Item name="startDate" label="Từ ngày">
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn từ ngày" />
                    </Form.Item>

                    <Form.Item name="endDate" label="Đến ngày">
                      <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn đến ngày" />
                    </Form.Item>
                  </div>
                )}

                {watchedRepeatType === 'Lập theo chu kỳ ngày' && (
                  <div style={{ marginTop: 4, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: 6 }}>Phân công này sẽ lặp</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 360 }}>
                      <InputNumber
                        min={1}
                        max={31}
                        value={cycleDaysCount}
                        onChange={(v) => setCycleDaysCount(Math.max(Number(v) || 1, 1))}
                        style={{ width: '100%', borderRadius: 4 }}
                      />
                      <Input readOnly value="ngày 1 lần" style={{ background: '#f8fafc', color: '#64748b', height: 32, borderRadius: 4 }} />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Thông tin phân công */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: '#e83e8c', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  ∨ Thông tin phân công
                </div>
                <div style={{ color: '#e83e8c', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                  Đối tượng áp dụng
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Form.Item
                    name="departmentIds"
                    label={
                      <span>
                        Phòng ban <span style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>thuộc</span>
                      </span>
                    }
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn phòng ban"
                      options={departments.map((d) => ({ value: d.id, label: d.name }))}
                      allowClear
                    />
                  </Form.Item>

                  <Form.Item
                    name="positionIds"
                    label={
                      <span>
                        Vị trí <span style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>thuộc</span>
                      </span>
                    }
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn nhiều"
                      options={positions.map((p) => ({ value: p.id, label: p.name }))}
                      allowClear
                    />
                  </Form.Item>

                  <Form.Item
                    name="jobTitleIds"
                    label={
                      <span>
                        Chức vụ <span style={{ color: '#64748b', fontSize: 12, fontWeight: 400 }}>thuộc</span>
                      </span>
                    }
                    style={{ marginBottom: 8 }}
                  >
                    <Select
                      mode="multiple"
                      placeholder="Chọn nhiều"
                      options={jobTitles.map((jt) => ({ value: jt.id, label: jt.name }))}
                      allowClear
                    />
                  </Form.Item>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <Button size="small" style={{ fontSize: 12 }}>+ Điều kiện</Button>
                    <Button size="small" style={{ fontSize: 12 }}>Hoặc</Button>
                  </div>

                  </div>
                </div>
              </div>

            {/* CONDITIONAL SHIFT SELECTION ACCORDING TO 4 1OFFICE CASES:
                Case 1: Lập theo tuần (Ảnh 1)
                Case 2: Theo ngày cố định (Ảnh 2)
                Case 3: Lập theo chu kỳ ngày (Ảnh 3)
                Case 4: Theo khoảng ngày (Ảnh 4)
            */}
            {watchedRepeatType === 'Theo ngày cố định' ? (
              /* Case 2: Theo ngày cố định (Ảnh 2) */
              <div style={{ marginTop: 16, marginBottom: 24, maxWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '32px 180px 1fr', gap: 12, marginBottom: 8, fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                  <div></div>
                  <div>Ngày</div>
                  <div>Ca</div>
                </div>
                {fixedDateRows.map((row, idx) => (
                  <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '32px 180px 1fr', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CloseOutlined
                        style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                        onClick={() => {
                          if (fixedDateRows.length <= 1) {
                            setFixedDateRows([{ id: `fdr-${Date.now()}`, date: dayjs(), shiftId: undefined }]);
                            return;
                          }
                          setFixedDateRows((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        title="Xóa ngày"
                      />
                    </div>
                    <div>
                      <DatePicker
                        value={row.date}
                        onChange={(d) => {
                          if (!d) return;
                          setFixedDateRows((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], date: d };
                            return next;
                          });
                        }}
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                        allowClear={false}
                      />
                    </div>
                    <div>
                      <Select
                        placeholder="Chọn ca"
                        options={shiftOptions}
                        value={row.shiftId}
                        onChange={(val) => {
                          setFixedDateRows((prev) => {
                            const next = [...prev];
                            next[idx] = { ...next[idx], shiftId: val };
                            return next;
                          });
                        }}
                        style={{ width: '100%' }}
                        allowClear
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: '1px solid #e83e8c',
                    backgroundColor: '#fff',
                    color: '#e83e8c',
                    fontSize: 16,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginTop: 6,
                  }}
                  onClick={() =>
                    setFixedDateRows((prev) => [
                      ...prev,
                      { id: `fdr-${Date.now()}`, date: dayjs().add(prev.length, 'day'), shiftId: undefined },
                    ])
                  }
                  title="Thêm ngày"
                >
                  +
                </button>
              </div>
            ) : watchedRepeatType === 'Lập theo chu kỳ ngày' ? (
              /* Case 3: Lập theo chu kỳ ngày (Ảnh 3) */
              <div style={{ marginTop: 16, marginBottom: 24, maxWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, marginBottom: 8, fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                  <div>Ngày</div>
                  <div>Ca</div>
                </div>
                {Array.from({ length: cycleDaysCount }, (_, i) => i + 1).map((dayNum) => (
                  <div key={dayNum} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4,
                        padding: '6px 12px',
                        color: '#1e293b',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      Ngày {dayNum}
                    </div>
                    <div>
                      <Select
                        placeholder="Chọn ca"
                        options={shiftOptions}
                        value={cycleShifts[dayNum]}
                        onChange={(val) => {
                          setCycleShifts((prev) => ({ ...prev, [dayNum]: val }));
                        }}
                        style={{ width: '100%' }}
                        allowClear
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : watchedRepeatType === 'Theo khoảng ngày' ? (
              /* Case 4: Theo khoảng ngày (Ảnh 4) */
              <div style={{ marginTop: 16, marginBottom: 24, maxWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, marginBottom: 8, fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                  <div>Ngày</div>
                  <div>Ca</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, alignItems: 'center' }}>
                  <DatePicker
                    value={form.getFieldValue('startDate') || dayjs()}
                    onChange={(d) => form.setFieldsValue({ startDate: d })}
                    format="DD/MM/YYYY"
                    style={{ width: '100%' }}
                  />
                  <Select
                    placeholder="Chọn ca"
                    options={shiftOptions}
                    value={rangeShiftId}
                    onChange={(val) => setRangeShiftId(val)}
                    style={{ width: '100%' }}
                    allowClear
                  />
                </div>
              </div>
            ) : currentAssignmentType === 'Phân ca cá nhân' ? (
              /* Case 1A: Lập theo tuần cho cá nhân */
              <div style={{ marginTop: 16, marginBottom: 24 }}>
                <div style={{ color: '#475569', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>
                  Tìm thấy {employeeShiftRows.filter((r) => r.employeeId).length} nhân sự
                </div>
                <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: 8, padding: 12, background: '#ffffff' }}>
                  <table style={{ width: '100%', minWidth: 1440, borderCollapse: 'separate', borderSpacing: '8px 6px' }}>
                    <thead>
                      <tr style={{ color: '#64748b', fontSize: 13, textAlign: 'left' }}>
                        <th style={{ width: 28 }}></th>
                        <th style={{ width: 90 }}>Mã NV</th>
                        <th style={{ width: 220 }}>Nhân sự</th>
                        <th style={{ width: 140 }}>Vị trí</th>
                        <th style={{ width: 140 }}>Phòng ban</th>
                        <th style={{ width: 110 }}>Thứ 2</th>
                        <th style={{ width: 110 }}>Thứ 3</th>
                        <th style={{ width: 110 }}>Thứ 4</th>
                        <th style={{ width: 110 }}>Thứ 5</th>
                        <th style={{ width: 110 }}>Thứ 6</th>
                        <th style={{ width: 110 }}>Thứ 7 (lẻ)</th>
                        <th style={{ width: 110 }}>Thứ 7 (chẵn)</th>
                        <th style={{ width: 110 }}>Chủ nhật</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeShiftRows.map((row, idx) => (
                        <tr key={row.id}>
                          <td style={{ textAlign: 'center' }}>
                            <CloseOutlined
                              style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
                              onClick={() => handleDeleteEmployeeRow(idx)}
                              title="Xóa dòng"
                            />
                          </td>
                          <td>
                            <Input readOnly placeholder="Mã NV" value={row.code} style={{ background: '#f8fafc' }} />
                          </td>
                          <td>
                            <Select
                              showSearch
                              placeholder="Chọn nhân sự"
                              value={row.employeeId}
                              onChange={(val) => handleSelectEmployeeForRow(val, idx)}
                              style={{ width: '100%' }}
                              filterOption={(input, option) => {
                                const emp = employeesList.find((e) => e.id === option?.value);
                                if (!emp) return false;
                                return `${emp.code || ''} ${emp.name || ''}`.toLowerCase().includes(input.toLowerCase());
                              }}
                              options={employeesList.map((e) => ({
                                value: e.id,
                                label: e.name,
                              }))}
                              allowClear
                            />
                          </td>
                          <td>
                            <Input readOnly placeholder="Vị trí" value={row.position} style={{ background: '#f8fafc' }} />
                          </td>
                          <td>
                            <Input readOnly placeholder="Phòng ban" value={row.department} style={{ background: '#f8fafc' }} />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.mondayShift}
                              onChange={(v) => handleChangeRowShift(idx, 'mondayShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.tuesdayShift}
                              onChange={(v) => handleChangeRowShift(idx, 'tuesdayShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.wednesdayShift}
                              onChange={(v) => handleChangeRowShift(idx, 'wednesdayShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.thursdayShift}
                              onChange={(v) => handleChangeRowShift(idx, 'thursdayShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.fridayShift}
                              onChange={(v) => handleChangeRowShift(idx, 'fridayShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.saturdayOddShift}
                              onChange={(v) => handleChangeRowShift(idx, 'saturdayOddShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.saturdayEvenShift}
                              onChange={(v) => handleChangeRowShift(idx, 'saturdayEvenShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                          <td>
                            <Select
                              placeholder="Chọn ca"
                              options={shiftOptions}
                              value={row.sundayShift}
                              onChange={(v) => handleChangeRowShift(idx, 'sundayShift', v)}
                              allowClear
                              style={{ width: '100%' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: '1px solid #e83e8c',
                        backgroundColor: '#fff',
                        color: '#e83e8c',
                        fontSize: 16,
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={handleAddEmployeeRow}
                      title="Thêm nhân sự"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Case 1B: Lập theo tuần cho phòng ban / vị trí (Ảnh 1) */
              <div style={{ marginTop: 16, marginBottom: 24, maxWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, marginBottom: 8, fontWeight: 600, color: '#64748b', fontSize: 13 }}>
                  <div>Thứ</div>
                  <div>Ca</div>
                </div>
                {[
                  { label: 'Thứ 2', key: 'mondayShift' },
                  { label: 'Thứ 3', key: 'tuesdayShift' },
                  { label: 'Thứ 4', key: 'wednesdayShift' },
                  { label: 'Thứ 5', key: 'thursdayShift' },
                  { label: 'Thứ 6', key: 'fridayShift' },
                  { label: 'Thứ 7 (lẻ)', key: 'saturdayOddShift' },
                  { label: 'Thứ 7 (chẵn)', key: 'saturdayEvenShift' },
                  { label: 'Chủ nhật', key: 'sundayShift' },
                ].map((day) => (
                  <div key={day.key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, alignItems: 'center', marginBottom: 10 }}>
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 4,
                        padding: '6px 12px',
                        color: '#1e293b',
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {day.label}
                    </div>
                    <Form.Item name={day.key} style={{ marginBottom: 0 }}>
                      <Select placeholder="Chọn ca" options={shiftOptions} allowClear />
                    </Form.Item>
                  </div>
                ))}
              </div>
            )}

            {/* SECTION 4: Đính kèm */}
            <div style={{ marginBottom: 24, maxWidth: 640 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Đính kèm</div>
              <div
                style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: 8,
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#fdfdfd',
                }}
              >
                <CloudUploadOutlined style={{ fontSize: 36, color: '#e83e8c', marginBottom: 8 }} />
                <div style={{ color: '#475569', fontSize: 13, marginBottom: 12 }}>
                  Kéo thả file vào đây để tải lên hoặc
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                  <Button type="primary" style={{ backgroundColor: '#e83e8c', borderColor: '#e83e8c', borderRadius: 6 }}>
                    CHỌN TỪ MÁY
                  </Button>
                  <Button style={{ borderRadius: 6 }}>CHỌN TỪ CLOUD</Button>
                </div>
              </div>
            </div>

            {/* Action buttons matching Image 2 */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 12, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{ backgroundColor: '#e83e8c', borderColor: '#e83e8c', padding: '0 24px', fontWeight: 600, height: 36 }}
              >
                CẬP NHẬT
              </Button>
              <Button onClick={() => setIsCreateMode(false)} style={{ padding: '0 20px', height: 36 }}>
                HỦY BỎ
              </Button>
            </div>
          </Form>
        </div>
      )}

      {/* 📍 BƯỚC 1 & 2 & 3: Cài đặt Chấm công / Ca làm việc Screen Overlay (Matching Image 1) */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{ cursor: 'pointer', color: '#64748b', fontSize: 14 }}
                onClick={() => setSettingsOpen(false)}
              >
                ‹ Quay lại phân hệ
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Chấm công</span>
            </div>
          </div>
        }
        size="large"
        styles={{ wrapper: { width: '100vw' }, body: { padding: 0, background: '#f8fafc' } }}
        onClose={() => setSettingsOpen(false)}
        open={settingsOpen}
        mask={{ closable: false }}
      >
        <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
          {/* Left Sidebar Menu (Image 1) */}
          <div style={{ width: 240, background: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '16px 0' }}>
            <div style={{ padding: '0 16px 12px 16px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              ⚙️ Cài đặt chung
            </div>
            <div
              style={{
                padding: '10px 24px',
                background: '#fff0f6',
                color: '#e83e8c',
                fontWeight: 600,
                borderLeft: '3px solid #e83e8c',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Ca làm việc
            </div>
            <div style={{ padding: '10px 24px', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>
              Chấm công GPS/Wifi
            </div>
            <div style={{ padding: '10px 24px', color: '#64748b', fontSize: 14, cursor: 'pointer' }}>
              Quy trình duyệt
            </div>

            <div style={{ padding: '20px 16px 12px 16px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              ⚙️ Cài đặt đối tượng
            </div>
          </div>

          {/* Right Main Content (Image 1) */}
          <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
            <div style={{ background: '#ffffff', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Tab & Actions Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#e83e8c', borderBottom: '2px solid #e83e8c', paddingBottom: 10 }}>
                  Ca làm việc
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateTemplateModal}
                    style={{ backgroundColor: '#e83e8c', borderColor: '#e83e8c', fontWeight: 600 }}
                  >
                    Tạo mới
                  </Button>
                  <Button icon={<ExportOutlined />}>Export</Button>
                  <Button icon={<ImportOutlined />}>Import</Button>
                </div>
              </div>

              {/* Shift Templates List Table */}
              <Table
                columns={shiftTemplateColumns}
                dataSource={shiftsList}
                rowKey="id"
                pagination={{ pageSize: 20 }}
                size="middle"
              />
              <div style={{ marginTop: 12, color: '#64748b', fontSize: 13 }}>
                Hiển thị 1 - {shiftsList.length} / {shiftsList.length} bản ghi
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* 📍 BƯỚC 3: Modal "Tạo mới ca làm việc" (Matching Image 3 & 4 Exact Design) */}
      <Modal
        title={
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Tạo mới ca làm việc
          </div>
        }
        open={createShiftTemplateModalOpen}
        onCancel={() => setCreateShiftTemplateModalOpen(false)}
        footer={null}
        width={840}
        destroyOnHidden
        mask={{ closable: false }}
        keyboard={false}
        style={{ top: 20 }}
      >
        <Form
          form={templateForm}
          layout="vertical"
          onFinish={handleCreateShiftTemplateSubmit}
          initialValues={{
            overnight: 'Không',
            standardHours: 1,
            flexibleOption: 'Không áp dụng',
            midShiftOvertime: 'NO_ACCEPT',
            gpsOption: 'Chấm công qua GPS',
          }}
        >
          {/* SECTION 1: Thông tin chung */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#e83e8c', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              ∨ Thông tin chung
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label={<span>Mã ca <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng nhập mã ca' }]}
                >
                  <Input placeholder="Mã ca" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label={<span>Tên ca <span style={{ color: '#ef4444' }}>*</span></span>}
                  rules={[{ required: true, message: 'Vui lòng nhập tên ca' }]}
                >
                  <Input placeholder="Tên ca" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24} style={{ marginBottom: 16 }}>
              <Col span={12} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="multipleIntervals" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                <span>Nhiều khoảng làm việc</span>
              </Col>
              <Col span={12} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="active" valuePropName="checked" noStyle>
                  <Switch defaultChecked />
                </Form.Item>
                <span>Hoạt động ❓</span>
              </Col>
            </Row>

            {/* Sub-section: Ca chính */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8 }}>Ca chính</div>
              <Row gutter={12}>
                <Col span={5}>
                  <Form.Item name="startTime" label="Giờ vào">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item name="endTime" label="Giờ ra">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name="overnight" label="Qua ngày *">
                    <Select options={[{ value: 'Không', label: 'Không' }, { value: 'Có', label: 'Có' }]} />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item name="breakStart" label="Giờ nghỉ">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={5}>
                  <Form.Item name="breakEnd" label="Kết thúc nghỉ">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={12}>
                <Col span={6}>
                  <Form.Item name="checkInEarly" label="Check in trước">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="checkOutLate" label="Check out sau">
                    <TimePicker format="HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="totalHours" label="Tổng giờ">
                    <Input readOnly placeholder="8" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="standardHours" label="Tổng công *">
                    <Input defaultValue="1" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Sub-section: Ca làm thêm (Matching 1Office Exact Layout) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                Ca làm thêm{' '}
                <Tooltip title="Cấu hình các khoảng ca làm thêm ngoài ca chính">
                  <QuestionCircleOutlined style={{ color: '#e83e8c', fontSize: 13 }} />
                </Tooltip>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr 1fr 1.2fr 1fr 1fr 32px', gap: 8, alignItems: 'flex-start' }}>
                <Form.Item name="otStartTime" label={<span style={{ fontSize: 12 }}>Từ giờ <span style={{ color: '#ef4444' }}>*</span></span>} style={{ marginBottom: 8 }}>
                  <TimePicker format="HH:mm" placeholder="hh:mm" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="otDayType" label=" " style={{ marginBottom: 8 }}>
                  <Select defaultValue="Hôm nay" allowClear options={[{ value: 'Hôm nay', label: 'Hôm nay' }, { value: 'Hôm sau', label: 'Hôm sau' }]} />
                </Form.Item>

                <Form.Item name="otEndTime" label={<span style={{ fontSize: 12 }}>Đến giờ <span style={{ color: '#ef4444' }}>*</span></span>} style={{ marginBottom: 8 }}>
                  <TimePicker format="HH:mm" placeholder="hh:mm" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="otOvernight" label={<span style={{ fontSize: 12 }}>Qua ngày</span>} style={{ marginBottom: 8 }}>
                  <Select defaultValue="Không" allowClear options={[{ value: 'Không', label: 'Không' }, { value: 'Có', label: 'Có' }]} />
                </Form.Item>

                <Form.Item name="otType" label={<span style={{ fontSize: 12 }}>Kiểu</span>} style={{ marginBottom: 8 }}>
                  <Select defaultValue="Tính công" allowClear options={[{ value: 'Tính công', label: 'Tính công' }, { value: 'Tính giờ', label: 'Tính giờ' }]} />
                </Form.Item>

                <Form.Item name="otHours" label={<span style={{ fontSize: 12 }}>Số giờ</span>} style={{ marginBottom: 8 }}>
                  <Input placeholder="Số giờ" />
                </Form.Item>

                <Form.Item name="otStandard" label={<span style={{ fontSize: 12 }}>Số công</span>} style={{ marginBottom: 8 }}>
                  <Input placeholder="Số công" />
                </Form.Item>

                <div style={{ paddingTop: 28, display: 'flex', justifyContent: 'center' }}>
                  <CloseOutlined style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 14 }} onClick={() => message.info('Xóa dòng ca làm thêm')} />
                </div>
              </div>

              {/* Plus Circle Button and Summary Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '1px solid #e83e8c',
                    backgroundColor: '#fff',
                    color: '#e83e8c',
                    fontSize: 16,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => message.info('Thêm dòng ca làm thêm mới')}
                >
                  +
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>Tổng</span>
                  <Input style={{ width: 100 }} readOnly placeholder="Số giờ" value="" />
                  <Input style={{ width: 100 }} readOnly placeholder="0" value="0" />
                </div>
              </div>

              {/* Checkbox */}
              <div style={{ marginTop: 12 }}>
                <Form.Item name="otCalcByMainShiftDay" valuePropName="checked" style={{ marginBottom: 0 }}>
                  <Checkbox>
                    <span style={{ fontSize: 13, color: '#334155' }}>
                      Tính giờ ca làm thêm theo ngày của ca chính{' '}
                      <Tooltip title="Nếu bật, giờ ca làm thêm sẽ tính vào công ngày của ca chính">
                        <QuestionCircleOutlined style={{ color: '#e83e8c', fontSize: 13 }} />
                      </Tooltip>
                    </span>
                  </Checkbox>
                </Form.Item>
              </div>
            </div>
          </div>

          {/* SECTION 2: Linh hoạt ca */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#e83e8c', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              ∨ Linh hoạt ca
            </div>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="flexibleOption" label="Áp dụng giờ linh hoạt">
                  <Select
                    options={[
                      { value: 'Không áp dụng', label: 'Không áp dụng' },
                      { value: 'Cho phép 15 phút', label: 'Cho phép 15 phút' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col span={24} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Form.Item name="recalculateLeave" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                <span>Tính toán lại phép dựa theo giờ linh hoạt ❓</span>
              </Col>
            </Row>
          </div>

          {/* SECTION 3: Tự động nhận biết ca và đối tượng áp dụng */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#e83e8c', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              ∨ Tự động nhận biết ca và đối tượng áp dụng
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Form.Item name="autoDetectDept" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                <span>Tự động nhận biết theo phòng ban, vị trí</span>
              </Space>
              <Space>
                <Form.Item name="autoHoliday" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                <span>Ca tự động áp dụng cho ngày nghỉ lễ ❓</span>
              </Space>
              <Space>
                <Form.Item name="autoTimekeep" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                <span>Chấm công tự động</span>
              </Space>
              <Space>
                <Form.Item name="autoCheckout" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                <span>Checkout tự động áp dụng cho vị trí</span>
              </Space>
            </Space>
          </div>

          {/* SECTION 4: Cài đặt giữa ca */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#e83e8c', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              ∨ Cài đặt giữa ca
            </div>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <Form.Item name="midShiftCheckoutRequired" valuePropName="checked" noStyle>
                  <Switch />
                </Form.Item>
                <span>Bắt buộc chốt giữa ca</span>
              </Space>
              <div>
                <div style={{ color: '#475569', fontSize: 13, marginBottom: 4 }}>Giờ làm thêm giữa ca</div>
                <Form.Item name="midShiftOvertime" noStyle>
                  <Radio.Group>
                    <Radio value="NO_ACCEPT">Không chấp nhận</Radio>
                    <Radio value="AUTO">Tự động tính</Radio>
                    <Radio value="FORM">Tính theo đơn làm thêm</Radio>
                  </Radio.Group>
                </Form.Item>
              </div>
            </Space>
          </div>

          {/* SECTION 5: Chấm công qua ứng dụng */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#e83e8c', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              ∨ Chấm công qua ứng dụng
            </div>
            <Form.Item name="gpsOption" label="Chấm công qua GPS">
              <Select options={[{ value: 'Chấm công qua GPS', label: 'Chấm công qua GPS' }]} />
            </Form.Item>
          </div>

          {/* Footer Action Buttons (Matching Images 3 & 4) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Button onClick={() => setCreateShiftTemplateModalOpen(false)} style={{ padding: '0 20px' }}>
              HỦY BỎ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingTemplate}
              style={{ backgroundColor: '#e83e8c', borderColor: '#e83e8c', padding: '0 24px', fontWeight: 600 }}
            >
              CẬP NHẬT
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
}
