import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('stats')
  async getStats() {
    return this.payrollService.getStats();
  }

  @Get('my-payroll')
  async getMyPayroll(
    @Query('employeeId') employeeId: string,
    @Query('year') year?: string,
  ) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.payrollService.getMyPayroll(employeeId, y);
  }

  @Get('templates')
  async getTemplates() {
    return this.payrollService.getTemplates();
  }

  @Get()
  async getPayrolls(@Query('month') month?: string) {
    return this.payrollService.getPayrolls(month);
  }

  @Post()
  async createPayroll(
    @Body() body: { name: string; month: string; templateId: string },
  ) {
    return this.payrollService.createPayroll(body);
  }

  @Post(':id/calculate')
  async calculatePayroll(
    @Param('id') id: string,
    @Body() body: { timesheetRows: any[] },
  ) {
    return this.payrollService.calculatePayroll(id, body.timesheetRows);
  }

  @Get(':id/records')
  async getPayrollRecords(@Param('id') id: string) {
    return this.payrollService.getPayrollRecords(id);
  }

  @Patch(':id/approve')
  async approvePayroll(@Param('id') id: string) {
    return this.payrollService.approvePayroll(id);
  }
}
