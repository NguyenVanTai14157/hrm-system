import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmployeesModule } from '../employees/employees.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { PayrollModule } from '../payroll/payroll.module';
import { ApplicationsModule } from '../applications/applications.module';
import { PrismaService } from '../../database/prisma.service';
import { MeController } from './me.controller';

@Module({
  imports: [AuthModule, EmployeesModule, AttendanceModule, PayrollModule, ApplicationsModule],
  providers: [PrismaService],
  controllers: [MeController],
})
export class MeModule {}

