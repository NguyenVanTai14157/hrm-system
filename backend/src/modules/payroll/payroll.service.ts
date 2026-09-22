import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attendanceService: AttendanceService,
  ) {}

  // ── Templates ─────────────────────────────────────────────────────────────

  async getTemplates() {
    return this.prisma.client.payrollTemplate.findMany({ orderBy: { name: 'asc' } });
  }

  // ── Payroll List ───────────────────────────────────────────────────────────

  async getPayrolls(month?: string) {
    const where = month ? { month } : {};
    const payrolls = await this.prisma.client.payroll.findMany({
      where,
      include: { template: true, records: true },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total amount dynamically since it's not in schema
    return payrolls.map(p => {
      const totalAmount = p.records.reduce((sum, r) => sum + ((r.payload as any)?.netSalary ?? 0), 0);
      return { ...p, totalAmount, records: undefined };
    });
  }

  // ── Create Payroll ─────────────────────────────────────────────────────────

  async createPayroll(data: { name: string; month: string; templateId: string }) {
    return this.prisma.client.payroll.create({
      data: {
        name: data.name,
        month: data.month,
        templateId: data.templateId,
        status: 'DRAFT',
      },
      include: { template: true },
    });
  }

  // ── Calculate Payroll from Timesheet ───────────────────────────────────────

  async calculatePayroll(payrollId: string, timesheetRows: any[]) {
    const payroll = await this.prisma.client.payroll.findUnique({
      where: { id: payrollId },
      include: { template: true },
    });
    if (!payroll) throw new Error('Payroll not found');

    // Auto-fetch timesheet from Attendance module when frontend sends empty array
    let rows = timesheetRows;
    if (!rows || rows.length === 0) {
      const timesheet = await this.attendanceService.getTimesheet(payroll.month);
      rows = timesheet.rows;
    }

    const template = payroll.template;
    const columns = (template.columns as any[]) ?? [];

    let totalAmount = 0;

    // Delete existing records then recreate
    await this.prisma.client.payrollRecord.deleteMany({ where: { payrollId } });

    for (const row of rows) {
      const emp = await this.prisma.client.employee.findUnique({
        where: { id: row.employee.id },
      });
      if (!emp) continue;

      // 1Office System Variables
      const baseSalary = (emp as any).salaryBase ?? 12500000;
      const salaryInsurance = (emp as any).salaryInsurance ?? baseSalary;
      const numberDependent = (emp as any).numberDependent ?? 0;
      const standardDays = 24; // CONG_QUY_DINH
      const actualDays = row.summary.totalActual ?? 24;
      const otHoursLight = (row.summary.totalOT ?? 0) * 4;
      const otHoursNight = (row.summary.totalOT ?? 0) * 2;
      const lateMinutes = (row.summary.totalLate ?? 0);

      // 1. LUONG_NC = ((baseSalary + allowances) / standardDays) * actualDays
      const allowanceFixed = 1500000; // Phụ cấp ăn trưa + Xăng xe
      const luongNC = Math.round(((baseSalary + allowanceFixed) / standardDays) * actualDays);

      // 2. LUONG_OT = (baseSalary / (standardDays * 8)) * (OT_DAY * 1.5 + OT_NIGHT * 2.0)
      const hourlyRate = baseSalary / (standardDays * 8);
      const luongOT = Math.round(hourlyRate * (otHoursLight * 1.5 + otHoursNight * 2.0));

      // 3. DEDUCT_INSURANCE = salaryInsurance * 10.5% (8% BHXH + 1.5% BHYT + 1% BHTN)
      const deductInsurance = Math.round(salaryInsurance * 0.105);

      // 1Office Bonus & Fine Variables
      const thuongDS = (emp as any).thuongDS ?? 1000000; // THUONG_DS: Thưởng doanh số
      const thuongKPIs = (emp as any).thuongKPIs ?? 500000; // THUONG_KPIS: Thưởng KPI
      const thuongHoaHong = (emp as any).thuongHoaHong ?? 300000; // THUONG_HOAHONG: Hoa hồng sản phẩm
      const totalBonus = thuongDS + thuongKPIs + thuongHoaHong;

      // 1Office Progressive Fine (CAL_FINE_LATE / CAL_FINE_SOON)
      let tienPhatDiMuon = 0;
      if (lateMinutes > 0 && lateMinutes <= 15) {
        tienPhatDiMuon = 20000;
      } else if (lateMinutes > 15 && lateMinutes <= 30) {
        tienPhatDiMuon = 50000;
      } else if (lateMinutes > 30) {
        tienPhatDiMuon = 100000;
      }
      const xuLy = tienPhatDiMuon;

      // 5. TAX_PIT (Thuế TNCN lũy tiến từng phần)
      const grossIncome = luongNC + luongOT + allowanceFixed + totalBonus;
      const taxableIncome = Math.max(0, grossIncome - 730000 - deductInsurance - 11000000 - (numberDependent * 4400000));
      let taxPIT = 0;
      if (taxableIncome > 80000000) {
        taxPIT = taxableIncome * 0.35 - 9850000;
      } else if (taxableIncome > 52000000) {
        taxPIT = taxableIncome * 0.30 - 5850000;
      } else if (taxableIncome > 32000000) {
        taxPIT = taxableIncome * 0.25 - 3250000;
      } else if (taxableIncome > 18000000) {
        taxPIT = taxableIncome * 0.20 - 1650000;
      } else if (taxableIncome > 10000000) {
        taxPIT = taxableIncome * 0.15 - 750000;
      } else if (taxableIncome > 5000000) {
        taxPIT = taxableIncome * 0.10 - 250000;
      } else if (taxableIncome > 0) {
        taxPIT = taxableIncome * 0.05;
      }
      taxPIT = Math.round(Math.max(0, taxPIT));

      // 6. SALARY_END (Thực nhận) = LUONG_NC + Lương OT + Phụ cấp + (THUONG_DS + THUONG_KPIS + THUONG_HOAHONG) - (XU_LY + BHXH + Thuế TNCN)
      let salaryEnd = luongNC + luongOT + allowanceFixed + totalBonus - deductInsurance - taxPIT - xuLy;
      // Round up to nearest 10,000đ (ROUNDUP(SALARY_END, -4))
      salaryEnd = Math.ceil(salaryEnd / 10000) * 10000;

      totalAmount += salaryEnd;

      const computedComponents = [
        { id: 'SALARY_TYPE_CB', name: 'Lương cơ bản', type: 'CURRENCY', amount: baseSalary },
        { id: 'NUMBER_WORKDAY', name: 'Công quy định', type: 'NUMBER', amount: standardDays },
        { id: 'CAL_WORKDAY', name: 'Công làm việc', type: 'NUMBER', amount: actualDays },
        { id: 'LUONG_NC', name: 'Lương ngày công', type: 'CURRENCY', amount: luongNC },
        { id: 'LUONG_OT', name: 'Lương làm thêm giờ', type: 'CURRENCY', amount: luongOT },
        { id: 'ALLOW_1', name: 'Phụ cấp ăn trưa & xe', type: 'CURRENCY', amount: allowanceFixed },
        { id: 'THUONG_DS', name: 'Thưởng doanh số', type: 'CURRENCY', amount: thuongDS },
        { id: 'THUONG_KPIS', name: 'Thưởng KPI', type: 'CURRENCY', amount: thuongKPIs },
        { id: 'THUONG_HOAHONG', name: 'Hoa hồng sản phẩm', type: 'CURRENCY', amount: thuongHoaHong },
        { id: 'DEDUCT_INSURANCE', name: 'Bảo hiểm 10.5%', type: 'CURRENCY', amount: deductInsurance },
        { id: 'TAX_PIT', name: 'Thuế TNCN', type: 'CURRENCY', amount: taxPIT },
        { id: 'XU_LY', name: 'Tiền phạt đi muộn/về sớm', type: 'CURRENCY', amount: xuLy },
        { id: 'SALARY_END', name: 'Lương thực nhận', type: 'CURRENCY', amount: salaryEnd },
      ];

      await this.prisma.client.payrollRecord.create({
        data: {
          payrollId,
          employeeId: emp.id,
          payload: {
            SALARY_TYPE_CB: baseSalary,
            NUMBER_WORKDAY: standardDays,
            CAL_WORKDAY: actualDays,
            LUONG_NC: luongNC,
            LUONG_OT: luongOT,
            ALLOW_1: allowanceFixed,
            THUONG_DS: thuongDS,
            THUONG_KPIS: thuongKPIs,
            THUONG_HOAHONG: thuongHoaHong,
            DEDUCT_INSURANCE: deductInsurance,
            TAX_PIT: taxPIT,
            XU_LY: xuLy,
            LATE_PENALTY: xuLy,
            SALARY_END: salaryEnd,
            netSalary: salaryEnd,
            components: computedComponents,
            status: 'CALCULATED',
          },
        },
      });
    }

    return this.prisma.client.payroll.update({
      where: { id: payrollId },
      data: { status: 'CALCULATED' },
      include: { template: true },
    });
  }

  // ── Get Records ───────────────────────────────────────────────────────────

  async getPayrollRecords(payrollId: string) {
    const records = await this.prisma.client.payrollRecord.findMany({
      where: { payrollId },
      include: {
        employee: {
          select: { id: true, code: true, name: true, department: { select: { name: true } } },
        },
      },
      orderBy: { employee: { name: 'asc' } },
    });

    // Flatten payload into record for frontend
    return records.map(r => ({
      ...r,
      ...(r.payload as any),
      payload: undefined,
    }));
  }

  // ── Approve ──────────────────────────────────────────────────────────────

  async approvePayroll(payrollId: string) {
    return this.prisma.client.payroll.update({
      where: { id: payrollId },
      data: { status: 'APPROVED' },
    });
  }

  async getStats() {
    const payrolls = await this.prisma.client.payroll.findMany({
      include: { records: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    
    const latest = payrolls[0];
    let totalGross = 0;
    let netPayout = 0;
    let totalInsurance = 0;
    let totalPIT = 0;

    if (latest && latest.records.length > 0) {
      latest.records.forEach((r) => {
        const payload = r.payload as any;
        netPayout += payload?.SALARY_END ?? payload?.netSalary ?? 0;
        totalInsurance += payload?.DEDUCT_INSURANCE ?? 0;
        totalPIT += payload?.TAX_PIT ?? 0;
      });
      totalGross = netPayout + totalInsurance + totalPIT;
    }

    return {
      totalGross,
      netPayout,
      totalInsurance,
      totalPIT,
      totalEmployees: latest?.records.length ?? 0,
      payrollStatus: latest?.status ?? 'NONE',
      latestPayrollName: latest?.name ?? null,
      latestPayrollMonth: latest?.month ?? null,
    };
  }

  // ── Employee Personal Payroll for the Year ────────────────────────────────
  async getMyPayroll(employeeId: string, year: number) {
    if (!employeeId) return [];

    const yearPrefix = `${year}-`;
    const payrolls = await this.prisma.client.payroll.findMany({
      where: { month: { startsWith: yearPrefix } },
      include: {
        records: {
          where: { employeeId },
        },
      },
      orderBy: { month: 'asc' },
    });

    return payrolls.map((p) => {
      const rec = p.records[0];
      const payload = (rec?.payload as any) || null;
      return {
        payrollId: p.id,
        payrollName: p.name,
        month: p.month,
        status: p.status,
        record: rec
          ? {
              id: rec.id,
              employeeId: rec.employeeId,
              baseSalary: payload?.baseSalary ?? 0,
              totalStandardDays: payload?.totalStandardDays ?? 24,
              totalActualDays: payload?.totalActualDays ?? 0,
              payload,
              netSalary: payload?.SALARY_END ?? payload?.netSalary ?? 0,
              grossSalary: (payload?.SALARY_END ?? 0) + (payload?.DEDUCT_INSURANCE ?? 0) + (payload?.TAX_PIT ?? 0),
              components: payload?.computedComponents || [],
            }
          : null,
      };
    });
  }
}
