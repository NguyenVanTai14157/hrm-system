import { Suspense } from 'react';
import { ApplicationCreateScreen } from '@/features/applications/application-create-screen';

export default function ApplicationCreatePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#64748b' }}>Đang tải màn hình tạo đơn...</div>}>
      <ApplicationCreateScreen />
    </Suspense>
  );
}
