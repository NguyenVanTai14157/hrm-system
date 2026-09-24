import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async findAll() {
    return this.prisma.client.user.findMany({
      include: {
        roles: { include: { role: true } },
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            phone: true,
            birthday: true,
            hometown: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
            jobTitle: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: { username: string; employeeId?: string; displayName?: string; password?: string; roleName?: string; sendEmail?: boolean }) {
    let employee: any = null;
    if (data.employeeId && data.employeeId.trim() !== '') {
      employee = await this.prisma.client.employee.findUnique({
        where: { id: data.employeeId },
      });
      if (!employee) throw new NotFoundException('Không tìm thấy nhân sự');
    }

    const passwordToHash = data.password && data.password.trim() !== '' ? data.password : '123456aA@';
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const orConditions: any[] = [{ username: data.username }];
    if (employee) {
      orConditions.push({ employeeId: employee.id });
    }

    const existingUser = await this.prisma.client.user.findFirst({
      where: { OR: orConditions }
    });

    let userId: string;

    if (existingUser) {
      const updated = await this.prisma.client.user.update({
        where: { id: existingUser.id },
        data: {
          username: data.username,
          displayName: data.displayName || employee?.name || data.username,
          employeeId: employee?.id ?? existingUser.employeeId,
          passwordHash,
          status: 'ACTIVE',
        }
      });
      userId = updated.id;
    } else {
      const created = await this.prisma.client.user.create({
        data: {
          username: data.username,
          displayName: data.displayName || employee?.name || data.username,
          passwordHash,
          employeeId: employee?.id ?? null,
          mustChangePassword: false,
          status: 'ACTIVE',
        },
      });
      userId = created.id;
    }

    const roleName = data.roleName || 'Nhân viên bán hàng - Nhân viên';
    let role = await this.prisma.client.role.findFirst({
      where: { name: roleName }
    });
    if (!role) {
      await this.prisma.client.permission.upsert({
        where: { code: 'admin.access' },
        update: {},
        create: { code: 'admin.access', description: 'Truy cập hệ thống HRM' }
      }).catch(() => {});

      role = await this.prisma.client.role.create({
        data: {
          name: roleName,
          permissions: {
            create: [{ permissionCode: 'admin.access' }]
          }
        }
      });
    } else {
      await this.prisma.client.permission.upsert({
        where: { code: 'admin.access' },
        update: {},
        create: { code: 'admin.access', description: 'Truy cập hệ thống HRM' }
      }).catch(() => {});

      await this.prisma.client.rolePermission.upsert({
        where: { roleId_permissionCode: { roleId: role.id, permissionCode: 'admin.access' } },
        update: {},
        create: { roleId: role.id, permissionCode: 'admin.access' }
      }).catch(() => {});
    }

    await this.prisma.client.userRole.deleteMany({
      where: { userId }
    });
    await this.prisma.client.userRole.create({
      data: {
        userId,
        roleId: role.id
      }
    });

    const targetEmail = employee?.email || `${data.username}@hadibeauty.vn`;
    if (data.sendEmail !== false) {
      await this.mailService.sendLoginCredentials({
        to: targetEmail,
        employeeName: employee?.name || data.displayName || data.username,
        username: data.username,
        password: data.password && data.password.trim() !== '' ? data.password : '123456aA@',
      }).catch(() => {});
    }

    const savedUser = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            phone: true,
            birthday: true,
            hometown: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
            jobTitle: { select: { name: true } },
          },
        },
      }
    });

    return {
      ...savedUser,
      generatedPass: data.password || '123456aA@',
      emailSentTo: targetEmail,
    };
  }

  async updateRole(id: string, roleName: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    let role = await this.prisma.client.role.findFirst({
      where: { name: roleName }
    });
    if (!role) {
      role = await this.prisma.client.role.create({
        data: { name: roleName }
      });
    }

    await this.prisma.client.userRole.deleteMany({
      where: { userId: id }
    });
    await this.prisma.client.userRole.create({
      data: {
        userId: id,
        roleId: role.id
      }
    });

    return this.prisma.client.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        employee: {
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            phone: true,
            birthday: true,
            hometown: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
            jobTitle: { select: { name: true } },
          },
        },
      }
    });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'LOCKED') {
    return this.prisma.client.user.update({
      where: { id },
      data: { status },
    });
  }

  async sendPassword(id: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      include: { employee: true }
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    // Auto generate random 8-char password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let randomPass = '';
    for (let i = 0; i < 8; i++) {
      randomPass += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const passwordHash = await bcrypt.hash(randomPass, 10);
    await this.prisma.client.user.update({
      where: { id },
      data: { passwordHash }
    });

    const email = user.employee?.email || `${user.username}@hadibeauty.vn`;

    await this.mailService.sendLoginCredentials({
      to: email,
      employeeName: user.employee?.name || user.displayName,
      username: user.username,
      password: randomPass,
      isPasswordReset: true,
    }).catch(() => {});

    return {
      message: `Hệ thống đã tự sinh mật khẩu mới và gửi email thông tin đăng nhập đến ${email}`,
      generatedPass: randomPass,
      emailSentTo: email,
    };
  }

  async changePassword(id: string, newPass: string) {
    const passwordHash = await bcrypt.hash(newPass, 10);
    return this.prisma.client.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: false },
    });
  }

  /**
   * Xóa tài khoản người dùng (không xóa hồ sơ nhân sự).
   * - Xóa session, notification, userRole liên quan.
   * - Giữ nguyên bản ghi employee (chỉ huỷ liên kết).
   * - Chặn xóa tài khoản 'admin' (username).
   */
  async remove(id: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    if (user.username === 'admin') {
      throw new ForbiddenException('Không thể xóa tài khoản quản trị hệ thống.');
    }

    // Xóa dữ liệu phụ thuộc - giữ nguyên hồ sơ nhân sự
    await this.prisma.client.userRole.deleteMany({ where: { userId: id } });
    await this.prisma.client.notification.deleteMany({ where: { userId: id } });
    await this.prisma.client.session.deleteMany({ where: { userId: id } });

    return this.prisma.client.user.delete({ where: { id } });
  }

  /**
   * Xóa hàng loạt tài khoản người dùng.
   * Trả về { succeeded: string[], failed: { id, username, reason }[] }
   */
  async bulkRemove(ids: string[]): Promise<{
    succeeded: string[];
    failed: { id: string; username: string; reason: string }[];
  }> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Danh sách ID không hợp lệ.');
    }

    const succeeded: string[] = [];
    const failed: { id: string; username: string; reason: string }[] = [];

    for (const id of ids) {
      try {
        const user = await this.prisma.client.user.findUnique({ where: { id } });
        if (!user) {
          failed.push({ id, username: id, reason: 'Tài khoản không tồn tại hoặc đã bị xóa.' });
          continue;
        }
        if (user.username === 'admin') {
          failed.push({ id, username: user.username, reason: 'Không thể xóa tài khoản quản trị hệ thống.' });
          continue;
        }
        await this.prisma.client.userRole.deleteMany({ where: { userId: id } });
        await this.prisma.client.notification.deleteMany({ where: { userId: id } });
        await this.prisma.client.session.deleteMany({ where: { userId: id } });
        await this.prisma.client.user.delete({ where: { id } });
        succeeded.push(id);
      } catch (err: any) {
        const user = await this.prisma.client.user.findUnique({ where: { id } }).catch(() => null);
        failed.push({
          id,
          username: user?.username || id,
          reason: err?.message || 'Lỗi không xác định.',
        });
      }
    }

    return { succeeded, failed };
  }

  async removeEmployeeAndUser(employeeId: string) {
    const emp = await this.prisma.client.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Không tìm thấy nhân sự');

    const user = await this.prisma.client.user.findUnique({ where: { employeeId } });
    if (user) {
      await this.remove(user.id);
    }

    await this.prisma.client.employeeIdentity.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeBank.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeWorkPermit.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeVisa.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeFamily.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeEducation.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeePartyHistory.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeExperience.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeCertificate.deleteMany({ where: { employeeId } });
    await this.prisma.client.employeeHistory.deleteMany({ where: { employeeId } });
    await this.prisma.client.furloughBalance.deleteMany({ where: { employeeId } });
    await this.prisma.client.attendanceMeal.deleteMany({ where: { employeeId } });
    await this.prisma.client.biometricRawLog.deleteMany({ where: { employeeId } });
    await this.prisma.client.shiftRegister.deleteMany({ where: { employeeId } });
    await this.prisma.client.autoTimekeepRule.deleteMany({ where: { employeeId } });
    await this.prisma.client.applicationApproval.deleteMany({ where: { application: { employeeId } } });
    await this.prisma.client.application.deleteMany({ where: { employeeId } });

    return this.prisma.client.employee.delete({ where: { id: employeeId } });
  }
}
