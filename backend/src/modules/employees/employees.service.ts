import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, CatalogKind, EmployeeStatus } from '../../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateEmployeeDto, UpdateEmployeeDto, EmployeeQuery, CatalogDto, UpdateCatalogDto } from './employees.dto';

const include = {
  department: true,
  position: true,
  jobTitle: true,
  manager: { select: { id: true, code: true, name: true, status: true } },
  user: { select: { id: true, status: true, username: true } },
  gpsLocations: {
    include: {
      gpsLocation: true,
    },
  },
  identities: true,
  banks: true,
  workPermits: true,
  visas: true,
  families: true,
  educations: true,
  partyHistories: true,
  experiences: true,
  certificates: true,
} as const;

type Row = Prisma.EmployeeGetPayload<{ include: typeof include }>;

function present(row: Row) {
  return {
    ...row,
    birthday: row.birthday?.toISOString().slice(0, 10) ?? null,
    joinDate: row.joinDate?.toISOString().slice(0, 10) ?? null,
    officialContractDate: row.officialContractDate?.toISOString().slice(0, 10) ?? null,
    gpsLocationIds: (row as any).gpsLocations?.map((l: any) => l.gpsLocationId || l.gpsLocation?.id).filter(Boolean) ?? [],
  };
}

function date(value: string | null | undefined, birthday = false) {
  if (!value || typeof value !== 'string' || !value.trim()) return null;
  const str = value.trim();
  const parsed = new Date(str.includes('T') ? str : str + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: EmployeeQuery) {
    const { page, pageSize, q, status, departmentId, positionId } = query;
    const where: Prisma.EmployeeWhereInput = {
      status,
      departmentId,
      positionId,
      ...(q?.trim() ? { OR: [{ code: { contains: q.trim() } }, { name: { contains: q.trim() } }] } : {}),
    };
    const { sortBy, sortDirection, groupBy } = query;
    const orderBy: Prisma.EmployeeOrderByWithRelationInput[] = [];
    if (groupBy) orderBy.push({ [groupBy]: 'asc' });
    if (sortBy) {
      orderBy.push(
        ['department', 'position', 'jobTitle', 'manager'].includes(sortBy)
          ? { [sortBy]: { name: sortDirection } }
          : { [sortBy]: sortDirection },
      );
    } else orderBy.push({ createdAt: 'desc' });
    orderBy.push({ id: 'asc' });

    return this.prisma.client.$transaction(
      async (tx) => {
        const rows = await tx.employee.findMany({ where, include, skip: (page - 1) * pageSize, take: pageSize, orderBy });
        const total = await tx.employee.count({ where });
        const groups = groupBy
          ? (await tx.employee.groupBy({ by: [groupBy], where, _count: { _all: true } })).map((group) => ({
              value: group[groupBy],
              count: group._count._all,
            }))
          : [];
        return { items: rows.map(present), total, page, pageSize, groups };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  async generateNextEmployeeCode(tx: Prisma.TransactionClient): Promise<string> {
    const employees = await tx.employee.findMany({
      select: { code: true },
    });
    const codeSet = new Set(employees.map((e) => e.code.trim().toUpperCase()));

    let maxNumber = -1;
    for (const { code } of employees) {
      const match = code.trim().match(/^NV(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    }

    // Nếu hệ thống hoàn toàn chưa có mã dạng NV + số, bắt đầu từ 0 (NV000)
    let candidateNumber = maxNumber === -1 ? 0 : maxNumber + 1;

    while (true) {
      const candidateCode = `NV${String(candidateNumber).padStart(3, '0')}`.toUpperCase();
      const candidateCode4 = candidateNumber < 1000 ? `NV${String(candidateNumber).padStart(4, '0')}`.toUpperCase() : candidateCode;

      if (!codeSet.has(candidateCode) && !codeSet.has(candidateCode4)) {
        return candidateCode;
      }
      candidateNumber++;
    }
  }

  async generateNextSyncCode(tx: Prisma.TransactionClient): Promise<string> {
    const employees = await tx.employee.findMany({
      where: { syncCode: { not: null } },
      select: { syncCode: true },
    });
    const syncCodeSet = new Set(
      employees
        .map((e) => (e.syncCode || '').trim())
        .filter(Boolean),
    );

    let candidate = 0;
    while (true) {
      const candidateStr = String(candidate);
      if (!syncCodeSet.has(candidateStr)) {
        return candidateStr;
      }
      candidate++;
    }
  }

  async getNextCode() {
    return this.prisma.client.$transaction(async (tx) => {
      const code = await this.generateNextEmployeeCode(tx);
      const syncCode = await this.generateNextSyncCode(tx);
      return { code, syncCode };
    });
  }

  async getGpsLocations() {
    return this.prisma.client.gpsLocation.findMany({
      orderBy: [{ code: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        radius: true,
        isActive: true,
      },
    });
  }

  async detail(id: string) {
    const row = await this.prisma.client.employee.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException('Không tìm thấy nhân sự.');
    return present(row);
  }

  async history(id: string, query: EmployeeQuery) {
    await this.detail(id);
    const where = { employeeId: id };
    const [items, total] = await this.prisma.client.$transaction([
      this.prisma.client.employeeHistory.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.client.employeeHistory.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async catalogs(kind?: 'DEPARTMENT' | 'POSITION' | 'JOB_TITLE', active?: string) {
    const where: Prisma.EmployeeCatalogWhereInput = {};
    if (kind) where.kind = kind;
    // active=true → chỉ bản ghi active, active=false → bản ghi inactive, không có → tất cả
    if (active === 'true') where.active = true;
    else if (active === 'false') where.active = false;
    return this.prisma.client.employeeCatalog.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ orderNumber: 'asc' }, { name: 'asc' }],
    });
  }

  async saveCatalog(data: CatalogDto | UpdateCatalogDto, id?: string) {
    if (id) {
      return this.prisma.client.employeeCatalog.update({
        where: { id },
        data: data as any,
      });
    }
    return this.prisma.client.employeeCatalog.create({
      data: data as any,
    });
  }

  async deleteCatalog(id: string) {
    const used = await this.prisma.client.employee.count({
      where: {
        OR: [
          { departmentId: id },
          { positionId: id },
          { jobTitleId: id },
        ],
      },
    });
    if (used > 0) {
      throw new BadRequestException(`Không thể xóa danh mục này vì đang được ${used} nhân sự sử dụng.`);
    }
    const children = await this.prisma.client.employeeCatalog.count({
      where: { parentId: id },
    });
    if (children > 0) {
      throw new BadRequestException(`Không thể xóa vì có ${children} phòng ban trực thuộc.`);
    }
    return this.prisma.client.employeeCatalog.delete({ where: { id } });
  }

  private async safe<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (e: any) {
      if (e instanceof BadRequestException || e instanceof ConflictException || e instanceof NotFoundException) {
        throw e;
      }
      console.error('Error saving employee:', e);
      if (e instanceof Prisma.PrismaClientKnownRequestError || e?.code) {
        if (e.code === 'P2002') throw new ConflictException('Mã nhân sự hoặc dữ liệu đã tồn tại trong hệ thống.');
        if (e.code === 'P2034') throw new ConflictException('Dữ liệu đang được sửa. Vui lòng tải lại và thử lại.');
        if (e.code === 'P2025') throw new NotFoundException('Không tìm thấy dữ liệu.');
      }
      throw new BadRequestException(e?.message || 'Lỗi khi xử lý dữ liệu nhân sự.');
    }
  }

  async save(input: CreateEmployeeDto | UpdateEmployeeDto, actor: { id: string; displayName: string }, id?: string) {
    const isCreate = !id;
    const maxRetries = isCreate ? 5 : 1;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.safe(() =>
          this.prisma.client.$transaction(
            async (tx) => {
              const previous = id ? await tx.employee.findUnique({ where: { id }, include }) : null;
              if (id && !previous) throw new NotFoundException('Không tìm thấy nhân sự.');
              if (previous && previous.version !== (input as UpdateEmployeeDto).version)
                throw new ConflictException('Hồ sơ đã được người khác sửa. Đóng form, tải lại rồi chỉnh sửa.');

              if (!previous) {
                if (!input.name || !input.name.trim()) throw new BadRequestException('Họ và tên không được để trống.');
                if (!input.status) {
                  input.status = EmployeeStatus.WORKING;
                }
              } else {
                if (input.code === null || input.name === null || input.status === null)
                  throw new BadRequestException('Mã, tên và trạng thái không được để trống.');
              }

              for (const [field, kind] of [
                ['departmentId', CatalogKind.DEPARTMENT],
                ['positionId', CatalogKind.POSITION],
                ['jobTitleId', CatalogKind.JOB_TITLE],
              ] as const) {
                const value = input[field];
                if (value && value !== previous?.[field]) {
                  const catalog = await tx.employeeCatalog.findUnique({ where: { id: value } });
                  if (!catalog || catalog.kind !== kind || !catalog.active)
                    throw new BadRequestException('Danh mục không hợp lệ hoặc đã ngừng sử dụng.');
                }
              }

              if (input.managerId && input.managerId !== previous?.managerId) {
                let cursor: string | null = input.managerId;
                const seen = new Set<string>();
                while (cursor) {
                  if (cursor === id || seen.has(cursor)) throw new BadRequestException('Quản lý trực tiếp không được tạo vòng lặp.');
                  seen.add(cursor);
                  const manager: { managerId: string | null; status: EmployeeStatus } | null =
                    await tx.employee.findUnique({ where: { id: cursor }, select: { managerId: true, status: true } });
                  if (!manager || (cursor === input.managerId && manager.status !== 'WORKING'))
                    throw new BadRequestException('Quản lý phải là nhân sự đang làm việc.');
                  cursor = manager.managerId;
                }
              }

              // Validate GPS locations
              let validatedLocations: { id: string; name: string; isActive: boolean }[] = [];
              if (input.gpsLocationIds && input.gpsLocationIds.length > 0) {
                validatedLocations = await tx.gpsLocation.findMany({
                  where: { id: { in: input.gpsLocationIds } },
                  select: { id: true, name: true, isActive: true },
                });
                if (validatedLocations.length !== input.gpsLocationIds.length) {
                  throw new BadRequestException('Một hoặc nhiều địa điểm chấm công không tồn tại trong hệ thống.');
                }
                if (!previous) {
                  const inactive = validatedLocations.filter((l) => !l.isActive);
                  if (inactive.length > 0) {
                    throw new BadRequestException(`Địa điểm chấm công "${inactive[0].name}" đã ngừng hoạt động.`);
                  }
                } else {
                  const prevLocationIds = new Set(
                    (previous.gpsLocations || []).map((l: any) => l.gpsLocationId)
                  );
                  const newlyAdded = validatedLocations.filter((l) => !prevLocationIds.has(l.id));
                  const inactiveNew = newlyAdded.filter((l) => !l.isActive);
                  if (inactiveNew.length > 0) {
                    throw new BadRequestException(`Địa điểm chấm công "${inactiveNew[0].name}" đã ngừng hoạt động.`);
                  }
                }
              }

              const {
                version: _version,
                createUserAccount,
                identities,
                banks,
                workPermits,
                visas,
                families,
                educations,
                partyHistories,
                experiences,
                certificates,
                gpsLocationIds,
                ...fields
              } = input as UpdateEmployeeDto & {
                createUserAccount?: boolean;
                identities?: any[];
                banks?: any[];
                workPermits?: any[];
                visas?: any[];
                families?: any[];
                educations?: any[];
                partyHistories?: any[];
                experiences?: any[];
                certificates?: any[];
                gpsLocationIds?: string[];
              };
              void _version;

              const data: any = {
                ...fields,
                birthday: date(input.birthday, true),
                joinDate: date(input.joinDate),
                officialContractDate: date(input.officialContractDate),
              };

              // Filter out empty string or null values for non-relation fields
              Object.keys(data).forEach((k) => {
                if (data[k] === '' || data[k] === undefined) delete data[k];
              });

              // Extract relation ID fields and connect properly to Prisma relations
              const { departmentId, positionId, jobTitleId, managerId, ...scalarData } = data;

              if (gpsLocationIds !== undefined) {
                scalarData.gpsLocation = gpsLocationIds.length > 0
                  ? validatedLocations.map((l) => l.name).join(', ')
                  : null;
              }

              const relationConnects: any = {};
              if (departmentId !== undefined) {
                relationConnects.department = departmentId ? { connect: { id: departmentId } } : { disconnect: true };
              }
              if (positionId !== undefined) {
                relationConnects.position = positionId ? { connect: { id: positionId } } : { disconnect: true };
              }
              if (jobTitleId !== undefined) {
                relationConnects.jobTitle = jobTitleId ? { connect: { id: jobTitleId } } : { disconnect: true };
              }
              if (managerId !== undefined) {
                relationConnects.manager = managerId ? { connect: { id: managerId } } : { disconnect: true };
              }

              const creation = input as CreateEmployeeDto;

              let finalCode: string;
              let finalSyncCode: string | null = null;

              if (!previous) {
                // Tự động cấp mã nhân sự và mã chấm công duy nhất bởi backend
                finalCode = await this.generateNextEmployeeCode(tx);
                finalSyncCode = await this.generateNextSyncCode(tx);
              } else {
                finalCode = (data.code || previous.code).toUpperCase();
                finalSyncCode = data.syncCode !== undefined ? data.syncCode : previous.syncCode;
              }

              const relationData = !previous
                ? {
                    identities: identities?.length
                      ? {
                          create: identities.map((x) => ({
                            ...x,
                            issueDate: date(x.issueDate),
                            expiryDate: date(x.expiryDate),
                          })),
                        }
                      : undefined,
                    banks: banks?.length ? { create: banks } : undefined,
                    workPermits: workPermits?.length
                      ? { create: workPermits.map((x) => ({ ...x, issueDate: date(x.issueDate), expiryDate: date(x.expiryDate) })) }
                      : undefined,
                    visas: visas?.length
                      ? { create: visas.map((x) => ({ ...x, issueDate: date(x.issueDate), expiryDate: date(x.expiryDate) })) }
                      : undefined,
                    families: families?.length
                      ? { create: families.map((x) => ({ ...x, birthday: date(x.birthday, true), issueDate: date(x.issueDate) })) }
                      : undefined,
                    educations: educations?.length
                      ? { create: educations.map((x) => ({ ...x, fromDate: date(x.fromDate), toDate: date(x.toDate) })) }
                      : undefined,
                    partyHistories: partyHistories?.length
                      ? { create: partyHistories.map((x) => ({ ...x, fromDate: date(x.fromDate), toDate: date(x.toDate) })) }
                      : undefined,
                    experiences: experiences?.length
                      ? { create: experiences.map((x) => ({ ...x, fromMonth: date(x.fromMonth), toMonth: date(x.toMonth) })) }
                      : undefined,
                    certificates: certificates?.length
                      ? { create: certificates.map((x) => ({ ...x, validFrom: date(x.validFrom), validTo: date(x.validTo) })) }
                      : undefined,
                  }
                : {};

              const createOrUpdateData = {
                ...scalarData,
                code: finalCode,
                syncCode: finalSyncCode,
                ...relationConnects,
                ...relationData,
              };

              const row = previous
                ? await tx.employee.update({
                    where: { id: previous.id, version: previous.version },
                    data: { ...createOrUpdateData, version: { increment: 1 } },
                    include,
                  })
                : await tx.employee.create({
                    data: { ...createOrUpdateData, name: creation.name },
                    include,
                  });

              // On update, sync dynamic child tables if provided
              if (previous) {
                if (identities !== undefined) {
                  await tx.employeeIdentity.deleteMany({ where: { employeeId: previous.id } });
                  if (identities.length) {
                    await tx.employeeIdentity.createMany({
                      data: identities.map((x) => ({
                        ...x,
                        employeeId: previous.id,
                        issueDate: date(x.issueDate),
                        expiryDate: date(x.expiryDate),
                      })),
                    });
                  }
                }
                if (banks !== undefined) {
                  await tx.employeeBank.deleteMany({ where: { employeeId: previous.id } });
                  if (banks.length) {
                    await tx.employeeBank.createMany({
                      data: banks.map((x) => ({ ...x, employeeId: previous.id })),
                    });
                  }
                }
                if (workPermits !== undefined) {
                  await tx.employeeWorkPermit.deleteMany({ where: { employeeId: previous.id } });
                  if (workPermits.length) {
                    await tx.employeeWorkPermit.createMany({
                      data: workPermits.map((x) => ({ ...x, employeeId: previous.id, issueDate: date(x.issueDate), expiryDate: date(x.expiryDate) })),
                    });
                  }
                }
                if (visas !== undefined) {
                  await tx.employeeVisa.deleteMany({ where: { employeeId: previous.id } });
                  if (visas.length) {
                    await tx.employeeVisa.createMany({
                      data: visas.map((x) => ({ ...x, employeeId: previous.id, issueDate: date(x.issueDate), expiryDate: date(x.expiryDate) })),
                    });
                  }
                }
                if (families !== undefined) {
                  await tx.employeeFamily.deleteMany({ where: { employeeId: previous.id } });
                  if (families.length) {
                    await tx.employeeFamily.createMany({
                      data: families.map((x) => ({ ...x, employeeId: previous.id, birthday: date(x.birthday, true), issueDate: date(x.issueDate) })),
                    });
                  }
                }
                if (educations !== undefined) {
                  await tx.employeeEducation.deleteMany({ where: { employeeId: previous.id } });
                  if (educations.length) {
                    await tx.employeeEducation.createMany({
                      data: educations.map((x) => ({ ...x, employeeId: previous.id, fromDate: date(x.fromDate), toDate: date(x.toDate) })),
                    });
                  }
                }
                if (partyHistories !== undefined) {
                  await tx.employeePartyHistory.deleteMany({ where: { employeeId: previous.id } });
                  if (partyHistories.length) {
                    await tx.employeePartyHistory.createMany({
                      data: partyHistories.map((x) => ({ ...x, employeeId: previous.id, fromDate: date(x.fromDate), toDate: date(x.toDate) })),
                    });
                  }
                }
                if (experiences !== undefined) {
                  await tx.employeeExperience.deleteMany({ where: { employeeId: previous.id } });
                  if (experiences.length) {
                    await tx.employeeExperience.createMany({
                      data: experiences.map((x) => ({ ...x, employeeId: previous.id, fromMonth: date(x.fromMonth), toMonth: date(x.toMonth) })),
                    });
                  }
                }
                if (certificates !== undefined) {
                  await tx.employeeCertificate.deleteMany({ where: { employeeId: previous.id } });
                  if (certificates.length) {
                    await tx.employeeCertificate.createMany({
                      data: certificates.map((x) => ({ ...x, employeeId: previous.id, validFrom: date(x.validFrom), validTo: date(x.validTo) })),
                    });
                  }
                }
              }

              // Sync GPS locations in join table
              if (gpsLocationIds !== undefined) {
                await tx.employeeGpsLocation.deleteMany({
                  where: { employeeId: row.id },
                });
                if (gpsLocationIds.length > 0) {
                  await tx.employeeGpsLocation.createMany({
                    data: gpsLocationIds.map((gpsLocationId) => ({
                      employeeId: row.id,
                      gpsLocationId,
                    })),
                    skipDuplicates: true,
                  });
                }
              }

              if (!previous && createUserAccount) {
                const passwordHash = await bcrypt.hash('123456aA@', 10);
                await tx.user.create({
                  data: {
                    username: row.code,
                    displayName: row.name,
                    passwordHash,
                    roles: { create: [{ role: { connect: { name: 'USER' } } }] },
                    employee: { connect: { id: row.id } },
                  },
                });
              }

              const finalRow =
                (await (typeof (tx.employee as any).findUniqueOrThrow === 'function'
                  ? (tx.employee as any).findUniqueOrThrow({ where: { id: row.id }, include })
                  : tx.employee.findUnique({ where: { id: row.id }, include }))) || row;

              if ((tx as any).employeeHistory?.create) {
                await (tx as any).employeeHistory.create({
                  data: {
                    employeeId: finalRow.id,
                    action: !previous ? 'CREATED' : 'UPDATED',
                    actorName: actor?.displayName || 'System',
                    before: previous ? (previous as any) : undefined,
                    after: finalRow as any,
                  },
                });
              }

              return present(finalRow);
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
          ),
        );
      } catch (err: any) {
        lastError = err;
        const isConflict =
          err instanceof ConflictException ||
          err?.status === 409 ||
          err?.code === 'P2002' ||
          (typeof err?.message === 'string' && err.message.includes('tồn tại trong hệ thống'));
        if (isCreate && isConflict && attempt < maxRetries - 1) {
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async stats() {
    const total = await this.prisma.client.employee.count({ where: { status: { not: 'STOP_WORKING' } } });
    const working = await this.prisma.client.employee.count({ where: { status: 'WORKING' } });
    const temporary = await this.prisma.client.employee.count({ where: { status: 'TEMPORARY' } });
    const catalogs = await this.prisma.client.employeeCatalog.findMany({ where: { kind: 'DEPARTMENT' } });

    const allEmployees = await this.prisma.client.employee.findMany({
      where: { status: { not: 'STOP_WORKING' } },
      select: { joinDate: true },
    });

    const now = new Date();
    let under1Year = 0;
    let from1To3Years = 0;
    let from3To5Years = 0;
    let over5Years = 0;

    allEmployees.forEach((emp) => {
      const join = emp.joinDate ?? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
      if (months < 12) under1Year++;
      else if (months <= 36) from1To3Years++;
      else if (months <= 60) from3To5Years++;
      else over5Years++;
    });

    const deptCounts = await Promise.all(
      catalogs.map(async (d) => {
        const count = await this.prisma.client.employee.count({ where: { departmentId: d.id, status: { not: 'STOP_WORKING' } } });
        return { id: d.id, name: d.name, count };
      }),
    );

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const onboardingThisMonth = await this.prisma.client.employee.count({
      where: {
        joinDate: { gte: startOfMonth, lte: endOfMonth },
        status: { not: 'STOP_WORKING' },
      },
    });

    return {
      total,
      working,
      temporary,
      onboardingThisMonth,
      contractRenewals: 0, // TODO: tính từ model contract khi có
      departmentBreakdown: deptCounts.filter((d) => d.count > 0),
      seniorityBreakdown: [
        { label: 'Dưới 1 năm (<12 tháng)', count: under1Year, percent: Math.round((under1Year / (total || 1)) * 100) },
        { label: 'Từ 1 - 3 năm (12-36 tháng)', count: from1To3Years, percent: Math.round((from1To3Years / (total || 1)) * 100) },
        { label: 'Từ 3 - 5 năm (36-60 tháng)', count: from3To5Years, percent: Math.round((from3To5Years / (total || 1)) * 100) },
        { label: 'Trên 5 năm (>60 tháng)', count: over5Years, percent: Math.round((over5Years / (total || 1)) * 100) },
      ],
    };
  }
}
