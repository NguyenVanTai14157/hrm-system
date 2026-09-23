import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaService } from '../../database/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';

@Module({
  providers: [PayrollService, PrismaService, AttendanceService],
  controllers: [PayrollController],
  exports: [PayrollService],
})
export class PayrollModule {}
