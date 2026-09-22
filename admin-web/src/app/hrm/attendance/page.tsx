'use client';

import { useAuth } from '@/components/auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';
import { TimesheetScreen } from '@/features/attendance/timesheet-screen';
import { EmployeeAttendanceView } from '@/features/attendance/employee-attendance-view';

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  if (!isAdmin) {
    return <EmployeeAttendanceView />;
  }

  return <TimesheetScreen />;
}
