import { Metadata } from 'next';
import { EmployeeCreateScreen } from '@/features/employees/employee-create-screen';

export const metadata: Metadata = {
  title: 'Tạo mới hồ sơ nhân sự | HRM Workspace',
};

export default function EmployeeCreatePage() {
  return <EmployeeCreateScreen />;
}
