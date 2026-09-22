# 02 — Vai trò và quyền động

## Đã chốt và triển khai nền tảng

User có nhiều Role qua UserRole. Role có nhiều Permission qua RolePermission.
Quyền hiệu lực là hợp các permission của các role; chưa có quyền riêng ghi đè. Không có enum ADMIN/HR/MANAGER/EMPLOYEE.

- admin.access: cho phép đăng nhập vào admin-web.
- system.manage: quyền định hướng cho quản trị tài khoản, đã có trong catalog bootstrap; API quản trị tương ứng chưa triển khai.
- employee.view/create/update/catalog.manage: đã thực thi trong Nhân sự MVP; đọc toàn công ty, chưa scope cá nhân/phòng ban. Các thao tác ghi cần thêm employee.view. Xem [10-employees-mvp.md](10-employees-mvp.md).

Bootstrap tạo role Quản trị hệ thống và tài khoản Admin đầu tiên. Tên role chỉ là dữ liệu; backend kiểm tra permission code, không so sánh tên role.
Client web chấp nhận tài khoản ACTIVE; Admin yêu cầu thêm admin.access.

## Kiểm tra quyền

Global AuthGuard mặc định yêu cầu đăng nhập. Endpoint public phải được đánh dấu rõ.
Mỗi API bảo vệ kiểm tra token, phiên, trạng thái User và quyền từ database. Thay đổi role/permission có hiệu lực ở API tiếp theo.
Giao diện cập nhật thông tin khi tải lại, focus cửa sổ hoặc kiểm tra định kỳ 60 giây. Không có socket đẩy sự kiện.

API nghiệp vụ phải khai báo permission hành động và phạm vi dữ liệu. Nhân sự MVP đã có kiểm quyền; 7 module khác còn placeholder. Việc thấy liên kết menu không đại diện việc được cấp quyền truy cập dữ liệu HRM.

## Chưa triển khai

CRUD User/Role/Permission và UI quản trị, cấp tài khoản nhân viên, khóa/mở khóa qua UI, bảo vệ quản trị viên cuối cùng và audit thay đổi quyền.
Khi triển khai quản trị phải kiểm tra quyền cấp quyền, ngăn tự nâng quyền, cập nhật authVersion và thu hồi phiên trong cùng transaction khi khóa/reset.
Phạm vi cá nhân/phòng ban/chi nhánh/toàn công ty, quyền payroll, tenant và quyền xóa vẫn cần đặc tả riêng.

Các code employee.view, employee.create, attendance.view, application.approve, payroll.manage… là catalog dự kiến, chưa phải API nghiệp vụ đã có.
