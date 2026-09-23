import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, ApplicationStatus } from '../../generated/prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { status?: string; type?: string; employeeId?: string }) {
    const where: Prisma.ApplicationWhereInput = {};
    if (query.status && query.status !== 'ALL') {
      if (query.status === 'WAITING' || query.status === 'PENDING') {
        where.status = { in: ['WAITING', 'APPROVING'] };
      } else if (query.status === 'NO_APPROVED' || query.status === 'REJECTED') {
        where.status = { in: ['NO_APPROVED', 'CANCELED'] };
      } else {
        where.status = query.status as ApplicationStatus;
      }
    }
    if (query.type) where.type = query.type;
    if (query.employeeId) where.employeeId = query.employeeId;

    const items = await this.prisma.client.application.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
            manager: { select: { id: true, name: true } },
          },
        },
        approvals: {
          include: {
            approver: { select: { id: true, name: true, code: true } },
          },
          orderBy: { step: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: items, total: items.length };
  }

  async getDashboardCards(employeeId?: string, isAdmin: boolean = false) {
    // 1. Pending Actions (To-Do List)
    let pendingWhere: Prisma.ApplicationWhereInput = {
      status: { in: ['WAITING', 'APPROVING'] },
    };

    if (!isAdmin && employeeId) {
      pendingWhere = {
        status: { in: ['WAITING', 'APPROVING'] },
        OR: [
          {
            approvals: {
              some: {
                status: 'PENDING',
                approverId: employeeId,
              },
            },
          },
          {
            currentStep: 1,
            employee: {
              managerId: employeeId,
            },
          },
        ],
      };
    }

    const pendingApps = await this.prisma.client.application.findMany({
      where: pendingWhere,
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
            manager: { select: { id: true, name: true } },
          },
        },
        approvals: {
          include: {
            approver: { select: { id: true, name: true, code: true } },
          },
          orderBy: { step: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    const toDoList = pendingApps.map((app) => ({
      id: app.id,
      code: app.id.slice(0, 8).toUpperCase(),
      type: app.type,
      reason:
        app.reason ||
        (app.payload as any)?.reason ||
        (app.payload as any)?.note ||
        app.description ||
        app.type,
      applicant: {
        id: app.employee.id,
        name: app.employee.name,
        code: app.employee.code,
        department: app.employee.department?.name || 'Văn phòng',
        position: app.employee.position?.name || '',
      },
      createdAt: app.createdAt.toISOString(),
      currentStep: app.currentStep,
      totalSteps: app.approvals.length || 1,
      status: app.status,
      payload: app.payload,
    }));

    // 2. My Requests
    const myWhere: Prisma.ApplicationWhereInput = {};
    if (employeeId) {
      myWhere.employeeId = employeeId;
    }

    const userApps = await this.prisma.client.application.findMany({
      where: myWhere,
      include: {
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            manager: { select: { id: true, name: true } },
          },
        },
        approvals: {
          include: {
            approver: { select: { id: true, name: true, code: true } },
          },
          orderBy: { step: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const myRequests = userApps.map((app) => {
      let currentApproverName = 'Quản lý trực tiếp';
      if (app.status === 'APPROVED') {
        currentApproverName = 'Đã duyệt hoàn tất';
      } else if (app.status === 'NO_APPROVED') {
        currentApproverName = 'Đã bị từ chối';
      } else if (app.status === 'CANCELED') {
        currentApproverName = 'Đã hủy';
      } else {
        const currentApproval = app.approvals.find(
          (a) => a.step === app.currentStep && a.status === 'PENDING',
        );
        if (currentApproval?.approver?.name) {
          currentApproverName = currentApproval.approver.name;
        } else if (app.currentStep === 1 && app.employee?.manager?.name) {
          currentApproverName = `${app.employee.manager.name} (Quản lý trực tiếp)`;
        } else if (app.currentStep >= 2) {
          currentApproverName = 'Phòng Nhân sự / Ban Giám Đốc';
        } else {
          currentApproverName = 'Quản lý trực tiếp';
        }
      }

      return {
        id: app.id,
        code: app.id.slice(0, 8).toUpperCase(),
        type: app.type,
        reason:
          app.reason ||
          (app.payload as any)?.reason ||
          (app.payload as any)?.note ||
          app.description ||
          app.type,
        createdAt: app.createdAt.toISOString(),
        status: app.status,
        currentStep: app.currentStep,
        currentApproverName,
        payload: app.payload,
      };
    });

    // 3. Delegated / Followed tasks (Việc bạn giao, theo dõi)
    let delegatedWhere: Prisma.ApplicationWhereInput = {};
    if (employeeId) {
      delegatedWhere = {
        OR: [
          { employee: { managerId: employeeId } },
          { approvals: { some: { approverId: employeeId } } },
        ],
      };
    }
    const delegatedApps = employeeId
      ? await this.prisma.client.application.findMany({
          where: delegatedWhere,
          include: {
            employee: {
              select: {
                id: true,
                code: true,
                name: true,
                department: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })
      : [];

    const delegated = delegatedApps.map((app) => ({
      id: app.id,
      code: app.id.slice(0, 8).toUpperCase(),
      type: app.type,
      reason:
        app.reason ||
        (app.payload as any)?.reason ||
        (app.payload as any)?.note ||
        app.description ||
        app.type,
      applicant: {
        id: app.employee.id,
        name: app.employee.name,
        code: app.employee.code,
        department: app.employee.department?.name || 'Văn phòng',
      },
      createdAt: app.createdAt.toISOString(),
      status: app.status,
    }));

    return {
      toDoList,
      myRequests,
      delegated,
      summary: {
        toDoCount: toDoList.length,
        myRequestsCount: myRequests.length,
        delegatedCount: delegated.length,
      },
    };
  }

  async getStats(employeeId?: string) {
    const where: Prisma.ApplicationWhereInput = {};
    if (employeeId) where.employeeId = employeeId;

    const total = await this.prisma.client.application.count({ where });
    const pending = await this.prisma.client.application.count({
      where: { ...where, status: { in: ['WAITING', 'APPROVING'] } },
    });
    const approved = await this.prisma.client.application.count({
      where: { ...where, status: 'APPROVED' },
    });
    const rejected = await this.prisma.client.application.count({
      where: { ...where, status: { in: ['NO_APPROVED', 'CANCELED'] } },
    });

    const pendingItems = await this.prisma.client.application.findMany({
      where: { ...where, status: { in: ['WAITING', 'APPROVING'] } },
      include: { employee: { select: { id: true, code: true, name: true } } },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      total,
      pending,
      approved,
      rejected,
      pendingItems,
    };
  }

  async create(data: { employeeId: string; type: string; reason?: string; description?: string; payload: any }) {
    const employee = await this.prisma.client.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    // 1Office Approval Workflow Rules:
    // 2-Level types: Nghỉ phép dài hạn, OT/Tăng ca
    // 1-Level types: Đơn checkin/out bổ sung công, Đổi ca
    const isTwoLevel = ['approval-leave', 'Đơn xin nghỉ phép', 'approval-ot', 'Đơn làm thêm giờ', 'approval-overtime'].includes(data.type);

    const app = await this.prisma.client.application.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        reason: data.reason,
        description: data.description,
        payload: data.payload,
        status: 'WAITING',
        currentStep: 1,
      },
    });

    // Step 1: Direct Manager / Store Leader
    await this.prisma.client.applicationApproval.create({
      data: {
        applicationId: app.id,
        step: 1,
        approverId: employee.managerId,
        status: 'PENDING',
        comment: 'Cấp 1: Quản lý trực tiếp kiểm tra',
      },
    });

    // Step 2: HR / Admin Decision (For 2-Level Applications)
    if (isTwoLevel) {
      await this.prisma.client.applicationApproval.create({
        data: {
          applicationId: app.id,
          step: 2,
          approverId: null, // HR / Admin shared pool
          status: 'PENDING',
          comment: 'Cấp 2: HR / Ban Giám Đốc chốt công',
        },
      });
    }

    // Notify all admin users about the new application
    try {
      const admins = await this.prisma.client.user.findMany({
        where: { roles: { some: { role: { name: { in: ['ADMIN', 'HR'] } } } } },
        select: { id: true },
      });
      if (admins.length > 0) {
        await this.prisma.client.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            title: `Đơn mới: ${data.type} (${isTwoLevel ? '2 Cấp' : '1 Cấp'})`,
            content: `${employee.name} vừa gửi ${data.type}. Vui lòng xem xét và duyệt.`,
            link: `/hrm/applications/${app.id}`,
            isRead: false,
          })),
        });
      }
    } catch (_) {
      // Notification failure should not block application creation
    }

    return this.findOne(app.id);
  }

  async findOne(id: string) {
    const app = await this.prisma.client.application.findUnique({
      where: { id },
      include: {
        employee: { select: { id: true, code: true, name: true, managerId: true, department: true, position: true } },
        approvals: { include: { approver: { select: { name: true } } }, orderBy: { step: 'asc' } },
      },
    });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async updateStatus(id: string, status: string, approverId: string, comment?: string, isBypass: boolean = false) {
    const app = await this.findOne(id);
    const totalSteps = app.approvals.length || 1;

    // 1. Authorization check: verify approver is designated for the current step or is manager / bypass
    if (!isBypass) {
      const currentApproval = app.approvals.find((a) => a.step === app.currentStep);
      if (currentApproval && currentApproval.approverId) {
        const isDesignatedApprover = currentApproval.approverId === approverId;
        const isManager = app.employee?.managerId === approverId;
        if (!isDesignatedApprover && !isManager) {
          throw new ForbiddenException('Bạn không có quyền phê duyệt hoặc từ chối đơn này ở bước hiện tại.');
        }
      }
    }

    let finalStatus: ApplicationStatus = 'APPROVED';
    let nextStep = app.currentStep;

    if (status === 'REJECTED') {
      finalStatus = 'NO_APPROVED';
      await this.prisma.client.applicationApproval.updateMany({
        where: { applicationId: id, step: app.currentStep },
        data: { status: 'REJECTED', comment: comment || 'Đơn bị từ chối' },
      });
    } else if (isBypass) {
      // 1Office Admin Bypass (Duyệt vượt cấp): Jump straight to APPROVED
      finalStatus = 'APPROVED';
      nextStep = totalSteps;
      await this.prisma.client.applicationApproval.updateMany({
        where: { applicationId: id },
        data: { status: 'APPROVED', comment: comment ? `[Duyệt vượt cấp] ${comment}` : '[Duyệt vượt cấp bởi Admin/HR]' },
      });
    } else {
      // Step-by-step approval
      if (app.currentStep < totalSteps) {
        // Step 1 approved -> Move to step 2 (status APPROVING)
        finalStatus = 'APPROVING';
        nextStep = app.currentStep + 1;
        await this.prisma.client.applicationApproval.updateMany({
          where: { applicationId: id, step: app.currentStep },
          data: { status: 'APPROVED', comment: comment || 'Đã duyệt Cấp 1' },
        });
      } else {
        // Final step approved -> Status APPROVED
        finalStatus = 'APPROVED';
        await this.prisma.client.applicationApproval.updateMany({
          where: { applicationId: id, step: app.currentStep },
          data: { status: 'APPROVED', comment: comment || 'Đã duyệt chốt' },
        });
      }
    }

    const updated = await this.prisma.client.application.update({
      where: { id },
      data: { status: finalStatus, currentStep: nextStep },
    });

    // 1Office Waterfall Priority Deduction for Furlough:
    // Priority: 1. Accumulation (Old Year) -> 2. Annual Leave (Current Year) -> 3. Seniority
    if (status === 'APPROVED' && (app.type === 'approval-leave' || app.type === 'Đơn xin nghỉ phép')) {
      const daysToDeduct = (app.payload as any)?.days ?? 1.0;
      try {
        const furlough = await this.prisma.client.furloughBalance.findFirst({
          where: { employeeId: app.employeeId, year: 2026 },
        });
        if (furlough) {
          let remainToDeduct = daysToDeduct;
          let accum = furlough.accumulationOpen;
          let yearUsed = furlough.yearUsed;

          // 1. Deduct Accumulation
          if (accum > 0) {
            const sub = Math.min(accum, remainToDeduct);
            accum -= sub;
            remainToDeduct -= sub;
          }
          // 2. Deduct Annual Leave
          if (remainToDeduct > 0) {
            yearUsed += remainToDeduct;
            remainToDeduct = 0;
          }

          await this.prisma.client.furloughBalance.update({
            where: { id: furlough.id },
            data: {
              accumulationOpen: accum,
              yearUsed: yearUsed,
            },
          });
        }
      } catch (_) {}
    }

    // 1Office Auto OT Meal Trigger when OT Application is APPROVED
    if (status === 'APPROVED' && (app.type === 'approval-ot' || app.type === 'Đơn làm thêm giờ')) {
      try {
        const dateStr = (app.payload as any)?.date || new Date().toISOString().slice(0, 10);
        const appDate = new Date(dateStr);

        await this.prisma.client.attendanceMeal.upsert({
          where: { employeeId_date: { employeeId: app.employeeId, date: appDate } },
          create: { employeeId: app.employeeId, date: appDate, caCount: 1, otCount: 1 },
          update: { otCount: { increment: 1 } },
        });
      } catch (_) {}
    }

    // Notify the employee about the decision
    try {
      const emp = await this.prisma.client.employee.findUnique({
        where: { id: app.employeeId },
        include: { user: true },
      });
      if (emp?.user) {
        const label = status === 'APPROVED' ? 'được duyệt' : 'bị từ chối';
        await this.prisma.client.notification.create({
          data: {
            userId: emp.user.id,
            title: `Đơn ${label}: ${app.type}`,
            content: `Đơn ${app.type} của bạn đã ${label}.${comment ? ' Ghi chú: ' + comment : ''}`,
            link: `/hrm/applications/${id}`,
            isRead: false,
          },
        });
      }
    } catch (_) {}

    return updated;
  }

  async revertStatus(id: string) {
    const updated = await this.prisma.client.application.update({
      where: { id },
      data: { status: 'WAITING', currentStep: 1 },
    });
    await this.prisma.client.applicationApproval.updateMany({
      where: { applicationId: id },
      data: { status: 'PENDING' },
    });
    return updated;
  }

  async remove(id: string) {
    await this.prisma.client.applicationApproval.deleteMany({ where: { applicationId: id } });
    return this.prisma.client.application.delete({ where: { id } });
  }
}

