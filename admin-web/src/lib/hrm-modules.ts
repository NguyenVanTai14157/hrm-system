export const hrmModules = [
  { slug: 'applications', name: 'Đơn từ', description: 'Đề nghị và quy trình phê duyệt', icon: 'file', color: '#7056d8' },
  { slug: 'employees', name: 'Nhân sự', description: 'Hồ sơ và thông tin nhân viên', icon: 'users', color: '#2586ba' },
  { slug: 'evaluations', name: 'Đánh giá', description: 'Theo dõi các kỳ đánh giá', icon: 'star', color: '#d39428' },
  { slug: 'attendance', name: 'Chấm công', description: 'Ngày công và thời gian làm việc', icon: 'clock', color: '#258c7b' },
  { slug: 'payroll', name: 'Bảng lương', description: 'Thông tin các kỳ lương', icon: 'wallet', color: '#437dd3' },
  { slug: 'salary-advance', name: 'Ứng lương', description: 'Đề nghị tạm ứng lương', icon: 'wallet', color: '#c66a46' },
  { slug: 'kpi', name: 'KPI', description: 'Chỉ số hiệu suất công việc', icon: 'chart', color: '#8860c8' },
  { slug: 'okr', name: 'OKR', description: 'Mục tiêu và kết quả then chốt', icon: 'target', color: '#c45d87' },
  { slug: 'admin', name: 'Cài đặt hệ thống', description: 'Quản trị người dùng và cấu hình', icon: 'settings', color: '#475569' },
] as const;

export type IconName = typeof hrmModules[number]['icon'] | 'grid' | 'home' | 'arrow' | 'calendar' | 'settings' | 'users' | 'shield' | 'plus' | 'x' | 'reconcile' | 'currency' | 'key' | 'app' | 'bot';
