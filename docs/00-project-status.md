# 00 — Trạng thái dự án

Cập nhật: 2026-09-23. Đây là bản bàn giao chung cho người phát triển, Codex và Antigravity.

**Cập nhật mới nhất (2026-09-23):**
- Codex bổ sung `/hrm/attendance/settings`: hai mục Ca làm việc / Địa điểm GPS, tạo/sửa ca, tạo nhiều địa điểm trong transaction, sửa/trạng thái GPS, xem bản đồ, tìm kiếm và xuất CSV. Nối nút Cài đặt trong bảng công. Dùng schema GPS hiện có của Anti, không thay migration. Import, đối tượng áp dụng, Wifi, ghi chú GPS riêng và quy tắc ca nâng cao chưa triển khai trong màn hình này. Chi tiết kiểm tra ở cuối nhật ký bàn giao.
- Cập nhật theo xác minh 1Office: Shift lưu `qua ngày`, `check in trước`, `check out sau`; form cho chọn nhiều địa điểm GPS của ca; thêm migration `202609230002_attendance_settings`. Không tự áp dụng quy tắc ưu tiên GPS vào thuật toán chấm cho đến khi có kiểm thử nghiệp vụ.
- Triển khai Cổng nhân viên di động (Mobile Employee Portal) ngay trong `admin-web` tại `/me`, `/me/attendance`, `/me/payroll` và `admin-web/src/features/personal`.
- Hoàn thiện luồng Chấm công GPS Di động: Mô hình `GpsLocation` và `EmployeeGpsLocation` trong Prisma MySQL, tính khoảng cách Haversine thực tế, chặn ngoài bán kính (`OUT_OF_RADIUS`), kiểm tra khóa bảng công (`TimesheetLock`), chống chấm trùng (debounce 60s), ghi nhận đầy đủ vào `BiometricRawLog`.
- Chuẩn hóa công thức tính công `calculateAttendanceMetrics`: So sánh thời lượng làm việc thực tế (đã trừ giờ nghỉ) với giờ chuẩn của ca làm việc, xử lý múi giờ Việt Nam (`Asia/Ho_Chi_Minh`), xóa bỏ hoàn toàn hardcode mock data.
- Bảo mật phân quyền: Bảo vệ toàn bộ endpoint quản trị `/attendance/*` bằng quyền `admin.access`; chuyển toàn bộ luồng nhân viên sang `/me/attendance/*` (lấy danh tính từ JWT token); bảo vệ quyền duyệt đơn từ theo cấp duyệt/quản lý (`ApplicationApproval.step` / `managerId`).
- Giao diện mobile chuẩn 1Office: Top Header, Bottom Navigation Bar, Menu Drawer danh mục trượt từ dưới lên, Action Sheet cá nhân, `PersonalGpsPunchModal` định vị GPS theo thời gian thực và Bảng công 4 tab (Công tháng, Công tuần, Thống kê, Danh sách).

## Phạm vi và quyết định đã chốt

- HRM doanh nghiệp/nhà máy, gồm `admin-web` (tích hợp quản trị và mobile cá nhân `/me`), `backend`, `docs`.
- Frontend: Next.js 16/React 19/TypeScript/App Router/Ant Design.
- Backend: NestJS modular monolith, REST, Prisma 7, MySQL.
- Định hướng Mobile PWA trong `admin-web`; không dùng `client-web`.
- 8 chức năng: Đơn từ, Nhân sự, Đánh giá, Chấm công, Bảng lương, Ứng lương, KPI, OKR.
- Tham khảo mô tả/ảnh 1Office do người dùng cung cấp; không coi câu trả lời AI bên đó là đặc tả đã kiểm chứng, không sao chép mã/tài sản của họ.
- Đã chốt schema xác thực và Employee MVP theo 4 điểm người dùng duyệt; chưa chốt toàn bộ HRM.

## Đã triển khai

- Điều chỉnh vị trí menu theo phản hồi: nút Bộ lọc bên trái mở sắp xếp/nhóm/chọn cột/bỏ nhóm; chọn Tìm kiếm và lọc hồ sơ trong menu để mở các ô lọc. Đã bỏ nút Tùy chọn danh sách riêng bên phải.
- Nhân sự giữ bố cục Gemini: bổ sung sắp xếp server trước phân trang, nhóm một cấp theo phòng ban/vị trí/chức danh với tổng nhóm trên toàn bộ kết quả đã lọc. Đã bỏ mục nhóm theo trạng thái trên UI theo yêu cầu; giữ tab lọc trạng thái. Chọn 13 cột, kéo hoặc nút đổi thứ tự, lưu riêng user trên cùng trình duyệt, khôi phục mặc định. Nhóm vẫn có thể trải qua nhiều trang; xem docs/10. Email/SMS/cập nhật hàng loạt để sau.
- Bố cục Nhân sự cập nhật 2026-09-17 theo ảnh tham khảo: thanh bên riêng gồm Tổng quan/Nhân sự/Hợp đồng/Quyết định/Báo cáo/Tùy chỉnh, nội dung bên phải. Hồ sơ có tab trạng thái và tổng kết phân trang từ API. Ngoài mục Nhân sự, các mục con là trang thông báo sẽ triển khai sau, chưa có nghiệp vụ mới.
- Admin dashboard dạng khung, menu 8 chức năng; Nhân sự có màn hình thật, 7 chức năng còn lại placeholder.
- Nhân sự MVP: danh sách/tìm mã-tên/lọc trạng thái-phòng ban-vị trí/phân trang, tạo/xem/sửa; danh mục phòng ban/vị trí/chức danh; quản lý trực tiếp; lịch sử trước/sau, người sửa, thời điểm. Không xóa cứng.
- Backend kiểm quyền employee.view/create/update/catalog.manage; scope toàn công ty. Schema MySQL, API và admin-web đã nối thật. Tài khoản thường không tự được cấp quyền.
- Menu tài khoản sát mép phải dưới avatar; bấm avatar để mở/đóng, không thay kích thước header.
- Đăng nhập thật trên hai web bằng username/mật khẩu, đổi mật khẩu bắt buộc lần đầu, đổi chủ động, refresh, đăng xuất.
- Role động nhiều-nhiều; quyền cộng gộp, không có enum role cố định. admin.access kiểm soát cổng Admin.
- Access JWT 15 phút trong memory; refresh token ngẫu nhiên chỉ lưu hash trong DB, rotation/replay detection, hạn phiên 7 ngày.
- Keep me logged in: chọn thì cookie có hạn và nhớ username; bỏ chọn dùng session cookie và xóa username đã nhớ. Logout luôn thu hồi phiên, không lưu password vào localStorage.
- Global guard đọc lại trạng thái/quyền ở mỗi API; chưa có màn hình thao tác khóa/gán role.
- MySQL hrm_db đã được migrate và bootstrap Admin. Theo bàn giao, chưa nhập dữ liệu nhân sự thật; đã có bộ mẫu bên dưới.
- Cập nhật sau đó theo yêu cầu người dùng: đã chạy `employees:seed`, thêm 24 nhân sự mẫu và 10 danh mục (mã DEMO_, tên có “mẫu”). Chưa có dữ liệu nhân sự thật. Chạy lại không tạo trùng/ghi đè; lệnh dọn riêng `employees:seed:clean` có chặn liên kết ngoài bộ mẫu. Xem docs/10.
- Công cụ bootstrap/reset mật khẩu cục bộ. Chi tiết tại [07-authentication.md](07-authentication.md).

## Chưa triển khai

- UI/API quản trị User/Role/Permission, cấp tài khoản nhân viên, khóa/mở khóa qua UI, audit, bảo vệ admin cuối cùng.
- 7 module HRM còn lại; phần Nhân sự nâng cao (lương, CCCD, file, import/export, kiêm nhiệm, cây tổ chức, duyệt thay đổi, scope cá nhân/phòng ban).
- PWA installability, offline/push, triển khai production, TLS database từ xa, dọn phiên tự động.
- Email/SMS khôi phục mật khẩu, SSO, 2FA.

## Môi trường và file cần biết

- Root: D:/hrm-system. Windows/PowerShell, Node 22.18; dùng npm.cmd nếu PowerShell chặn npm.ps1.
- Mỗi terminal: vào backend, admin-web hoặc client-web rồi npm.cmd run dev.
- Ports: Admin 3000, Client 3001, API 3002. Swagger /api/docs, health /api/v1/health.
- Backend dev: .dev-dist qua tsconfig.dev.json. Build: dist. Đã tách để tránh build xóa đầu ra dev.
- Migration: 202609150001_auth, 202609150002_remember_login, 202609160001_employees (đã deploy trên hrm_db).
- Sau deploy trên máy khác: chạy npm.cmd run employees:permissions trong backend; script idempotent cấp quyền Nhân sự cho role có system.manage, không sửa mật khẩu.
- backend/.env: kết nối DB và JWT secret. backend/.env.bootstrap: thông tin ban đầu, không còn là mật khẩu hiện tại sau khi người dùng đổi mật khẩu.
- Không đọc/chép bí mật vào báo cáo hoặc Git; không reset tài khoản hay database để thử đăng nhập.
- Tại thời điểm kiểm tra bàn giao, thư mục chưa là Git repository. Chưa có commit để đối chiếu.

## Kiểm tra đã thực hiện và giới hạn

- Sort/group/columns 2026-09-17: backend/admin production build và lint đạt; integration MySQL kiểm sort qua trang, tổng nhóm toàn bộ kết quả, null và DTO allowlist đạt. Browser Edge đạt CRUD/lịch sử, sort/group API, bật cột, kéo thả/nút đổi thứ tự, lưu qua F5, mặc định, cấu hình hỏng/khóa tài khoản khác và mobile 390px. Chi tiết ở nhật ký mới nhất.
- Nhân sự MVP: backend/admin build, typecheck, lint đạt; 4 unit test đạt; integration MySQL cho Nhân sự và auth đạt. Browser Edge đạt tạo/sửa, giữ ngày sinh, xem lịch sử và bố cục 390px. Chi tiết ở nhật ký bàn giao mới nhất.
- Codex 2026-09-17: backend build, typecheck và lint cả ba workspace đạt; 4 unit test đạt; integration Nhân sự và auth đạt trên tiến trình riêng cổng 3346/3342.
- Antigravity 2026-09-17 (lượt 1): đọc và đối chiếu mã nguồn với tài liệu — không có sai lệch. Không chạy lệnh (typecheck bị từ chối). Kết quả build/typecheck/lint/test mới nhất được ghi nhận từ Codex cùng ngày.
- Antigravity 2026-09-17 (lượt 2): cải thiện UI danh sách nhân sự; admin-web typecheck và lint đạt. Không chạy browser test.
- Trước bản sửa RSA: build/typecheck/lint ba workspace, unit test, integration MySQL và browser Edge đã đạt. Kiểm tra gồm login sai, đổi mật khẩu lần đầu, refresh/replay, quyền động, khóa/logout, đa tab, hai portal và remember login.
- Tách .dev-dist: đã chạy dev thành công trên cổng kiểm tra riêng.
- Bản sửa RSA: backend/src/database/client.ts bật allowPublicKeyRetrieval chỉ với loopback và ngoài production. Đã kiểm tra kết nối thực trong integration (đạt). Chưa kiểm thử khi cache xác thực MySQL trống hoàn toàn (cold cache).
- Không tự khởi động lại MySQL hoặc dừng terminal của người dùng. Kiểm tra bằng tiến trình/cổng riêng nếu cần.
- Integration/browser test tạo và dọn fixtures theo UUID riêng; không chạy cùng lúc backend build đang thay dist.

## Bước tiếp theo

Người dùng đã duyệt 4 điểm trong [09-employees-requirements.md](09-employees-requirements.md). Nhân sự MVP đã triển khai. Hướng dẫn thao tác và API tại [10-employees-mvp.md](10-employees-mvp.md).

1. Kết nối MySQL sau sửa RSA: integration đã đạt; còn mở là cold cache (chưa kiểm thử sau khởi động lại MySQL sạch).
2. Người dùng nghiệm thu giao diện Nhân sự vừa cập nhật tại http://localhost:3000/hrm/employees; cần khởi động lại admin-web nếu chưa áp dụng.
3. Export/Import và checkbox hàng loạt đã có UI, chưa có logic — chờ xác nhận từ khách.
4. Seed mẫu 24 nhân sự DEMO_ đã có; có thể dọn bằng `employees:seed:clean` khi không cần.
5. Chờ người dùng chọn module tiếp theo; không tự triển khai 7 module còn lại.
6. Trước nghiệp vụ mới, chốt form, actor/quyền, quy trình/trạng thái và phạm vi dữ liệu.

## Quy tắc cập nhật chung

Cuối mỗi lượt làm, cập nhật trạng thái này và thêm một mục vào 08-handoff-log.md: thay đổi, file chính, migration, kiểm tra/kết quả, phần còn dở, bước tiếp theo.
Phân biệt đã viết code, đã kiểm tra và chưa hoàn tất. Không đánh dấu đạt nếu chỉ mới chạy lệnh.
Không sửa lại phần đã xong nếu không có lỗi hoặc yêu cầu mới. Không để hai AI sửa đồng thời cùng workspace.
