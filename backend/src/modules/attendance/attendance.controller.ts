import { Controller, Get, Post, Put, Delete, Query, Body, Param } from '@nestjs/common';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('stats')
  async getStats() {
    return this.attendanceService.getStats();
  }

  // ── Shift CRUD (Bước A: Tạo Ca mẫu) ──────────────────────────────────────

  @Get('shifts')
  async getShifts() {
    return this.attendanceService.getShifts();
  }

  @Post('shifts')
  async createShift(
    @Body() body: {
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
    },
  ) {
    return this.attendanceService.createShift(body);
  }

  @Put('shifts/:id')
  async updateShift(
    @Param('id') id: string,
    @Body() body: {
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
    },
  ) {
    return this.attendanceService.updateShift(id, body);
  }

  @Delete('shifts/:id')
  async deleteShift(@Param('id') id: string) {
    return this.attendanceService.deleteShift(id);
  }

  // ── Shift Assignment (Bước B: Phân ca cho Nhân viên) ──────────────────────

  @Get('shift-assignments')
  async getShiftAssignments(@Query('month') month: string) {
    return this.attendanceService.getShiftAssignments(month ?? this.currentMonth());
  }

  @Get('employees')
  async getEmployees() {
    return this.attendanceService.getEmployees();
  }

  @Get('catalogs')
  async getCatalogs() {
    return this.attendanceService.getCatalogs();
  }

  @Post('assign-shifts')
  async assignShifts(
    @Body() body: {
      type: 'GROUP' | 'PERSON';
      shiftId: string;
      departmentId?: string;
      departmentIds?: string[];
      positionIds?: string[];
      jobTitleIds?: string[];
      employeeIds?: string[];
      repeatType: 'WEEKLY' | 'RANGE';
      dateStart: string;
      dateEnd: string;
      weekdays?: number[];
    },
  ) {
    return this.attendanceService.assignShifts(body);
  }

  @Post('shift-assignments/bulk')
  async bulkSaveShiftAssignments(
    @Body()
    body: {
      assignments: {
        employeeId: string;
        shiftId: string;
        date: string;
        title?: string;
        repeatType?: string;
        status?: string;
      }[];
    },
  ) {
    return this.attendanceService.bulkSaveShiftAssignments(body.assignments);
  }

  @Post('shift-assignments/approve')
  async approveShiftAssignments(@Body() body: { title?: string; ids?: string[] }) {
    return this.attendanceService.approveShiftAssignments(body);
  }

  @Post('shift-assignments/revert')
  async revertShiftAssignments(@Body() body: { title?: string; ids?: string[] }) {
    return this.attendanceService.revertShiftAssignments(body);
  }

  @Post('shift-assignments/delete')
  async deleteShiftAssignments(@Body() body: { ids: string[] }) {
    return this.attendanceService.deleteShiftAssignments(body.ids);
  }

  // ── Attendance Logs ───────────────────────────────────────────────────────

  @Get('logs')
  async getAttendanceLogs(@Query('month') month: string) {
    return this.attendanceService.getAttendanceLogs(month ?? this.currentMonth());
  }

  // ── Timesheet ─────────────────────────────────────────────────────────────

  @Get('timesheet')
  async getTimesheet(@Query('month') month: string) {
    return this.attendanceService.getTimesheet(month ?? this.currentMonth());
  }

  // ── Lock / Unlock Timesheet (Chốt công / Mở khóa) ────────────────────────

  @Post('lock-timesheet')
  async lockTimesheet(@Body() body: { month: string }) {
    return this.attendanceService.lockTimesheet(body.month ?? this.currentMonth());
  }

  @Post('unlock-timesheet')
  async unlockTimesheet(@Body() body: { month: string }) {
    return this.attendanceService.unlockTimesheet(body.month ?? this.currentMonth());
  }

  @Post('lock-applications')
  async lockApplications(@Body() body: { month: string }) {
    return this.attendanceService.lockApplications(body.month ?? this.currentMonth());
  }

  @Get('timesheet-lock-status')
  async getTimesheetLockStatus(@Query('month') month: string) {
    return this.attendanceService.getTimesheetLockStatus(month ?? this.currentMonth());
  }

  // ── Sub-functions ─────────────────────────────────────────────────────────

  @Get('meal')
  async getMealTimesheet(@Query('month') month: string) {
    return this.attendanceService.getMealTimesheet(month ?? this.currentMonth());
  }

  @Get('auto-rules')
  async getAutoRules() {
    return this.attendanceService.getAutoRules();
  }

  @Get('shift-registers')
  async getShiftRegisters() {
    return this.attendanceService.getShiftRegisters();
  }

  @Get('devices')
  async getDevices() {
    return this.attendanceService.getDevices();
  }

  @Get('raw-logs')
  async getRawLogs() {
    return this.attendanceService.getRawLogs();
  }

  @Get('furlough')
  async getFurloughSummary() {
    return this.attendanceService.getFurloughSummary();
  }

  @Get('holidays')
  async getHolidays() {
    return this.attendanceService.getHolidays();
  }

  @Post('import-raw-logs')
  async importRawCheckLogs(
    @Body() body: { records: Array<{ personnelCode: string; timestamp: string; location?: string; type?: string }> },
  ) {
    return this.attendanceService.importRawCheckLogs(body.records || []);
  }

  @Get('my-month')
  async getMyMonth(
    @Query('employeeId') employeeId: string,
    @Query('month') month?: string,
  ) {
    return this.attendanceService.getMyMonthAttendance(employeeId, month ?? this.currentMonth());
  }

  @Get('my-today')
  async getMyToday(@Query('employeeId') employeeId?: string) {
    return this.attendanceService.getMyToday(employeeId);
  }

  @Post('checkin')
  async mobileCheckIn(
    @Body() body: { employeeId: string; type: 'CHECK_IN' | 'CHECK_OUT'; date?: string; location?: string; verifyMode?: string },
  ) {
    return this.attendanceService.mobileCheckIn(body);
  }

  @Post('import-matrix')
  async importTimesheetMatrix(
    @Query('month') month: string,
    @Body() body: { records: Array<{ personnelCode: string; fullname?: string; totalWorkday?: number; totalOT?: number; totalLateMinute?: number }> },
  ) {
    return this.attendanceService.importTimesheetMatrix(month ?? this.currentMonth(), body.records || []);
  }

  private currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}
