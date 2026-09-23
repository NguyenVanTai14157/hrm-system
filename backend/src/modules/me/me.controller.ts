import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthRequest } from '../auth/auth.types';
import { publicUser } from '../auth/auth.types';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceService } from '../attendance/attendance.service';
import { PayrollService } from '../payroll/payroll.service';
import { ApplicationsService } from '../applications/applications.service';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('Personal Me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly attendanceService: AttendanceService,
    private readonly payrollService: PayrollService,
    private readonly applicationsService: ApplicationsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('home')
  async getHome(@Req() req: AuthRequest, @Query('date') date?: string) {
    const user = req.auth.user;
    const employeeId = user.employeeId;

    const [cards, todayAttendance, employee] = await Promise.all([
      this.applicationsService.getDashboardCards(employeeId ?? undefined, false),
      this.attendanceService.getMyToday(employeeId ?? undefined, date),
      employeeId ? this.employeesService.detail(employeeId).catch(() => null) : null,
    ]);

    return {
      linked: Boolean(employeeId && employee),
      user: publicUser(user),
      employee,
      toDoList: cards.toDoList || [],
      myRequests: cards.myRequests || [],
      delegated: cards.delegated || [],
      todayAttendance,
    };
  }

  @Get('profile')
  async getMyProfile(@Req() req: AuthRequest) {
    const user = req.auth.user;
    const employeeId = user.employeeId;

    if (!employeeId) {
      return {
        linked: false,
        employee: null,
        user: publicUser(user),
      };
    }

    try {
      const employee = await this.employeesService.detail(employeeId);
      return {
        linked: true,
        employee,
        user: publicUser(user),
      };
    } catch {
      return {
        linked: false,
        employee: null,
        user: publicUser(user),
      };
    }
  }

  @Get('attendance')
  async getMyAttendance(
    @Req() req: AuthRequest,
    @Query('month') month?: string,
    @Query('date') date?: string,
  ) {
    const user = req.auth.user;
    const employeeId = user.employeeId;
    const m = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    if (!employeeId) {
      return {
        linked: false,
        month: m,
        monthAttendance: [],
        today: null,
      };
    }

    const [monthAttendance, today] = await Promise.all([
      this.attendanceService.getMyMonthAttendance(employeeId, m),
      this.attendanceService.getMyToday(employeeId, date),
    ]);

    return {
      linked: true,
      month: m,
      monthAttendance,
      today,
    };
  }

  @Get('attendance/gps-locations')
  async getMyGpsLocations(@Req() req: AuthRequest) {
    const employeeId = req.auth.user.employeeId;
    if (!employeeId) return [];
    return this.attendanceService.getAssignedGpsLocations(employeeId);
  }

  @Post('attendance/checkin')
  async mobileCheckIn(
    @Req() req: AuthRequest,
    @Body()
    body: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      type?: 'CHECK_IN' | 'CHECK_OUT' | 'AUTO';
    },
  ) {
    const employeeId = req.auth.user.employeeId;
    if (!employeeId) {
      throw new ForbiddenException('Tài khoản chưa được liên kết với hồ sơ nhân sự.');
    }
    return this.attendanceService.mobileCheckIn({
      employeeId,
      latitude: body.latitude,
      longitude: body.longitude,
      accuracy: body.accuracy,
      type: body.type,
    });
  }

  @Get('payroll')
  async getMyPayroll(
    @Req() req: AuthRequest,
    @Query('year') year?: string,
  ) {
    const user = req.auth.user;
    const employeeId = user.employeeId;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();

    if (!employeeId) {
      return {
        linked: false,
        year: y,
        payrolls: [],
      };
    }

    // In 1Office rule: Only APPROVED / PUBLISHED payrolls are visible to employees
    const allPayrolls = await this.payrollService.getMyPayroll(employeeId, y);
    const publishedPayrolls = allPayrolls.filter(
      (p: any) => p.status === 'APPROVED' || p.status === 'PUBLISHED',
    );

    return {
      linked: true,
      year: y,
      payrolls: publishedPayrolls,
    };
  }

  // ── 1OFFICE PHÂN HỆ ĐƠN TỪ & LUỒNG DUYỆT ──
  @Get('requests')
  async getMyRequests(@Req() req: AuthRequest, @Query('type') type?: string) {
    const user = req.auth.user;
    const employeeId = user.employeeId;

    const cards = await this.applicationsService.getDashboardCards(employeeId ?? undefined, false);
    const stats = await this.applicationsService.getStats(employeeId ?? undefined);

    let myRequests = cards.myRequests || [];
    if (type && type !== 'ALL') {
      myRequests = myRequests.filter((r) => r.type === type);
    }

    return {
      myRequests,
      toDoList: cards.toDoList || [],
      delegated: cards.delegated || [],
      stats,
    };
  }

  @Post('requests')
  async createRequest(
    @Req() req: AuthRequest,
    @Body()
    body: {
      type: string;
      reason?: string;
      description?: string;
      payload?: any;
    },
  ) {
    const user = req.auth.user;
    if (!user.employeeId) {
      throw new Error('Tài khoản chưa được liên kết hồ sơ nhân viên.');
    }

    return this.applicationsService.create({
      employeeId: user.employeeId,
      type: body.type,
      reason: body.reason,
      description: body.description,
      payload: body.payload || {},
    });
  }

  @Post('requests/:id/approve')
  async approveRequest(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ) {
    const user = req.auth.user;
    const isBypass = user.roles?.some((r: any) => r.role?.name === 'ADMIN' || r.role?.code === 'ADMIN') || false;
    return this.applicationsService.updateStatus(id, 'APPROVED', user.employeeId || user.id, body.comment, isBypass);
  }

  @Post('requests/:id/reject')
  async rejectRequest(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { comment?: string },
  ) {
    const user = req.auth.user;
    const isBypass = user.roles?.some((r: any) => r.role?.name === 'ADMIN' || r.role?.code === 'ADMIN') || false;
    return this.applicationsService.updateStatus(id, 'REJECTED', user.employeeId || user.id, body.comment, isBypass);
  }

  // ── 1OFFICE PHÂN HỆ MẠNG NỘI BỘ (NEWSFEED, ANNOUNCEMENT, BIRTHDAY, AWARDS) ──
  @Get('social')
  async getSocialFeed(@Req() req: AuthRequest) {
    const currentMonth = new Date().getMonth() + 1;

    // Fetch real employees whose birthday is in this month
    const employees = await this.prisma.client.employee.findMany({
      where: { status: 'WORKING', birthday: { not: null } },
      select: { id: true, name: true, code: true, birthday: true, department: { select: { name: true } } },
      take: 20,
    });

    const monthBirthdays = employees
      .filter((e) => e.birthday && new Date(e.birthday).getMonth() + 1 === currentMonth)
      .map((e) => ({
        id: e.id,
        name: e.name,
        code: e.code,
        department: e.department?.name || 'Văn phòng',
        day: e.birthday ? new Date(e.birthday).getDate() : 1,
        dateStr: e.birthday ? new Date(e.birthday).toLocaleDateString('vi-VN') : '',
      }));

    const announcements = [
      {
        id: 'ann-1',
        title: '📢 Thông báo lịch nghỉ lễ Quốc khánh và Chế độ thưởng',
        author: 'Ban Giám Đốc & Phòng Nhân sự',
        createdAt: '2026-09-01T08:00:00.000Z',
        content: 'Công ty trân trọng thông báo lịch nghỉ lễ và các quy định trực nhật ca làm việc dịp lễ.',
        pinned: true,
      },
      {
        id: 'ann-2',
        title: '🌟 Vinh danh nhân viên xuất sắc tháng 8/2026',
        author: 'Hội đồng Khen thưởng',
        createdAt: '2026-09-05T09:30:00.000Z',
        content: 'Chúc mừng các cá nhân và tập thể đã hoàn thành vượt mức chỉ tiêu KPI trong tháng vừa qua!',
        pinned: false,
      },
    ];

    const posts = [
      {
        id: 'post-1',
        authorName: 'Nguyễn Văn Quản Lý',
        authorRole: 'Trưởng phòng Marketing',
        timeAgo: '2 giờ trước',
        content: 'Chúc mừng team Marketing đã hoàn thành xuất sắc chiến dịch quý 3! Cảm ơn sự nỗ lực hết mình của mọi người 🚀🎉',
        likesCount: 14,
        commentsCount: 5,
        isLiked: false,
      },
      {
        id: 'post-2',
        authorName: 'Đỗ Ngọc Trang',
        authorRole: 'Phòng Hành chính - Nhân sự',
        timeAgo: '5 giờ trước',
        content: 'Mọi người đừng quên hoàn tất đăng ký ca và gửi các đề xuất chấm công trước ngày 25 hàng tháng nhé! ❤️',
        likesCount: 22,
        commentsCount: 8,
        isLiked: true,
      },
    ];

    return {
      announcements,
      posts,
      monthBirthdays,
      kudos: [
        { name: 'Nguyễn Văn Tài', title: 'Ngôi sao cống hiến tháng 8', badge: '🥇 Xuất sắc' },
        { name: 'Lê Thị Thanh', title: 'Nhân viên năng động & Chuyên cần', badge: '⭐ Chuyên cần' },
      ],
    };
  }

  // ── 1OFFICE PHÂN HỆ LỊCH BIỂU (CALENDAR & EVENTS) ──
  @Get('calendar')
  async getCalendar(@Req() req: AuthRequest, @Query('month') month?: string) {
    const user = req.auth.user;
    const employeeId = user.employeeId;
    const m = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Get shifts assigned to employee in this month
    let myShifts: any[] = [];
    if (employeeId) {
      const [yearStr, monthStr] = m.split('-');
      const startOfMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
      const endOfMonth = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10), 0);

      const assignments = await this.prisma.client.shiftAssignment.findMany({
        where: {
          employeeId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        include: { shift: true },
        orderBy: { date: 'asc' },
      });

      myShifts = assignments.map((a) => ({
        id: a.id,
        date: a.date.toISOString().slice(0, 10),
        shiftName: a.shift.name,
        startTime: a.shift.startTime,
        endTime: a.shift.endTime,
        color: a.shift.color,
      }));
    }

    const companyEvents = [
      { id: 'ev-1', title: 'Họp giao ban toàn công ty đầu tuần', time: 'Thứ 2 hàng tuần • 08:30 - 09:30', location: 'Phòng họp A & Zoom' },
      { id: 'ev-2', title: 'Đào tạo nội bộ: Quy trình HRM 1Office', time: '25/09/2026 • 15:00 - 17:00', location: 'Hội trường 1' },
    ];

    return {
      month: m,
      myShifts,
      companyEvents,
    };
  }

  // ── 1OFFICE PHÂN HỆ TÀI LIỆU (DOCUMENTS) ──
  @Get('documents')
  async getDocuments() {
    const folders = [
      {
        id: 'f-1',
        name: 'Nội quy & Chính sách công ty',
        filesCount: 4,
        files: [
          { id: 'doc-1', name: 'Nội quy lao động 2026.pdf', size: '2.4 MB', updatedAt: '01/01/2026' },
          { id: 'doc-2', name: 'Chính sách phúc lợi & khen thưởng.pdf', size: '1.1 MB', updatedAt: '15/02/2026' },
          { id: 'doc-3', name: 'Quy chế sử dụng tài sản & bảo mật thông tin.docx', size: '850 KB', updatedAt: '10/03/2026' },
        ],
      },
      {
        id: 'f-2',
        name: 'Biểu mẫu nhân sự chuẩn',
        filesCount: 6,
        files: [
          { id: 'doc-4', name: 'Biểu mẫu bàn giao công việc khi thôi việc.docx', size: '420 KB', updatedAt: '20/04/2026' },
          { id: 'doc-5', name: 'Giấy đề nghị thanh toán công tác phí.xlsx', size: '310 KB', updatedAt: '05/05/2026' },
          { id: 'doc-6', name: 'Phiếu đánh giá nhân viên thử việc.pdf', size: '590 KB', updatedAt: '12/06/2026' },
        ],
      },
      {
        id: 'f-3',
        name: 'Hướng dẫn sử dụng hệ thống',
        filesCount: 3,
        files: [
          { id: 'doc-7', name: 'Cẩm nang chấm công GPS & Gửi đơn từ Mobile.pdf', size: '3.8 MB', updatedAt: '01/08/2026' },
          { id: 'doc-8', name: 'Quy trình ký hợp đồng điện tử E-Contract.pdf', size: '1.6 MB', updatedAt: '15/08/2026' },
        ],
      },
    ];

    return { folders };
  }

  // ── 1OFFICE PHÂN HỆ KÝ SỐ (E-CONTRACT) ──
  @Get('contracts')
  async getContracts(@Req() req: AuthRequest) {
    const user = req.auth.user;
    const employee = user.employeeId ? await this.employeesService.detail(user.employeeId).catch(() => null) : null;

    const contracts = [
      {
        id: 'cnt-1',
        title: 'Hợp đồng lao động xác định thời hạn (2026 - 2028)',
        code: `HĐLĐ-${employee?.code || 'NV065'}-2026`,
        signerName: employee?.name || user.displayName,
        status: 'SIGNED',
        signedAt: '15/01/2026 10:30',
        signMethod: 'Ký số điện tử OTP',
        fileUrl: '#',
      },
      {
        id: 'cnt-2',
        title: 'Phụ lục hợp đồng điều chỉnh mức lương vị trí 2026',
        code: `PLHĐ-${employee?.code || 'NV065'}-0926`,
        signerName: employee?.name || user.displayName,
        status: 'PENDING_SIGN',
        signedAt: null,
        signMethod: 'Chờ nhân viên xác thực ký OTP',
        fileUrl: '#',
      },
    ];

    return { contracts };
  }

  @Post('contracts/:id/sign')
  async signContract(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { otp: string },
  ) {
    if (!body.otp || body.otp.length < 4) {
      throw new Error('Mã OTP xác thực không hợp lệ. Vui lòng nhập đủ 4-6 chữ số.');
    }
    return {
      success: true,
      contractId: id,
      signedAt: new Date().toISOString(),
      message: '✅ Ký số điện tử thành công bằng mã OTP!',
    };
  }
}

