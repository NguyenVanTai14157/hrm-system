'use client';

import { useAuth } from '@/components/auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';
import { PayrollScreen } from '@/features/payroll/payroll-screen';
import { EmployeePayrollView } from '@/features/payroll/employee-payroll-view';

export default function PayrollPage() {
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  if (!isAdmin) {
    return <EmployeePayrollView />;
  }

  return <PayrollScreen />;
}
