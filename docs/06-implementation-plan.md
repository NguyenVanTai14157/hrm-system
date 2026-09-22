# 06 — Kế hoạch

## Hiện tại

- Đã có bộ khung admin-web, client-web, backend, docs.
- Đã có giao diện admin, Nhân sự MVP thật và 7 trang HRM placeholder.
- Đã bỏ Flutter/mobile; định hướng client-web PWA, chưa thêm manifest/service worker.
- Đã triển khai đăng nhập, đổi mật khẩu lần đầu/chủ động, refresh, đăng xuất trên hai web.
- Đã có migration xác thực, role/permission động, bootstrap Admin và công cụ reset mật khẩu cục bộ.
- Đã có Nhân sự MVP: schema/API/UI và lịch sử. Xem [10-employees-mvp.md](10-employees-mvp.md). Chưa có UI/API quản trị User/Role/Permission.

## Kiểm tra lần triển khai xác thực

Đã đạt build/typecheck ba ứng dụng, lint, 4 unit test cấu hình/mật khẩu, integration test với MySQL về đổi mật khẩu bắt buộc, cookie/rotation/replay, quyền động, khóa và đăng xuất.
Browser check trên Edge đạt: chuyển trang bảo vệ về login, sai mật khẩu, đổi mật khẩu lần đầu, reload, nhiều tab, phiên Admin/Client độc lập, đăng xuất thật và bố cục điện thoại. Tài khoản test được dọn theo UUID riêng, không thay mật khẩu Admin bootstrap.
Audit sau cập nhật dependency báo 0 vulnerabilities tại thời điểm kiểm tra.

## Các lát cắt còn lại

1. Quản trị tài khoản/role/permission: cấp tài khoản từ hồ sơ, khóa/mở khóa, reset theo quyền, bảo vệ admin cuối cùng, audit.
2. Departments/Employees: chốt cơ cấu, trường dữ liệu, phạm vi truy cập.
3. Applications/Approvals: bắt đầu một loại đơn và quy trình được xác nhận.
4. Shifts/Attendance: lịch ca, nguồn chấm công, hiệu chỉnh, tăng ca theo đặc tả.
5. Payroll/Salary Advance: sau khi chốt công thức, kỳ lương và khấu trừ.
6. Evaluations/KPI/OKR: chốt phương pháp đo và chu kỳ.
7. PWA và triển khai: installability, HTTPS, chính sách cache không chứa dữ liệu nhạy cảm, offline/push chỉ nếu được yêu cầu.
8. Hoàn thiện vận hành: backup/restore, audit, monitoring, kiểm thử quyền và tải.

Mỗi lát cắt: yêu cầu → schema/API → backend → hai web → kiểm thử → nghiệm thu.
Không lấy khả năng chung của 1Office làm yêu cầu đã duyệt. Không sao chép mã nguồn/nhận diện/tài sản của họ.
