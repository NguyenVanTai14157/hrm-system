'use client';

import { useAuth } from '@/components/auth-provider';
import { isUserAdmin } from '@/lib/auth-roles';
import { EmployeesScreen } from '@/features/employees/employees-screen';
import { EmployeeProfileView } from '@/features/employees/employee-profile-view';

export default function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  if (!isAdmin) {
    return <EmployeeProfileView />;
  }

  return <EmployeesScreen />;
}
