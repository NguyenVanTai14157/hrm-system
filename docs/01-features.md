# 01 — Kiến trúc và phạm vi tính năng

## Trạng thái

Đây là bản định hướng để làm rõ yêu cầu, chưa phải đặc tả đã được duyệt.
Hiện triển khai: hai web với đăng nhập, đổi mật khẩu và đăng xuất; backend với health, Swagger, CORS, validation và xác thực MySQL/Prisma. Chi tiết đã chốt tại 07-authentication.md.
Đã có migration xác thực và Nhân sự MVP (schema/API/admin UI). Chi tiết tại [10-employees-mvp.md](10-employees-mvp.md). 7 module còn lại chưa triển khai. Đã bỏ mobile/Flutter, định hướng client-web PWA.

### Khung giao diện quản trị

Admin web có thanh điều hướng trên, thanh bên và trang tổng quan với các trạng thái trống cho công việc, đề xuất, chấm công và lịch làm việc. Bố cục tham khảo ảnh người dùng cung cấp; icon và nhận diện HRM được viết riêng, không dùng tài sản 1Office.
Nút menu góc trên bên trái mở nhóm HRM gồm 8 liên kết: Đơn từ, Nhân sự, Đánh giá, Chấm công, Bảng lương, Ứng lương, KPI, OKR.
`/hrm/employees` đã có danh sách/tạo/sửa/chi tiết/lịch sử và danh mục thật. Bảy đường dẫn còn lại là trang khung. Cổng quản trị yêu cầu admin.access. Trang Nhân sự kiểm tra employee.view, API kiểm quyền thao tác; menu HRM vẫn hiển thị liên kết tổng quan.

## Đánh giá kiến trúc

Chọn modular monolith NestJS: một backend, chia module rõ trách nhiệm, dùng chung cho admin-web và client-web/PWA.
Tách admin-web/client-web giúp giao diện và lịch phát hành độc lập; đổi lại có chi phí duy trì hai ứng dụng. Chỉ tách thư viện UI chung khi có nhu cầu thực tế.
Next.js App Router cung cấp routing/layout và khả năng render. Không đặt nghiệp vụ hoặc truy cập Prisma tại Next.js.
Ant Design cung cấp controls và form; Tailwind phụ trách bố cục. Scaffold không import Tailwind preflight để hạn chế xung đột reset với Ant Design.
AntdRegistry hỗ trợ xuất style khi render server; các component tương tác nằm trong client boundary.
Axios được cấu hình một nơi trong từng web; access token trong memory, refresh token trong cookie HttpOnly.

## Đánh giá công nghệ

| Thành phần | Lựa chọn | Nhận xét |
| --- | --- | --- |
| Web | Next.js 16, React 19, TypeScript | Phù hợp nhiều màn hình/form; cần phân biệt server/client component |
| UI | Tailwind 4, Ant Design 6 | Phù hợp trang quản trị; kiểm tra trình duyệt nhà máy trước khi chốt hỗ trợ |
| Backend | NestJS 11, REST, OpenAPI | DI/module/DTO rõ ràng; chọn dòng 11 tương thích nền Node hiện có |
| Data | MySQL 8.4, Prisma 7 | Đã có schema/client cho xác thực; chưa chốt database nghiệp vụ |
| Auth | JWT access + refresh, bcrypt | Đã triển khai, xem 07-authentication.md |
| PWA | Client web | Định hướng đã chốt; chưa có manifest/service worker |

Dependency cụ thể được khóa bằng package-lock khi cài thành công; không mặc định cập nhật major.
Root package.json có overrides cho multer 2.4.0, mysql2 3.24.4, deepmerge-ts 8.0.2 và mariadb 3.5.4 để xử lý cảnh báo audit ở dependency gián tiếp. Đã kiểm tra migrate, Prisma runtime và auth trên MySQL; rà soát lại overrides khi cập nhật upstream.
Chưa chọn cache, queue, multi-tenancy hoặc microservices.

## Danh mục dự kiến

| Nhóm | Admin / quản lý | Employee web / PWA |
| --- | --- | --- |
| Đơn từ | Applications, approvals | Tạo/xem đơn theo quyền |
| Nhân sự | Employees, departments | Profile |
| Chấm công | Attendance, shifts | Check-in/out, lịch sử, lịch ca |
| Đánh giá | Evaluations | Xem/thực hiện theo yêu cầu cần xác nhận |
| Thu nhập | Payroll, salary advance | Xem lương, đề nghị ứng lương |
| Mục tiêu | KPI, OKR | Các chức năng theo phạm vi được duyệt |
| Quản trị | Users, roles, permissions | Chưa xác định |

Danh mục không đồng nghĩa mọi actor đều có quyền mặc định.

## Giả định đang dùng

- Một repository, ba npm workspace.
- Local ports 3000/3001/3002; có thể cấu hình lại.
- Giao diện khởi đầu bằng tiếng Việt.
- Chưa quyết định một hay nhiều pháp nhân/nhà máy/khách hàng trên cùng database.
- Không sử dụng mã, thương hiệu hoặc tài sản của 1Office.

## Tham khảo chính thức

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Ant Design với Next.js](https://ant.design/docs/react/use-with-next)
- [Ant Design CSS compatibility](https://ant.design/docs/react/compatible-style/)
- [NestJS](https://docs.nestjs.com/first-steps)
- [Prisma MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql)
