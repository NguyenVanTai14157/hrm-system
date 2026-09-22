# 04 — Database

MySQL 8.4 + Prisma 7. Đã chốt xác thực và Nhân sự MVP, chưa chốt toàn bộ schema HRM. Migration nhân sự: 202609160001_employees. Chi tiết [10-employees-mvp.md](10-employees-mvp.md).
Migration đầu tiên: prisma/migrations/202609150001_auth/migration.sql.

| Bảng | Trách nhiệm |
| --- | --- |
| Employee | Mã/tên, thông tin liên hệ, ngày sinh/vào làm, trạng thái, danh mục và quản lý trực tiếp; version chống ghi đè |
| EmployeeCatalog | Danh mục phẳng phòng ban/vị trí/chức danh, unique kind+code, active |
| EmployeeHistory | Snapshot trước/sau, người sửa, thời điểm; cùng transaction với hồ sơ |
| User | Username unique, displayName, bcrypt hash, ACTIVE/LOCKED, mustChangePassword, authVersion |
| Role / Permission | Role động và catalog permission |
| UserRole / RolePermission | Quan hệ nhiều-nhiều, khóa ghép chống gán trùng |
| Session | Phiên theo portal, hạn tuyệt đối 7 ngày, authVersion tại lúc cấp, thời điểm thu hồi |
| RefreshToken | Hash SHA-256 của token ngẫu nhiên; usedAt để phát hiện tái sử dụng |

User.employeeId nullable và unique: mỗi hồ sơ tối đa một user; tài khoản bootstrap hệ thống có thể không có hồ sơ.
Nhân sự chưa được cấp tài khoản là Employee chưa liên kết User, không tạo User giả với mật khẩu rỗng.
Quy định tài khoản nhân viên bắt buộc có hồ sơ phải được thực thi trong chức năng cấp tài khoản sắp tới; database cho phép null để hỗ trợ quản trị hệ thống.

Prisma Client generate vào src/generated/prisma (không commit); adapter MariaDB kết nối MySQL. DATABASE_URL đặt trong backend/.env; không nhúng trong frontend.
Không lưu mật khẩu hoặc refresh token bản rõ trong database. Dùng DateTime cho thời điểm phiên; chưa quyết định cách tính ngày công/múi giờ nghiệp vụ.

## Phần chưa chốt

Department, Shift, Attendance, Application, Approval, Payroll, SalaryAdvance, Evaluation, KPI, OKR.
Còn cần quy định cơ cấu/tenant, lịch sử điều chuyển, constraints, số tiền/độ chính xác, retention, dữ liệu nhạy cảm, biên transaction theo nghiệp vụ.
Mỗi lát cắt sau phải duyệt luồng và ERD trước khi thêm migration. Không dùng db push để thay lịch sử migration.

## Dữ liệu phiên

Refresh token cũ giữ lại trong vòng đời phiên để phát hiện replay. Trước production cần tác vụ định kỳ dọn phiên hết hạn và các refresh token liên quan; chưa có lịch dọn tự động.
