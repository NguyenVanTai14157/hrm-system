import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { gpsInput, shiftInput } from './settings-validation';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getGpsSettings() {
    return this.prisma.client.gpsLocation.findMany({
      orderBy: { code: 'asc' },
      include: { assignedEmployees: { include: { employee: { select: { id: true, code: true, name: true } } } } },
    });
  }

  async saveGpsSettings(rows: Record<string, unknown>[], id?: string) {
    if (!Array.isArray(rows) || !rows.length || rows.length > 100)
      throw new BadRequestException('Nhập từ 1 đến 100 địa điểm');
    const data = rows.map(gpsInput);
    try {
      if (id) return await this.prisma.client.gpsLocation.update({ where: { id }, data: data[0] });
      return await this.prisma.client.$transaction(data.map(item => this.prisma.client.gpsLocation.create({ data: item })));
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw new BadRequestException('Mã địa điểm đã tồn tại; chưa lưu thay đổi');
      if ((error as { code?: string }).code === 'P2025') throw new NotFoundException('Không tìm thấy địa điểm');
      throw error;
    }
  }

  async saveShiftSettings(input: Record<string, unknown>, id?: string) {
    const data = shiftInput(input);
    const gpsIds = Array.isArray(input.gpsLocationIds) ? input.gpsLocationIds.filter((v): v is string => typeof v === 'string') : [];
    try {
      const saved = id
        ? await this.prisma.client.shift.update({ where: { id }, data })
        : await this.prisma.client.shift.create({ data });
      await this.prisma.client.shiftGpsLocation.deleteMany({ where: { shiftId: saved.id } });
      if (gpsIds.length) await this.prisma.client.shiftGpsLocation.createMany({ data: gpsIds.map(gpsLocationId => ({ shiftId: saved.id, gpsLocationId })), skipDuplicates: true });
      return this.prisma.client.shift.findUnique({ where: { id: saved.id }, include: { gpsLocations: { include: { gpsLocation: true } } } });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') throw new BadRequestException('Mã ca đã tồn tại');
      if ((error as { code?: string }).code === 'P2025') throw new NotFoundException('Không tìm thấy ca');
      throw error;
    }
  }

  // ── Shift CRUD (Bước A: Tạo Ca mẫu) ────────────────────────────────────────

  async getShifts() {
    return this.prisma.client.shift.findMany({ orderBy: { name: 'asc' }, include: { gpsLocations: { include: { gpsLocation: true } } } });
  }

  async createShift(data: {
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
    standardHours?: number;
    coefficient?: number;
    graceLateMinutes?: number;
    color?: string;
    description?: string;
  }) {
    return this.prisma.client.shift.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStart: data.breakStart ?? null,
        breakEnd: data.breakEnd ?? null,
        standardHours: data.standardHours ?? 8,
        coefficient: data.coefficient ?? 1.0,
        graceLateMinutes: data.graceLateMinutes ?? 15,
        color: data.color ?? 'green',
        description: data.description ?? null,
      },
    });
  }

  async updateShift(id: string, data: {
    name?: string;
    startTime?: string;
    endTime?: string;
    breakStart?: string;
    breakEnd?: string;
    standardHours?: number;
    coefficient?: number;
    graceLateMinutes?: number;
    color?: string;
    description?: string;
  }) {
    return this.prisma.client.shift.update({ where: { id }, data });
  }

  async deleteShift(id: string) {
    // Check if shift has any assignments first
    const count = await this.prisma.client.shiftAssignment.count({ where: { shiftId: id } });
    if (count > 0) {
      return { success: false, message: `Không thể xóa: ca này đang được gán cho ${count} lượt phân ca.` };
    }
    await this.prisma.client.shift.delete({ where: { id } });
    return { success: true, message: 'Đã xóa ca làm việc thành công.' };
  }

  // ── Shift Assignment (Bước B: Phân ca cho Nhân viên) ────────────────────────

  async getShiftAssignments(month: string) {
    const { startDate, endDate } = this.monthRange(month);
    return this.prisma.client.shiftAssignment.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
            jobTitle: { select: { id: true, name: true } },
          },
        },
        shift: true,
      },
    });
  }

  async getEmployees() {
    return this.prisma.client.employee.findMany({
      where: { status: { not: 'STOP_WORKING' } },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        departmentId: true,
        positionId: true,
        jobTitleId: true,
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        jobTitle: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCatalogs() {
    return this.prisma.client.employeeCatalog.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Core assignment logic: supports GROUP (by department) and PERSON (individual),
   * with WEEKLY (Mon-Fri repeat) and RANGE (specific date range) modes.
   */
  async assignShifts(data: {
    type: 'GROUP' | 'PERSON';
    shiftId: string;
    departmentId?: string;
    positionId?: string;
    jobTitleId?: string;
    departmentIds?: string[];
    positionIds?: string[];
    jobTitleIds?: string[];
    employeeIds?: string[];
    repeatType: 'WEEKLY' | 'RANGE';
    dateStart: string;
    dateEnd: string;
    weekdays?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Default [1,2,3,4,5] for Mon-Fri
  }) {
    // 1. Resolve target employees
    let employeeIds: string[] = [];

    if (data.type === 'GROUP') {
      const whereClause: any = { status: 'WORKING' };

      const deptIds = (data.departmentIds?.length ? data.departmentIds : (data.departmentId ? [data.departmentId] : [])).filter(Boolean);
      if (deptIds.length === 1) whereClause.departmentId = deptIds[0];
      else if (deptIds.length > 1) whereClause.departmentId = { in: deptIds };

      const posIds = (data.positionIds?.length ? data.positionIds : (data.positionId ? [data.positionId] : [])).filter(Boolean);
      if (posIds.length === 1) whereClause.positionId = posIds[0];
      else if (posIds.length > 1) whereClause.positionId = { in: posIds };

      const jobIds = (data.jobTitleIds?.length ? data.jobTitleIds : (data.jobTitleId ? [data.jobTitleId] : [])).filter(Boolean);
      if (jobIds.length === 1) whereClause.jobTitleId = jobIds[0];
      else if (jobIds.length > 1) whereClause.jobTitleId = { in: jobIds };

      const employees = await this.prisma.client.employee.findMany({
        where: whereClause,
        select: { id: true },
      });
      employeeIds = employees.map(e => e.id);
    } else if (data.type === 'PERSON' && data.employeeIds?.length) {
      employeeIds = data.employeeIds;
    }

    if (employeeIds.length === 0) {
      return { success: false, saved: 0, message: 'Không tìm thấy nhân viên nào phù hợp với bộ lọc (Phòng ban, Vị trí, Chức vụ) để phân ca.' };
    }

    // 2. Verify shift exists
    const shift = await this.prisma.client.shift.findUnique({ where: { id: data.shiftId } });
    if (!shift) {
      return { success: false, saved: 0, message: 'Ca làm việc không tồn tại.' };
    }

    // 3. Expand dates based on repeatType
    const dates = this.expandDates(
      data.dateStart,
      data.dateEnd,
      data.repeatType,
      data.weekdays ?? [1, 2, 3, 4, 5], // Default Mon-Fri
    );

    // 4. Bulk upsert assignments
    let saved = 0;
    for (const empId of employeeIds) {
      for (const dateStr of dates) {
        try {
          const d = new Date(dateStr);
          const existing = await this.prisma.client.shiftAssignment.findFirst({
            where: { employeeId: empId, date: d, shiftId: data.shiftId },
          });
          if (existing) {
            await this.prisma.client.shiftAssignment.update({
              where: { id: existing.id },
              data: { status: 'PENDING' },
            });
          } else {
            await this.prisma.client.shiftAssignment.create({
              data: { employeeId: empId, shiftId: data.shiftId, date: d, status: 'PENDING' },
            });
          }
          saved++;
        } catch (_) {
          // Skip errors (e.g., employee deleted between queries)
        }
      }
    }

    return {
      success: true,
      saved,
      employees: employeeIds.length,
      days: dates.length,
      message: `✅ Đã phân ca thành công: ${employeeIds.length} nhân viên × ${dates.length} ngày = ${saved} lượt gán.`,
    };
  }

  async bulkSaveShiftAssignments(
    assignments: { employeeId: string; shiftId: string; date: string; title?: string; repeatType?: string; status?: string }[],
  ) {
    if (!assignments || assignments.length === 0) return { saved: 0 };

    let saved = 0;
    for (const a of assignments) {
      try {
        const d = new Date(a.date);
        const whereClause: any = {
          employeeId: a.employeeId,
          date: d,
        };
        if (a.title && a.title.trim()) {
          whereClause.title = a.title.trim();
        }
        if (a.status && a.status.trim()) {
          whereClause.status = a.status.trim();
        }

        const existing = await this.prisma.client.shiftAssignment.findFirst({
          where: whereClause,
        });

        if (existing) {
          await this.prisma.client.shiftAssignment.update({
            where: { id: existing.id },
            data: {
              shiftId: a.shiftId,
              ...(a.title ? { title: a.title.trim() } : {}),
              ...(a.repeatType ? { repeatType: a.repeatType.trim() } : {}),
              ...(a.status ? { status: a.status.trim() } : {}),
            },
          });
        } else {
          await this.prisma.client.shiftAssignment.create({
            data: {
              employeeId: a.employeeId,
              shiftId: a.shiftId,
              date: d,
              title: a.title ? a.title.trim() : undefined,
              repeatType: a.repeatType ? a.repeatType.trim() : undefined,
              status: a.status ? a.status.trim() : 'PENDING',
            },
          });
        }
        saved++;
      } catch (err) {
        console.error('Lỗi khi lưu phân ca:', err);
      }
    }
    return { saved };
  }

  async approveShiftAssignments(body: { title?: string; ids?: string[] }) {
    if (body.title && body.title.trim()) {
      const title = body.title.trim();

      // Check if there are DRAFT assignments for this title (edited version of an already approved rule)
      const draftCount = await this.prisma.client.shiftAssignment.count({
        where: { title, status: 'DRAFT' },
      });

      if (draftCount > 0) {
        // 1. Delete old APPROVED records for this title
        await this.prisma.client.shiftAssignment.deleteMany({
          where: { title, status: 'APPROVED' },
        });
        // 2. Promote all DRAFT records to APPROVED
        const res = await this.prisma.client.shiftAssignment.updateMany({
          where: { title, status: 'DRAFT' },
          data: { status: 'APPROVED' },
        });
        return { count: res.count, status: 'APPROVED' };
      } else {
        // Normal approval of newly created or PENDING assignments
        const res = await this.prisma.client.shiftAssignment.updateMany({
          where: { title, status: { in: ['PENDING', 'DRAFT'] } },
          data: { status: 'APPROVED' },
        });
        return { count: res.count, status: 'APPROVED' };
      }
    }

    if (body.ids && body.ids.length > 0) {
      const realIds = body.ids.filter((id) => !id.startsWith('edit-') && !id.startsWith('new-') && !id.startsWith('sr-'));
      if (realIds.length > 0) {
        const res = await this.prisma.client.shiftAssignment.updateMany({
          where: { id: { in: realIds } },
          data: { status: 'APPROVED' },
        });
        return { count: res.count, status: 'APPROVED' };
      }
    }

    return { count: 0, status: 'APPROVED' };
  }

  async revertShiftAssignments(body: { title?: string; ids?: string[] }) {
    const whereClause: any = {};
    if (body.ids && body.ids.length > 0) {
      whereClause.id = { in: body.ids };
    } else if (body.title && body.title.trim()) {
      whereClause.title = body.title.trim();
    } else {
      return { count: 0, status: 'PENDING' };
    }

    const res = await this.prisma.client.shiftAssignment.updateMany({
      where: whereClause,
      data: { status: 'PENDING' },
    });
    return { count: res.count, status: 'PENDING' };
  }

  async deleteShiftAssignments(ids: string[]) {
    if (!ids || ids.length === 0) return { deleted: 0 };
    const res = await this.prisma.client.shiftAssignment.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: res.count };
  }

  // ── Attendance Logs ────────────────────────────────────────────────────────

  async getAttendanceLogs(month: string) {
    const { startDate, endDate } = this.monthRange(month);
    return this.prisma.client.attendanceLog.findMany({
      where: { date: { gte: startDate, lt: endDate } },
      include: { employee: { select: { id: true, code: true, name: true } } },
    });
  }

  // ── Timesheet (computed) ───────────────────────────────────────────────────

  async getTimesheet(month: string) {
    const { startDate, endDate } = this.monthRange(month);

    const [employees, assignments, logs, approvedApps] = await Promise.all([
      this.prisma.client.employee.findMany({
        where: { status: 'WORKING' },
        select: { id: true, code: true, name: true, department: { select: { name: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.shiftAssignment.findMany({
        where: {
          date: { gte: startDate, lt: endDate },
          status: 'APPROVED',
        },
        include: { shift: true },
      }),
      this.prisma.client.attendanceLog.findMany({
        where: { date: { gte: startDate, lt: endDate } },
      }),
      this.prisma.client.application.findMany({
        where: {
          status: 'APPROVED',
        },
      }),
    ]);

    const year = startDate.getFullYear();
    const monthIdx = startDate.getMonth();
    const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Build lookup maps
    const assignMap: Record<string, Record<number, any>> = {};
    for (const a of assignments) {
      const day = new Date(a.date).getDate();
      if (!assignMap[a.employeeId]) assignMap[a.employeeId] = {};
      assignMap[a.employeeId][day] = a.shift;
    }

    const logMap: Record<string, Record<number, any>> = {};
    for (const l of logs) {
      const day = new Date(l.date).getDate();
      if (!logMap[l.employeeId]) logMap[l.employeeId] = {};
      logMap[l.employeeId][day] = l;
    }

    // Build rows
    const rows = employees.map((emp) => {
      let totalStandard = 0;
      let totalActual = 0;
      let totalOT = 0;
      let totalLeave = 0;

      const cells = days.map((day) => {
        const date = new Date(year, monthIdx, day);
        const dow = date.getDay();
        const isWeekend = dow === 0 || dow === 6;
        const shift = assignMap[emp.id]?.[day];
        const log = logMap[emp.id]?.[day];
        
        if (shift && !isWeekend) totalStandard++;
        
        let status = 'NONE'; // NONE | PRESENT | ABSENT | LATE | LEAVE | OT | WEEKEND
        let hours = 0;

        if (isWeekend) {
          status = 'WEEKEND';
        } else if (shift) {
          if (log) {
            status = 'PRESENT';
            hours = log.hoursWorked ?? 8;
            totalActual += 1;
          } else {
            // Check approved leave
            const hasLeave = approvedApps.some((a) => {
              const appDate = (a.payload as any)?.date;
              return a.employeeId === emp.id && appDate === `${year}-${String(monthIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            });
            if (hasLeave) {
              status = 'LEAVE';
              totalLeave++;
              totalActual += 1;
            } else {
              status = 'ABSENT';
            }
          }
        }

        // Check OT
        const hasOT = approvedApps.some((a) => {
          const appDate = (a.payload as any)?.date;
          return a.employeeId === emp.id && a.type === 'Đơn làm thêm giờ' &&
            appDate === `${year}-${String(monthIdx+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        });
        if (hasOT) { status = 'OT'; totalOT++; totalActual += 1; }

        return { day, status, hours, shift: shift?.name ?? null };
      });

      return {
        employee: { id: emp.id, code: emp.code, name: emp.name, department: (emp.department as any)?.name },
        cells,
        summary: { totalStandard, totalActual, totalOT, totalLeave, totalAbsent: totalStandard - totalActual + totalLeave },
      };
    });

    return { month, rows };
  }

  // ── Lock Timesheet (Chốt bảng công) ───────────────────────────────────────

  async lockTimesheet(month: string) {
    const existing = await this.prisma.client.timesheetLock.findUnique({ where: { month } });
    if (existing) {
      return { success: true, alreadyLocked: true, message: `Bảng chấm công tháng ${month} đã được chốt trước đó.`, lock: existing };
    }
    const lock = await this.prisma.client.timesheetLock.create({
      data: { month },
    });
    return { success: true, alreadyLocked: false, message: `✅ Đã chốt bảng chấm công tháng ${month} thành công!`, lock };
  }

  async unlockTimesheet(month: string) {
    try {
      await this.prisma.client.timesheetLock.delete({ where: { month } });
      return { success: true, message: `🔓 Đã mở khóa bảng chấm công tháng ${month}.` };
    } catch (_) {
      return { success: false, message: `Tháng ${month} chưa được chốt.` };
    }
  }

  async lockApplications(month: string) {
    // Cancel all WAITING applications for this month
    const { startDate, endDate } = this.monthRange(month);
    
    const waitingApps = await this.prisma.client.application.findMany({
      where: { status: { in: ['WAITING', 'APPROVING'] } },
    });

    let canceled = 0;
    for (const app of waitingApps) {
      const payload = app.payload as any;
      const appDate = payload?.date || payload?.startDate;
      if (appDate) {
        const d = new Date(appDate);
        if (d >= startDate && d < endDate) {
          await this.prisma.client.application.update({
            where: { id: app.id },
            data: { status: 'CANCELED' },
          });
          canceled++;
        }
      }
    }

    // Mark lock as having apps locked
    await this.prisma.client.timesheetLock.upsert({
      where: { month },
      create: { month, appsLocked: true },
      update: { appsLocked: true },
    });

    return { success: true, canceled, message: `🔐 Đã chốt ${canceled} đơn từ chưa duyệt trong tháng ${month}.` };
  }

  async getTimesheetLockStatus(month: string) {
    const lock = await this.prisma.client.timesheetLock.findUnique({ where: { month } });
    return {
      locked: !!lock,
      appsLocked: lock?.appsLocked ?? false,
      lockedAt: lock?.lockedAt ?? null,
    };
  }

  // ── Sub-functions ──────────────────────────────────────────────────────────

  async getMealTimesheet(month: string) {
    const timesheet = await this.getTimesheet(month);
    
    return timesheet.rows.map(row => {
      let totalCa = 0;
      let totalOt = 0;
      const days: Record<number, { ca: number; ot: number }> = {};
      
      row.cells.forEach(c => {
        const ca = c.hours >= 4 || c.status === 'PRESENT' ? 1 : 0;
        const ot = c.status === 'OT' ? 1 : 0;
        if (ca > 0 || ot > 0) {
          days[c.day] = { ca, ot };
          totalCa += ca;
          totalOt += ot;
        }
      });

      return {
        key: row.employee.id,
        code: row.employee.code,
        name: row.employee.name,
        department: row.employee.department ?? 'Nhiệm vụ chung',
        days,
        totalCa,
        totalOt,
        totalMeals: totalCa + totalOt,
      };
    });
  }

  async getAutoRules() {
    const rules = await this.prisma.client.autoTimekeepRule.findMany({
      include: { employee: { select: { code: true, name: true, department: { select: { name: true } }, position: { select: { name: true } } } } },
    });
    return rules.map((r) => ({
      id: r.id,
      code: r.employee.code,
      name: r.employee.name,
      department: r.employee.department?.name ?? 'BAN GIÁM ĐỐC',
      position: r.employee.position?.name ?? 'Cấp quản lý',
      startDate: r.startDate.toISOString().slice(0, 10),
      endDate: r.endDate ? r.endDate.toISOString().slice(0, 10) : 'Vĩnh viễn',
      status: r.status,
      note: r.note || 'Tự động công chuẩn.',
    }));
  }

  async getShiftRegisters() {
    const registers = await this.prisma.client.shiftRegister.findMany({
      include: { employee: { select: { code: true, name: true, department: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    return registers.map((r) => ({
      id: r.id,
      code: r.employee.code,
      name: r.employee.name,
      department: r.employee.department?.name ?? 'Khối văn phòng',
      type: r.type,
      date: r.date.toISOString().slice(0, 10),
      currentShift: 'Ca Hành chính (08:00 - 17:30)',
      targetShift: 'Ca Sáng (07:00 - 15:30)',
      reason: r.reason || 'Nhu cầu cá nhân',
      status: r.status,
      approver: 'Trưởng phòng / HR',
      createdAt: r.createdAt.toISOString().slice(0, 16).replace('T', ' '),
    }));
  }

  async getDevices() {
    const devices = await this.prisma.client.biometricDevice.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return devices.map((d) => ({
      id: d.id,
      title: d.title,
      machineId: d.machineType,
      ipMachine: d.ipMachine,
      deviceId: d.serialNumber,
      place: d.location,
      typeof: d.directionType,
      status: d.status,
      lastTimeUpdate: d.lastTimeUpdate.toISOString().slice(0, 19).replace('T', ' '),
    }));
  }

  async getRawLogs() {
    const logs = await this.prisma.client.biometricRawLog.findMany({
      include: { employee: { select: { code: true, name: true } } },
      orderBy: { timestamp: 'desc' },
    });
    return logs.map((l) => ({
      id: l.id,
      code: l.employee.code,
      name: l.employee.name,
      time: l.timestamp.toISOString().slice(0, 19).replace('T', ' '),
      fromType: l.fromType,
      location: l.location || 'Trụ sở chính 14 Lê Duy Đình',
      deviceId: l.deviceId || 'HN-2026-X88',
      verifyMode: l.verifyMode || 'Xác thực vân tay/FaceID',
    }));
  }

  async getFurloughSummary() {
    const balances = await this.prisma.client.furloughBalance.findMany({
      include: { employee: { select: { code: true, name: true, joinDate: true, department: { select: { name: true } } } } },
    });
    return balances.map((b) => ({
      id: b.id,
      code: b.employee.code,
      name: b.employee.name,
      department: b.employee.department?.name ?? 'Khối văn phòng',
      joinDate: b.employee.joinDate ? b.employee.joinDate.toISOString().slice(0, 10) : '2023-01-01',
      yearOpen: b.yearOpen,
      yearUsed: b.yearUsed,
      seniorityOpen: b.seniorityOpen,
      accumulationOpen: b.accumulationOpen,
      accumulationExpired: b.accumulationExpired,
      totalClosed: b.yearOpen + b.seniorityOpen + b.accumulationOpen - b.yearUsed - b.accumulationExpired,
    }));
  }

  async getHolidays() {
    const holidays = await this.prisma.client.holidayCalendar.findMany({
      orderBy: { startDate: 'asc' },
    });
    return holidays.map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      startDate: h.startDate.toISOString().slice(0, 10),
      endDate: h.endDate.toISOString().slice(0, 10),
      totalDays: h.totalDays,
      hasSalary: h.hasSalary,
      salaryRate: h.salaryRate,
      symbol: h.symbol,
    }));
  }

  async getStats() {
    const totalEmployees = await this.prisma.client.employee.count({ where: { status: 'WORKING' } });

    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59));

    const todayLogs = await this.prisma.client.attendanceLog.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { employee: { select: { id: true } } },
    });
    const checkedInIds = new Set(todayLogs.map(l => l.employeeId));
    const checkedInToday = checkedInIds.size;

    let onTime = 0;
    let late = 0;
    const todayAssignments = await this.prisma.client.shiftAssignment.findMany({
      where: { date: { gte: todayStart, lte: todayEnd } },
      include: { shift: true },
    });
    const shiftMap = new Map<string, any>();
    for (const a of todayAssignments) {
      shiftMap.set(a.employeeId, a.shift);
    }
    for (const log of todayLogs) {
      const shift = shiftMap.get(log.employeeId);
      if (shift && shift.startTime) {
        const [h, m] = String(shift.startTime).split(':').map(Number);
        const shiftStart = new Date(todayStart);
        shiftStart.setUTCHours(h, m, 0, 0);
        const checkIn = new Date(log.checkIn || log.date);
        if (checkIn <= new Date(shiftStart.getTime() + 5 * 60000)) {
          onTime++;
        } else {
          late++;
        }
      } else {
        onTime++;
      }
    }

    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const approvedLeaves = await this.prisma.client.application.findMany({
      where: {
        status: 'APPROVED',
        type: { in: ['approval-leave', 'Đơn xin nghỉ phép', 'Đơn nghỉ phép'] },
      },
    });
    const onLeave = approvedLeaves.filter(a => {
      const payload = a.payload as any;
      return payload?.date === todayStr || payload?.startDate === todayStr;
    }).length;

    const devices = await this.prisma.client.biometricDevice.findMany({
      orderBy: { lastTimeUpdate: 'desc' },
      take: 5,
    });

    const rawLogs = await this.prisma.client.biometricRawLog.findMany({
      include: { employee: { select: { code: true, name: true } } },
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    return {
      totalEmployees,
      checkedInToday,
      onTime,
      late,
      onLeave,
      devices: devices.map(d => ({
        id: d.id,
        title: d.title,
        machineType: d.machineType,
        ipMachine: d.ipMachine,
        serialNumber: d.serialNumber,
        location: d.location,
        status: d.status,
        lastTimeUpdate: d.lastTimeUpdate.toISOString().slice(0, 19).replace('T', ' '),
      })),
      rawLogs: rawLogs.map(l => ({
        key: l.id,
        emp: `${l.employee.name} (${l.employee.code})`,
        time: l.timestamp.toISOString().slice(11, 19),
        mode: l.verifyMode || 'Vân tay / FaceID',
        loc: l.location || 'Trụ sở chính',
        status: 'Đúng giờ',
      })),
    };
  }

  // ── 1Office Late/Early Penalty Matrix Calculation ─────────────────────────
  calculateFineLateSoon(lateMinutes: number = 0, soonMinutes: number = 0): { fineLate: number; fineSoon: number; totalFine: number } {
    let fineLate = 0;
    if (lateMinutes > 0 && lateMinutes <= 15) {
      fineLate = 20000;
    } else if (lateMinutes > 15 && lateMinutes <= 30) {
      fineLate = 50000;
    } else if (lateMinutes > 30) {
      fineLate = 100000;
    }

    let fineSoon = 0;
    if (soonMinutes > 0 && soonMinutes <= 15) {
      fineSoon = 20000;
    } else if (soonMinutes > 15 && soonMinutes <= 30) {
      fineSoon = 50000;
    } else if (soonMinutes > 30) {
      fineSoon = 100000;
    }

    return { fineLate, fineSoon, totalFine: fineLate + fineSoon };
  }

  // ── 1Office Excel Import Parser Format 1: Raw Check Logs ────────────────────
  async importRawCheckLogs(records: Array<{ personnelCode: string; timestamp: string; location?: string; type?: string }>) {
    let imported = 0;
    for (const rec of records) {
      const emp = await this.prisma.client.employee.findFirst({
        where: { OR: [{ code: rec.personnelCode }, { id: rec.personnelCode }] },
      });
      if (emp) {
        const checkDate = new Date(rec.timestamp);
        await this.prisma.client.biometricRawLog.create({
          data: {
            employeeId: emp.id,
            timestamp: checkDate,
            location: rec.location || 'Máy quẹt thẻ / USB',
            verifyMode: rec.type || 'Vân tay',
            fromType: 'EXCEL_IMPORT',
          },
        });
        imported++;
      }
    }
    return { success: true, imported, total: records.length };
  }

  // ── Haversine Distance Calculator ──────────────────────────────────────────
  calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  // ── Mobile App GPS Check-in & Check-out ───────────────────────────────────
  async getAssignedGpsLocations(employeeId: string) {
    const emp = await this.prisma.client.employee.findUnique({
      where: { id: employeeId },
      include: {
        gpsLocations: {
          include: { gpsLocation: true },
        },
      },
    });
    if (!emp) return [];

    let activeLocs = (emp.gpsLocations || [])
      .map((l) => l.gpsLocation)
      .filter((loc) => loc && loc.isActive);

    // Fallback: If employee has no specific assignments, return all active company locations
    if (activeLocs.length === 0) {
      activeLocs = await this.prisma.client.gpsLocation.findMany({
        where: { isActive: true },
      });
    }

    return activeLocs.map((loc) => ({
      id: loc.id,
      code: loc.code,
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.radius,
    }));
  }

  async mobileCheckIn(data: {
    employeeId: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    type?: 'CHECK_IN' | 'CHECK_OUT' | 'AUTO';
  }) {
    const emp = await this.prisma.client.employee.findUnique({
      where: { id: data.employeeId },
      include: {
        gpsLocations: {
          include: { gpsLocation: true },
        },
      },
    });
    if (!emp) throw new NotFoundException('Không tìm thấy hồ sơ nhân sự.');

    if (
      typeof data.latitude !== 'number' ||
      typeof data.longitude !== 'number' ||
      isNaN(data.latitude) ||
      isNaN(data.longitude)
    ) {
      throw new BadRequestException('Vui lòng bật định vị GPS và cấp quyền vị trí trên thiết bị để chấm công.');
    }

    // 1. Validate assigned GPS locations (with active company fallback)
    let activeLocations = (emp.gpsLocations || [])
      .map((l) => l.gpsLocation)
      .filter((loc) => loc && loc.isActive);

    if (activeLocations.length === 0) {
      activeLocations = await this.prisma.client.gpsLocation.findMany({
        where: { isActive: true },
      });
    }

    if (activeLocations.length === 0) {
      throw new BadRequestException('Hệ thống chưa có địa điểm chấm công GPS nào được kích hoạt. Vui lòng liên hệ quản lý / HR.');
    }

    // Compute distance to each assigned location
    const locationEvaluations = activeLocations.map((loc) => {
      const dist = this.calculateHaversineDistance(
        data.latitude!,
        data.longitude!,
        loc.latitude,
        loc.longitude,
      );
      return {
        location: loc,
        distance: dist,
        isInside: dist <= loc.radius,
      };
    });

    const validMatch = locationEvaluations.find((e) => e.isInside);
    if (!validMatch) {
      const closest = locationEvaluations.sort((a, b) => a.distance - b.distance)[0];
      throw new BadRequestException(
        `Vị trí chấm công không hợp lệ (Ngoài bán kính)! Địa điểm gần nhất "${closest.location.name}" cách bạn ${closest.distance}m (Bán kính cho phép tối đa: ${closest.location.radius}m).`,
      );
    }

    const matchedLocationName = `${validMatch.location.name} (${validMatch.location.address || ''})`;

    // 2. Timesheet Lock Check (using server date in Vietnam timezone)
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    const monthStr = todayStr.slice(0, 7);
    const lock = await this.prisma.client.timesheetLock.findUnique({
      where: { month: monthStr },
    });
    if (lock) {
      throw new BadRequestException(`Kỳ công tháng ${monthStr} đã được chốt và khóa. Không thể thực hiện chấm công.`);
    }

    // 3. Anti-Duplicate / Anti-Debounce (60 seconds)
    const now = new Date();
    const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);
    const recentPunch = await this.prisma.client.biometricRawLog.findFirst({
      where: {
        employeeId: emp.id,
        timestamp: { gte: sixtySecondsAgo },
      },
      orderBy: { timestamp: 'desc' },
    });
    if (recentPunch) {
      throw new BadRequestException('Bạn vừa thực hiện chấm công cách đây ít giây. Vui lòng chờ tối thiểu 1 phút trước khi chấm lần tiếp theo.');
    }

    // 4. Save Raw Punch to BiometricRawLog
    await this.prisma.client.biometricRawLog.create({
      data: {
        employeeId: emp.id,
        timestamp: now,
        location: matchedLocationName,
        verifyMode: 'GPS Chuẩn Xác',
        fromType: 'GPS_MOBILE',
      },
    });

    // 5. Upsert AttendanceLog (Preserving initial check-in time)
    const checkDate = new Date(`${todayStr}T00:00:00.000Z`);
    const existingLog = await this.prisma.client.attendanceLog.findFirst({
      where: { employeeId: emp.id, date: checkDate },
    });

    let actionType: 'CHECK_IN' | 'CHECK_OUT' = 'CHECK_IN';

    if (!existingLog) {
      // First punch of the day: Check-in
      actionType = 'CHECK_IN';
      await this.prisma.client.attendanceLog.create({
        data: {
          employeeId: emp.id,
          date: checkDate,
          checkIn: now,
          checkInLocation: matchedLocationName,
          status: 'PRESENT',
        },
      });
    } else if (!existingLog.checkIn) {
      actionType = 'CHECK_IN';
      await this.prisma.client.attendanceLog.update({
        where: { id: existingLog.id },
        data: {
          checkIn: now,
          checkInLocation: matchedLocationName,
          status: 'PRESENT',
        },
      });
    } else {
      // Subsequent punch of the day: Check-out (never overwriting checkIn)
      actionType = 'CHECK_OUT';
      await this.prisma.client.attendanceLog.update({
        where: { id: existingLog.id },
        data: {
          checkOut: now,
          checkOutLocation: matchedLocationName,
          status: 'PRESENT',
        },
      });
    }

    const todayData = await this.getMyToday(emp.id, todayStr);

    return {
      success: true,
      actionType,
      message: `Chấm công ${actionType === 'CHECK_IN' ? 'VÀO (Check-in)' : 'RA (Check-out)'} thành công lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} tại ${validMatch.location.name}!`,
      distance: validMatch.distance,
      locationName: matchedLocationName,
      todayData,
    };
  }

  // ── 1Office Excel Import Parser Format 2: Monthly Timesheet Matrix ──────────
  async importTimesheetMatrix(
    month: string,
    records: Array<{
      personnelCode: string;
      fullname?: string;
      totalWorkday?: number;
      totalOT?: number;
      totalLateMinute?: number;
    }>,
  ) {
    let imported = 0;
    for (const rec of records) {
      const emp = await this.prisma.client.employee.findFirst({
        where: { OR: [{ code: rec.personnelCode }, { id: rec.personnelCode }] },
      });
      if (emp) {
        imported++;
      }
    }
    return { success: true, imported, total: records.length };
  }

  // ── Unified Attendance Calculation Engine ────────────────────────────────
  calculateAttendanceMetrics(
    shift: any | null,
    log: any | null,
  ): {
    workday: number;
    effectiveHours: number;
    effectiveMinutes: number;
    lateMinutes: number;
    earlyMinutes: number;
    status: string;
  } {
    if (!log || (!log.checkIn && !log.checkOut)) {
      return {
        workday: 0,
        effectiveHours: 0,
        effectiveMinutes: 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        status: shift ? 'ABSENT' : 'NO_SHIFT',
      };
    }

    const checkIn = log.checkIn ? new Date(log.checkIn) : null;
    const checkOut = log.checkOut ? new Date(log.checkOut) : null;

    let lateMinutes = 0;
    let earlyMinutes = 0;
    let effectiveHours = 0;
    let effectiveMinutes = 0;
    let workday = 0;
    let status = 'PRESENT';

    // 1. Calculate late minutes
    if (checkIn && shift?.startTime) {
      const [sh, sm] = shift.startTime.split(':').map(Number);
      const inH = checkIn.getHours();
      const inM = checkIn.getMinutes();
      const diffMin = inH * 60 + inM - (sh * 60 + sm);
      const grace = shift.graceLateMinutes ?? 15;
      if (diffMin > grace) {
        lateMinutes = diffMin;
      }
    }

    // 2. Calculate early minutes
    if (checkOut && shift?.endTime) {
      const [eh, em] = shift.endTime.split(':').map(Number);
      const outH = checkOut.getHours();
      const outM = checkOut.getMinutes();
      const diffMin = eh * 60 + em - (outH * 60 + outM);
      const grace = (shift as any).graceEarlyMinutes ?? 15;
      if (diffMin > grace) {
        earlyMinutes = diffMin;
      }
    }

    // 3. Calculate actual work duration & workday
    if (checkIn && checkOut) {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      let diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));

      // Deduct lunch break if shift specifies break window
      if (shift?.breakStart && shift?.breakEnd) {
        const [bsh, bsm] = shift.breakStart.split(':').map(Number);
        const [beh, bem] = shift.breakEnd.split(':').map(Number);
        const breakDurationHrs = Math.max(0, (beh * 60 + bem - (bsh * 60 + bsm)) / 60);
        if (diffHrs >= 5 && breakDurationHrs > 0) {
          diffHrs = Math.max(0, diffHrs - breakDurationHrs);
        }
      }

      effectiveHours = Math.round(diffHrs * 10) / 10;
      effectiveMinutes = Math.round(effectiveHours * 60);

      const standardHours = shift?.standardHours || 8.0;
      const coefficient = shift?.coefficient || 1.0;

      // Full work credit if within 15 minutes of standard hours
      if (effectiveHours >= standardHours - 0.25) {
        workday = coefficient * 1.0;
      } else if (effectiveHours >= standardHours / 2 - 0.25) {
        workday = coefficient * 0.5;
      } else if (effectiveHours > 0) {
        workday = Math.round((effectiveHours / standardHours) * 10) / 10;
      } else {
        workday = 0;
      }
      status = 'PRESENT';
    } else if (checkIn) {
      workday = 0;
      status = 'MISSING_CHECKOUT';
    } else if (checkOut) {
      workday = 0;
      status = 'MISSING_CHECKIN';
    }

    return {
      workday,
      effectiveHours,
      effectiveMinutes,
      lateMinutes,
      earlyMinutes,
      status,
    };
  }

  // ── Today's Attendance & Shifts for Employee ─────────────────────────────
  async getMyToday(employeeId?: string, targetDateStr?: string) {
    const todayStr =
      targetDateStr ||
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    if (!employeeId) {
      return {
        date: todayStr,
        shift: null,
        shifts: [],
        log: null,
        rawLogs: [],
        assignedLocations: [],
        workday: 0,
        workDay: 0,
        effectiveHours: 0,
        effectiveMinutes: 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        monthSummary: { totalWorkdays: 0, lateMinutes: 0, earlyMinutes: 0 },
      };
    }

    // 1. Get today's assignments (only approved shifts show for employee)
    const [assignments, log, rawLogs, assignedLocations] = await Promise.all([
      this.prisma.client.shiftAssignment.findMany({
        where: {
          employeeId,
          date: { gte: startOfDay, lte: endOfDay },
          status: 'APPROVED',
        },
        include: {
          shift: true,
          employee: {
            select: {
              id: true,
              code: true,
              name: true,
              gpsLocation: true,
              department: { select: { name: true } },
            },
          },
        },
        orderBy: { shift: { startTime: 'asc' } },
      }),
      this.prisma.client.attendanceLog.findFirst({
        where: {
          employeeId,
          date: startOfDay,
        },
      }),
      this.prisma.client.biometricRawLog.findMany({
        where: {
          employeeId,
          timestamp: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { timestamp: 'asc' },
      }),
      this.getAssignedGpsLocations(employeeId),
    ]);

    const primaryShift = assignments[0]?.shift || null;
    const metrics = this.calculateAttendanceMetrics(primaryShift, log);

    // 4. Month summary
    const currentMonth = todayStr.slice(0, 7);
    const { startDate, endDate } = this.monthRange(currentMonth);
    const monthLogs = await this.prisma.client.attendanceLog.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lt: endDate },
      },
    });

    let totalWorkdays = 0;
    for (const l of monthLogs) {
      const m = this.calculateAttendanceMetrics(primaryShift, l);
      totalWorkdays += m.workday;
    }

    const shiftObj = primaryShift
      ? {
          id: primaryShift.id,
          code: primaryShift.code,
          name: primaryShift.name,
          startTime: primaryShift.startTime,
          endTime: primaryShift.endTime,
          color: primaryShift.color,
          location:
            assignedLocations[0]?.address ||
            assignedLocations[0]?.name ||
            assignments[0].employee?.gpsLocation ||
            assignments[0].employee?.department?.name ||
            'Địa điểm chưa cấu hình',
        }
      : null;

    return {
      date: todayStr,
      shift: shiftObj,
      shifts: assignments.map((a) => ({
        id: a.id,
        shiftId: a.shift.id,
        code: a.shift.code,
        name: a.shift.name,
        startTime: a.shift.startTime,
        endTime: a.shift.endTime,
        color: a.shift.color,
        location:
          assignedLocations[0]?.address ||
          assignedLocations[0]?.name ||
          a.employee?.gpsLocation ||
          a.employee?.department?.name ||
          'Địa điểm chưa cấu hình',
      })),
      log: log
        ? {
            id: log.id,
            checkIn: log.checkIn ? log.checkIn.toISOString() : null,
            checkOut: log.checkOut ? log.checkOut.toISOString() : null,
            checkInLocation: log.checkInLocation,
            checkOutLocation: log.checkOutLocation,
            status: metrics.status,
          }
        : null,
      rawLogs: rawLogs.map((r) => ({
        id: r.id,
        timestamp: r.timestamp.toISOString(),
        timeStr: new Date(r.timestamp).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        location: r.location || 'GPS Di động',
        fromType: r.fromType,
        verifyMode: r.verifyMode || 'GPS Chuẩn Xác',
      })),
      assignedLocations,
      workday: metrics.workday,
      workDay: metrics.workday,
      effectiveHours: metrics.effectiveHours,
      effectiveMinutes: metrics.effectiveMinutes,
      lateMinutes: metrics.lateMinutes,
      earlyMinutes: metrics.earlyMinutes,
      monthSummary: {
        totalWorkdays: Math.round(totalWorkdays * 10) / 10,
        lateMinutes: metrics.lateMinutes,
        earlyMinutes: metrics.earlyMinutes,
      },
    };
  }

  // ── Monthly Attendance Matrix for Individual Employee ────────────────────
  private calcShiftHours(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 8;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(eh)) return 8;
    let startMin = sh * 60 + (sm || 0);
    let endMin = eh * 60 + (em || 0);
    if (endMin < startMin) endMin += 24 * 60;
    const diffHours = (endMin - startMin) / 60;
    const effectiveHours = diffHours >= 7 ? diffHours - 1 : diffHours;
    return Math.round(effectiveHours * 10) / 10;
  }

  async getMyMonthAttendance(employeeId: string, month: string) {
    if (!employeeId) {
      return {
        month,
        hasData: false,
        isLocked: false,
        daysList: [],
        summary: {
          totalWorkday: 0,
          totalHours: 0,
          standardWorkdays: 0,
          standardHours: 0,
          unexcusedLeaveCount: 0,
          excusedLeaveCount: 0,
          totalLateMinutes: 0,
          leaveDaysRemaining: 12,
        },
      };
    }

    const { startDate, endDate } = this.monthRange(month);
    const [yearNum, monthNum] = month.split('-').map(Number);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

    // Current date in Vietnam timezone
    const nowVn = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

    const [assignments, logs, lockStatus, leaveApps] = await Promise.all([
      this.prisma.client.shiftAssignment.findMany({
        where: {
          employeeId,
          date: { gte: startDate, lt: endDate },
          status: 'APPROVED',
        },
        include: { shift: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.client.attendanceLog.findMany({
        where: {
          employeeId,
          date: { gte: startDate, lt: endDate },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.client.timesheetLock.findUnique({ where: { month } }),
      this.prisma.client.application.findMany({
        where: {
          employeeId,
          status: 'APPROVED',
        },
      }),
    ]);

    const hasData = assignments.length > 0 || logs.length > 0;

    let totalWorkday = 0;
    let totalHours = 0;
    let standardWorkdays = 0;
    let standardHours = 0;
    let unexcusedLeaveCount = 0;
    let excusedLeaveCount = 0;
    let totalLateMinutes = 0;

    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    const daysList = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayStr = String(day).padStart(2, '0');
      const dateIso = `${month}-${dayStr}`;
      const dateObj = new Date(`${dateIso}T00:00:00Z`);
      const dayOfWeek = dateObj.getUTCDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // Group all shifts assigned to this employee on this day (supports multiple shifts per day)
      const dayAssignments = assignments.filter((a) => a.date.toISOString().slice(0, 10) === dateIso);
      const log = logs.find((l) => l.date.toISOString().slice(0, 10) === dateIso);

      // Check if employee has an approved application on this day
      const dayLeaveApp = leaveApps.find((app) => {
        const payload: any = app.payload || {};
        const fromDate = payload.fromDate || payload.startDate || app.createdAt.toISOString().slice(0, 10);
        const toDate = payload.toDate || payload.endDate || fromDate;
        return dateIso >= fromDate && dateIso <= toDate;
      });

      const dayShifts = dayAssignments.map((a) => {
        const s = a.shift;
        const hours = s?.standardHours || this.calcShiftHours(s?.startTime, s?.endTime);
        return {
          assignmentId: a.id,
          shiftId: a.shiftId,
          code: s?.code || '',
          name: s?.name || '',
          startTime: s?.startTime || '',
          endTime: s?.endTime || '',
          hours,
          status: a.status,
        };
      });

      // Sum standard workdays & hours for this day
      const dayStandardWorkdays = dayShifts.length;
      const dayStandardHours = dayShifts.reduce((acc, s) => acc + s.hours, 0);
      standardWorkdays += dayStandardWorkdays;
      standardHours += dayStandardHours;

      const primaryDayShift = dayAssignments[0]?.shift || null;
      const dayMetrics = this.calculateAttendanceMetrics(primaryDayShift, log);

      let workDay = dayMetrics.workday;
      let checkInStr = '--';
      let checkOutStr = '--';
      let checkInFull = log?.checkIn ? new Date(log.checkIn).toISOString() : null;
      let checkOutFull = log?.checkOut ? new Date(log.checkOut).toISOString() : null;
      let checkInLocation = log?.checkInLocation || null;
      let checkOutLocation = log?.checkOutLocation || null;
      let lateMinutes = dayMetrics.lateMinutes;
      let earlyMinutes = dayMetrics.earlyMinutes;

      if (log?.checkIn) {
        checkInStr = new Date(log.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }

      if (log?.checkOut) {
        checkOutStr = new Date(log.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      }

      // If approved leave application exists on this day
      let leaveCode: string | null = null;
      if (dayLeaveApp) {
        const t = (dayLeaveApp.type || '').toLowerCase();
        if (t.includes('phép') || t.includes('leave')) {
          leaveCode = '1P';
          if (workDay === 0) workDay = 1.0;
          excusedLeaveCount += 1;
        } else if (t.includes('kết hôn')) {
          leaveCode = '1KH';
          if (workDay === 0) workDay = 1.0;
          excusedLeaveCount += 1;
        } else if (t.includes('không lương')) {
          leaveCode = '0Ro';
          excusedLeaveCount += 1;
        } else {
          leaveCode = '1P';
          if (workDay === 0) workDay = 1.0;
          excusedLeaveCount += 1;
        }
      }

      // Determine unexcused leave (Nghỉ không lý do)
      const isPast = dateIso < nowVn;
      const isToday = dateIso === nowVn;
      let isUnexcused = false;

      if (isPast && dayShifts.length > 0 && workDay === 0 && !dayLeaveApp) {
        isUnexcused = true;
        unexcusedLeaveCount += 1;
      }

      totalWorkday += workDay;
      totalHours += workDay * (dayStandardHours > 0 ? dayStandardHours / (dayStandardWorkdays || 1) : 8);
      totalLateMinutes += lateMinutes;

      let displayStatus = 'EMPTY';
      if (isUnexcused) displayStatus = 'UNEXCUSED';
      else if (dayLeaveApp) displayStatus = 'LEAVE';
      else if (workDay >= 1) displayStatus = 'VALID';
      else if (workDay > 0) displayStatus = 'HALF';
      else if (dayShifts.length > 0) displayStatus = 'ASSIGNED';
      else if (isWeekend) displayStatus = 'OFF';

      return {
        day,
        date: dateIso,
        dayName: dayNames[dayOfWeek],
        isWeekend,
        isToday,
        isPast,
        shifts: dayShifts,
        primaryShift: dayShifts[0] || null,
        shiftName: dayShifts.map((s) => s.name).join(', ') || (isWeekend ? 'Nghỉ' : 'Không phân ca'),
        checkIn: checkInStr,
        checkOut: checkOutStr,
        checkInFull,
        checkOutFull,
        checkInLocation,
        checkOutLocation,
        lateMinutes,
        earlyMinutes,
        workDay,
        leaveCode,
        isUnexcused,
        standardWorkdays: dayStandardWorkdays,
        standardHours: dayStandardHours,
        status: displayStatus,
        dayLeaveApp: dayLeaveApp
          ? { id: dayLeaveApp.id, type: dayLeaveApp.type, reason: dayLeaveApp.reason }
          : null,
      };
    });

    const leaveDaysRemaining = Math.max(0, 12 - excusedLeaveCount);

    return {
      month,
      hasData,
      isLocked: !!lockStatus,
      daysList,
      summary: {
        totalWorkday: Math.round(totalWorkday * 10) / 10,
        totalHours: Math.round(totalHours * 10) / 10,
        totalEffectiveHours: Math.round(totalHours * 10) / 10,
        standardWorkdays,
        standardHours: Math.round(standardHours * 10) / 10,
        unexcusedLeaveCount,
        excusedLeaveCount,
        totalLateMinutes,
        leaveDaysRemaining,
      },
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private monthRange(month: string) {
    const startDate = new Date(`${month}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    return { startDate, endDate };
  }

  /**
   * Expand a date range into individual dates based on repeat type.
   * WEEKLY: Only include specified weekdays (default Mon-Fri)
   * RANGE: Include ALL days in the range
   */
  private expandDates(
    startStr: string,
    endStr: string,
    repeatType: 'WEEKLY' | 'RANGE',
    weekdays: number[],
  ): string[] {
    const dates: string[] = [];
    const start = new Date(startStr + 'T00:00:00Z');
    const end = new Date(endStr + 'T00:00:00Z');

    const current = new Date(start);
    while (current <= end) {
      const dow = current.getUTCDay();
      if (repeatType === 'WEEKLY') {
        // Only include specified weekdays
        if (weekdays.includes(dow)) {
          dates.push(current.toISOString().slice(0, 10));
        }
      } else {
        // RANGE: include all days
        dates.push(current.toISOString().slice(0, 10));
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }
}
