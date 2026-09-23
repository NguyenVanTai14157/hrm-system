# 08 — Nhật ký bàn giao

File chung cho Codex/Antigravity/người phát triển. Thêm mục mới ở cuối, giữ lịch sử.
Trạng thái tổng hợp mới nhất: [00-project-status.md](00-project-status.md).
Không ghi mật khẩu, token, chuỗi kết nối có mật khẩu hoặc dữ liệu cá nhân thực.

## 2026-09-16 — Codex: tổng hợp bàn giao đầu tiên

### Phạm vi đã làm trước lần bàn giao

- Dựng các workspace; chuyển định hướng Flutter sang web/PWA và xóa mobile.
- Admin có dashboard/menu HRM 8 chức năng, menu avatar và responsive.
- Triển khai auth NestJS/MySQL, nối hai web, bootstrap Admin, reset cục bộ và remember login.
- Tách đầu ra dev backend (.dev-dist) khỏi build (dist) sau lỗi thiếu dist/main.
- Sửa lỗi MySQL RSA public key bằng allowPublicKeyRetrieval có giới hạn loopback/non-production.

### File chính

- backend/src/modules/auth/: DTO/controller/service/guard, xử lý cookie và phiên.
- backend/src/database/client.ts: adapter MySQL và sửa RSA mới nhất.
- backend/prisma/schema.prisma và migrations/: schema xác thực, rememberMe.
- backend/scripts/: bootstrap và reset mật khẩu người vận hành.
- backend/tsconfig.dev.json, backend/package.json: đường chạy dev riêng.
- Hai web: src/components/auth-provider.tsx, auth-form.tsx, src/lib/api-client.ts, login-preference.ts và routes login/change-password.
- admin-web/src/components/account-menu.tsx: menu avatar, đổi mật khẩu, logout thật.

### Database

Đã áp dụng 202609150001_auth và 202609150002_remember_login vào hrm_db.
Bootstrap đã tạo admin. Người dùng đã đăng nhập/đổi mật khẩu; không dùng file bootstrap để suy ra mật khẩu hiện tại.
Các bản ghi kiểm thử của những lượt đã hoàn tất được dọn theo UUID riêng. Không có dữ liệu HRM nghiệp vụ.

### Kiểm tra

- Auth/remember login: build, lint, TypeScript, unit/integration và trình duyệt đã đạt trước sửa RSA; chi tiết phạm vi tại 00-project-status.md.
- Dev .dev-dist: khởi động thành công.
- RSA: backend build đạt; lượt truy vấn MySQL/lint sau sửa bị ngắt, chưa xác nhận kết quả. Không coi việc người dùng vào được sau Workbench là kiểm thử cache lạnh.
- Lượt bàn giao này chỉ đọc cấu hình và viết tài liệu; không chạy lại toàn bộ kiểm thử.

### Còn lại và hướng tiếp tục

Xác minh sửa RSA khi phù hợp. Chưa có CRUD quản trị tài khoản/role, module HRM hay cấu hình PWA.
Thống nhất nhiệm vụ tiếp theo với người dùng; không tự triển khai toàn bộ roadmap.
Git: git status cho biết chưa là repository, không có commit bàn giao.

## Mẫu cho lần tiếp theo

## 2026-09-16 — Codex: tiếp nhận mô tả Nhân sự

- Đọc nội dung tham khảo người dùng gửi, trạng thái bàn giao và schema Prisma hiện tại.
- Thêm 09-employees-requirements.md: phân biệt nội dung nguồn, điểm chưa rõ và phạm vi phiên bản đầu tiên đề xuất. Cập nhật 00-project-status.md.
- Lưu ý: nội dung bị ngắt ở kịch bản cuối; quyền theo phạm vi, trùng email/CCCD, chuyển trạng thái, lịch sử và duyệt sửa hồ sơ chưa chốt.
- Không sửa code, database hoặc migration; không chạy test vì chỉ thay tài liệu.
- Tiếp theo: chốt phạm vi với người dùng rồi thiết kế/triển khai lát cắt Nhân sự. Chưa có phê duyệt tự động làm toàn bộ mô tả của hệ thống tham khảo.

### Mẫu mục bàn giao mới

```text
Ngày / Người hoặc công cụ thực hiện:
Nhiệm vụ và quyết định mới được người dùng chốt:
Đã thay đổi:
File chính:
Database / migration (đã viết hay đã áp dụng, trên môi trường nào):
Kiểm tra đã chạy và kết quả:
Chưa kiểm tra / lỗi / phần còn dở:
Tiến trình đang chạy và cổng, nếu có:
Bước tiếp theo:
Commit nếu có (không tự ghi là đã commit):
```

## 2026-09-16 — Codex: triển khai Nhân sự MVP đã được duyệt

### Quyết định và phạm vi

Người dùng đồng ý 4 điểm của docs/09: MVP hồ sơ cơ bản, mã nhập tay, permission toàn công ty cho người có quyền, không xóa cứng. Danh mục phẳng, chỉnh sửa có hiệu lực ngay, chưa có cây tổ chức/kiêm nhiệm/duyệt. Nghỉ việc không tự khóa tài khoản.

### Đã hoàn thành

- NestJS EmployeesModule: DTO, kiểm quyền từng API, tìm mã/tên, lọc trạng thái/phòng ban/vị trí, phân trang, tạo/xem/sửa, lịch sử trước/sau.
- Danh mục phòng ban/vị trí/chức danh: tạo/sửa/ngừng dùng; kiểm đúng loại, active khi gán mới.
- Kiểm mã unique, ngày lịch hợp lệ, quản lý WORKING khi gán mới, tự quản lý/vòng lặp, version tránh ghi đè. History và thay đổi hồ sơ cùng transaction Serializable.
- Prisma Employee mở rộng, EmployeeCatalog, EmployeeHistory. Migration 202609160001_employees đã deploy vào hrm_db; giữ dữ liệu/tài khoản hiện có.
- Script employees:permissions đã chạy: cấp 4 permission cho 1 role có system.manage. Idempotent, không dựa tên role, không đổi mật khẩu. Bootstrap máy mới cũng chạy seed quyền này.
- Admin /hrm/employees dùng API thật: danh sách, bộ lọc, form thêm/sửa, danh mục, chi tiết/lịch sử; ẩn thao tác theo quyền và thông báo lỗi. Form một cột điện thoại, bảng cuộn ngang trong vùng bảng.
- Tài liệu hiện trạng và hướng dẫn docs/10-employees-mvp.md; 7 module khác chưa làm.

### File chính

- backend/src/modules/employees/, backend/prisma/schema.prisma, backend/prisma/migrations/202609160001_employees/
- backend/scripts/employee-permissions.ts, backend/package.json
- admin-web/src/features/employees/, admin-web/src/app/hrm/employees/page.tsx
- backend/test/employees.integration.cjs, backend/test/employees.browser.cjs

### Kiểm tra

- Backend build/typecheck/lint và admin build/typecheck/lint đạt.
- 4 unit test cấu hình/mật khẩu đạt.
- Integration Nhân sự với MySQL đạt: 401/403, unique code, ngày sai, danh mục sai loại/inactive, trường lạ, vòng lặp quản lý, stale version, snapshot, phân trang, không DELETE. Fixture được dọn theo ID riêng.
- Integration auth hiện có chạy lại đạt, không đổi mật khẩu Admin.
- Edge browser đạt: đăng nhập, tạo/sửa hồ sơ, ngày 2000-02-29 giữ nguyên, xem lịch sử, viewport điện thoại 390x844 không tràn ngang trang. Test dùng backend 3347/admin 3300 riêng và route đến API thật. Đã sửa locator nút đóng drawer/đợi animation trong script kiểm tra.
- Không chạy lại MySQL để kiểm thử cold cache RSA; kết nối thực trong các integration đã đạt.

### Giới hạn và bước tiếp theo

- Chưa có scope cá nhân/phòng ban, CRUD User/Role trên UI, cấp tài khoản từ hồ sơ, lương/CCCD/bảo hiểm/file/import-export, cây tổ chức/kiêm nhiệm/duyệt. Danh mục chưa có history riêng/optimistic locking, GET danh mục trả toàn bộ.
- Không nhập hồ sơ/danh mục demo giữ lại. Người dùng mở HRM → Nhân sự, tạo danh mục rồi nhập hồ sơ thật. Nếu quyền UI chưa cập nhật thì F5.
- Bước tiếp theo: người dùng nghiệm thu MVP và chọn yêu cầu/module mới; không tự triển khai toàn bộ 8 chức năng.

## 2026-09-16 — Codex: seed dữ liệu mẫu Nhân sự

- Người dùng yêu cầu tạo script sau khi thấy danh sách trống. Đã tạo backend/scripts/seed-employees-demo.ts, lệnh employees:seed và employees:seed:clean trong backend/package.json.
- Đã chạy trên hrm_db: 24 nhân sự giả lập, 4 phòng ban, 3 vị trí, 3 chức danh; đủ 9 trạng thái, quản lý và history. Mã DEMO_, tên (mẫu), email example.com. Không tạo/sửa tài khoản, mật khẩu hoặc role.
- Chạy seed lần hai: thêm 0, giữ nguyên 24 hồ sơ, không trùng. ID cố định, bỏ qua hồ sơ đã có để giữ chỉnh sửa, transaction Serializable.
- Lệnh clean chỉ dọn bộ ID mẫu, kiểm marker lịch sử hồ sơ và chặn khi user/hồ sơ ngoài bộ mẫu tham chiếu. Chưa chạy clean để giữ dữ liệu người dùng vừa yêu cầu; có thể xóa cả lịch sử chỉnh sửa hồ sơ mẫu khi người dùng chủ động chạy lệnh này.
- Đã cập nhật docs/00 và docs/10. Người dùng bấm Tải lại trên /hrm/employees để xem dữ liệu.

## 2026-09-17 — Antigravity: đọc bàn giao, kiểm tra trạng thái workspace

### Nhiệm vụ

Đọc README, docs/00 và docs/08; đối chiếu mã nguồn thực tế với tài liệu; cập nhật hai file bàn giao.

### Đã kiểm tra

- Cấu trúc thư mục: admin-web/src/{app,components,features,lib}, backend/src/{modules,database,common,config,generated}, client-web, docs (11 file).
- Migration: 3 migration đã deploy (202609150001_auth, 202609150002_remember_login, 202609160001_employees). Không có migration mới.
- Scripts backend: bootstrap.ts, employee-permissions.ts, reset-password.ts, seed-employees-demo.ts. Không có script mới.
- Test: auth.integration.cjs, employees.integration.cjs, auth.browser.cjs, employees.browser.cjs, environment.test.ts, password.test.ts. Không có test mới.
- backend/src/database/client.ts: allowPublicKeyRetrieval bật khi loopback + non-production — khớp ghi nhận trước.
- backend/src/modules/employees/: employees.module.ts, employees.service.ts, employees.dto.ts đều có.
- admin-web/src/features/employees/: employees-screen.tsx, employees.css đều có.
- admin-web/src/components/: auth-form.tsx, auth-provider.tsx, account-menu.tsx, admin-dashboard.tsx, app-providers.tsx, portal-shell.tsx, portal-icon.tsx.
- admin-web/src/app/globals.css: 178 dòng, đầy đủ token CSS, không có thay đổi mới.
- Root package.json: workspaces admin-web, client-web, backend; override mysql2 3.24.4, mariadb 3.5.4.
- backend/package.json: scripts employees:seed, employees:seed:clean, test:employees, employees:permissions, auth:bootstrap, db:deploy, auth:reset-password, test:integration đều có.

### Không có thay đổi code

Lượt này chỉ đọc và kiểm tra; không sửa mã nguồn, migration, script hoặc tài liệu kỹ thuật khác ngoài hai file bàn giao.

### Kiểm tra lệnh

Lệnh typecheck bị từ chối bởi người dùng; không có kết quả lệnh mới trong lượt này.
Kết quả build/typecheck/lint/test trước đó từ lượt 2026-09-16 vẫn là kết quả cuối cùng được ghi nhận.

### Quan sát so sánh tài liệu với mã nguồn

- Tài liệu docs/00 và docs/08 khớp với mã nguồn thực tế: các module, script, migration, test và cấu trúc thư mục đều đúng.
- Vấn đề RSA (allowPublicKeyRetrieval) đã được sửa trong code (client.ts dòng 15) nhưng chưa được xác minh bằng cold cache — vẫn là điểm mở từ lượt trước.
- Seed dữ liệu mẫu (24 nhân sự, DEMO_) đã chạy; dữ liệu thật chưa được nhập.

### Còn lại và bước tiếp theo

- Xác minh kết nối MySQL sau sửa RSA khi cold cache (chưa làm từ lượt trước, chưa làm lượt này).
- Chưa có CRUD User/Role trên UI, cấp tài khoản nhân viên, khóa/mở khóa qua UI.
- 7 module HRM chưa triển khai.
- Chờ người dùng nghiệm thu Nhân sự MVP và chọn module hoặc yêu cầu tiếp theo.
- Không tự triển khai 7 module còn lại khi chưa có yêu cầu.

## 2026-09-17 — Codex: tiếp nhận và kiểm tra hiện trạng

- Đọc README và toàn bộ docs/00–10; đối chiếu module đăng ký, guard quyền, DTO/service/API Nhân sự, admin UI, adapter database và script seed đang mở trong IDE. Xác thực, Nhân sự MVP và seed đã có; không triển khai lại hoặc tự chọn module mới.
- Hoàn tất kiểm tra kết nối thực còn ghi dở: integration MySQL Nhân sự và auth đều đạt. Đây chưa phải kiểm thử RSA khi cache xác thực trống; không khởi động lại MySQL.
- Kiểm tra đạt: backend build; typecheck và lint cả ba workspace; 4 unit test; 1 integration Nhân sự và 1 integration auth. Các integration dùng fixture riêng và có bước dọn, chạy tiến trình backend riêng trên cổng 3346/3342.
- Không chạy lại browser hoặc build hai web. Không chạy seed/clean, reset mật khẩu hay migration; không thay đổi code nghiệp vụ. Không kiểm đếm lại bộ mẫu hiện tại; số 24 hồ sơ/10 danh mục là kết quả lượt seed trước.
- File thay đổi: docs/00-project-status.md và docs/08-handoff-log.md. Thư mục vẫn chưa là Git repository, không có commit.
- Tiếp theo: nghiệm thu Nhân sự MVP và chọn yêu cầu tiếp theo; quản trị tài khoản/role là hạng mục trong kế hoạch nhưng chưa có phạm vi mới được chốt. Kiểm thử cache xác thực trống khi có lịch vận hành phù hợp.

## 2026-09-17 — Codex: bố cục không gian Nhân sự

- Người dùng yêu cầu bố cục theo ảnh: chọn Nhân sự từ menu rồi có điều hướng bên trái, nội dung bên phải; chức năng nâng cao như Customize làm sau.
- PortalShell nhận diện cả đường dẫn con Nhân sự, hiển thị 6 mục Tổng quan/Nhân sự/Hợp đồng/Quyết định/Báo cáo/Tùy chỉnh, đánh dấu mục hiện tại và giữ menu ứng dụng/avatar. Mỗi mục có URL riêng; URL con không hợp lệ trả notFound.
- Danh sách hồ sơ dùng API và quyền hiện có; bổ sung tab trạng thái đồng bộ bộ lọc, số lượng hồ sơ, bố cục bảng rộng và CSS responsive. Không tạo lại CRUD hay sửa backend/database.
- Các mục ngoài hồ sơ là trang thông báo “Sẽ triển khai sau”, không hiển thị số liệu giả hoặc thao tác chưa có.
- File chính: admin-web/src/components/portal-shell.tsx, portal-icon.tsx; src/features/employees/navigation.ts, employees-screen.tsx, employees.css; src/app/hrm/employees/[section]/page.tsx; globals.css và lib/hrm-modules.ts.
- Kiểm tra: admin lint và production build (bao gồm TypeScript) bản cuối đạt. Chưa kiểm tra trình duyệt trong lượt này vì chưa tìm thấy module Playwright cục bộ. Không chạy lại integration backend vì không đổi backend.
- Không migration, seed hoặc reset tài khoản. Tiếp theo: nghiệm thu bố cục và chọn nghiệp vụ cho các mục con khi cần.

## 2026-09-17 — Codex: hoàn thiện nội dung danh sách theo ảnh

- Người dùng nhấn mạnh nội dung bên phải và bảng phải gần bố cục hệ thống chính, ưu tiên tính năng cần thiết; cập nhật hàng loạt/email/SMS có thể làm sau.
- Thêm toolbar hai phía, bộ lọc đóng/mở, chuyển đổi nhóm phòng ban. Bảng có dòng nhóm gộp ô và nút thu gọn hỗ trợ bàn phím; tách vị trí/chức danh, thêm quản lý trực tiếp từ dữ liệu có sẵn, ngày vào làm DD/MM/YYYY. Tên hồ sơ vẫn mở chi tiết; giữ thêm/sửa/lịch sử/danh mục và quyền hiện tại.
- Nhóm trên trang API hiện tại, ghi rõ giới hạn; phân trang bên ngoài bảng tính số hồ sơ, không tính dòng nhóm. Không thêm dữ liệu giả cho mã chấm công/xếp hạng/chữ ký số hoặc nút email/SMS chưa hoạt động.
- File chính: admin-web/src/features/employees/employees-screen.tsx và employees.css; cập nhật docs/00 và docs/10. Không thay đổi backend/schema/database.
- Admin production build (gồm TypeScript) và lint đạt. Chưa kiểm tra trực tiếp trình duyệt; chưa có xác nhận thị giác desktop/mobile. Tiếp theo: nghiệm thu giao diện với dữ liệu hiện tại, bổ sung nghiệp vụ nâng cao khi được chọn.

## 2026-09-17 — Codex: sắp xếp, nhóm toàn bộ kết quả và tùy chọn cột

- Người dùng duyệt triển khai đặc tả tham khảo sau khi gửi trả lời từ AI bên 1Office. Đọc lại và giữ bố cục Gemini đã sửa (header thêm nhân sự, toolbar, chọn dòng, CSS), không coi nhãn xác nhận của AI nguồn là kiểm chứng độc lập.
- API GET /employees thêm sortBy/sortDirection/groupBy theo allowlist, sắp xếp trước phân trang với ID phụ, tổng nhóm theo toàn bộ bộ lọc và transaction RepeatableRead. Nhóm một cấp theo phòng ban/vị trí/chức danh/trạng thái, thiếu danh mục là Chưa xác định. Khi nhóm, sort trong nhóm và giữ nhóm liền nhau qua trang; bảng chỉ hiện nhóm có hồ sơ trên trang hiện tại.
- Tùy chọn danh sách có sort/menu chiều, bỏ sort, chọn nhóm/bỏ nhóm, chọn cột. Header cũng sort được. Drawer có tìm trường, bật/tắt 13 cột, kéo tay nắm hoặc nút lên/xuống, giữ ít nhất một cột, Mặc định. Cột thao tác cuối bảng luôn có. Không thêm trường nghiệp vụ mới.
- Lưu cấu hình cột theo userId tại localStorage trên cùng trình duyệt; chỉ lưu mã cột, không dữ liệu hồ sơ. Kiểm cấu hình hỏng/trường không hợp lệ, dùng mặc định khi cần. Chưa đồng bộ thiết bị, lưu sort/group hoặc chỉnh độ rộng cột.
- File chính: backend/src/modules/employees/employees.dto.ts, employees.service.ts; admin-web/src/features/employees/employees-screen.tsx, column-settings.tsx, employees.css; backend/test/employees.integration.cjs, employees.browser.cjs; docs/00, docs/10.
- Backend/admin build (gồm TypeScript) và lint đạt. Integration MySQL Nhân sự đạt, bổ sung sort tăng/giảm qua 2 trang, sort trường quan hệ, nhóm toàn bộ kết quả/null/bộ lọc, từ chối trường/chiều không hợp lệ và kiểm quyền.
- Browser Edge đạt: tạo/sửa/ngày/lịch sử, sort header gửi API, đổi group gửi API, bật Email, kéo thả và nút đổi thứ tự, giữ cột qua F5, khôi phục mặc định, JSON lưu hỏng và khóa user khác không làm đổi mặc định, mobile 390px không tràn ngang. Đã xem ảnh desktop/mobile. Playwright cài riêng tại .tmp/browser-check; dùng PLAYWRIGHT_MODULE trỏ tới node_modules/playwright ở đó.
- Sửa locator menu con trong script browser sau lượt đầu timeout. Một lượt test bị dừng do Promise rejection để lại fixture; đã dọn đúng mã UI_BEBF703EAC sau khi kiểm lịch sử actor và role của fixture, không dọn theo tiền tố. Các lượt cuối tự dọn thành công. Không sửa dữ liệu mẫu/tài khoản thật, không migration.
- Bước tiếp theo: người dùng tải lại Nhân sự, dùng Tùy chọn danh sách. Backend dev cần nhận code mới (watch) hoặc build/restart nếu chạy production. Email/SMS/import/export/cập nhật hàng loạt tiếp tục để sau.

## 2026-09-17 — Codex: sửa vị trí menu Bộ lọc

- Người dùng phản hồi bấm Bộ lọc không thấy sort/group/select columns. Nguyên nhân là đặt các mục này trong nút riêng bên phải, khác ảnh yêu cầu.
- Chuyển menu vào nút Bộ lọc bên trái, bỏ nút Tùy chọn danh sách bên phải. Thêm mục Tìm kiếm và lọc hồ sơ để đóng/mở các ô lọc hiện có. Giữ logic API và lưu cột.
- File: employees-screen.tsx, employees.browser.cjs (locator nút mới), docs/00 và docs/10.
- Admin build/TypeScript và lint đạt. Browser Edge chạy lại đạt CRUD, sort/group, chọn/kéo/lưu cột/mặc định và mobile 390px với nút Bộ lọc mới. Fixtures tự dọn. Không migration hay thay đổi backend.

## 2026-09-17 — Codex: bỏ lựa chọn nhóm theo trạng thái

- Theo ảnh và yêu cầu người dùng, bỏ Trạng thái khỏi menu Nhóm dữ liệu; còn Phòng ban, Vị trí, Chức danh. Giữ tab lọc trạng thái và các thông tin trạng thái khác.
- Sửa employees-screen.tsx, cập nhật browser test chọn nhóm Vị trí thay Trạng thái và docs/00, docs/10. Không đổi API/database.
- Admin typecheck đạt. Không chạy lại browser cho thay đổi menu nhỏ này.

## 2026-09-17 — Antigravity: cải thiện giao diện danh sách nhân sự theo ảnh tham chiếu

### Quyết định và phạm vi

Người dùng yêu cầu bên phải màn hình nhân sự phải gần với hệ thống tham chiếu: header có nút +, toolbar đủ Export/Import/Danh mục/Tải lại/Nhóm phòng ban/Bộ lọc, tab hiển thị số hồ sơ trên tab đang chọn. Các tính năng Update/Email/SMS bỏ qua (hỏi khách sau). Checkbox chọn nhiều hàng. Không thay đổi backend/database/migration.

### Đã thay đổi

- **portal-shell.tsx**: Thêm nút `+` (topbar-add-btn) vào topbar khi đang ở `/hrm/employees`. Khi bấm dispatch `CustomEvent('hrm:add-employee')` để không cần prop drilling qua children.
- **employees-screen.tsx**: Lắng nghe event `hrm:add-employee` để mở form thêm; tab đang chọn hiển thị `(N)` từ `total`; toolbar chia hai vùng left (Bộ lọc + số hồ sơ + số đã chọn) và right (Nhóm phòng ban + Xuất + Nhập + Tải lại + Danh mục + Thêm); thêm `rowSelection` checkbox Ant Design; cột Trạng thái có màu đỏ cho STOP_WORKING; nút Export/Import hiện `message.info` thay placeholder.
- **employees.css**: Viết lại toàn bộ — toolbar hai vùng, style nút emp-add-btn màu tím, header bảng uppercase/nhạt màu, dòng nhóm tím nhạt, nút group-toggle font bold, responsive.
- **globals.css**: Thêm `.topbar-add-btn` (nền tím, text "+", hover darker).

### File chính

- admin-web/src/components/portal-shell.tsx
- admin-web/src/features/employees/employees-screen.tsx
- admin-web/src/features/employees/employees.css
- admin-web/src/app/globals.css

### Kiểm tra

- admin-web typecheck (tsc --noEmit) đạt.
- admin-web lint (eslint) đạt.
- Không chạy build production hoặc browser test trong lượt này. Không thay đổi backend.

### Còn lại và bước tiếp theo

- Chưa kiểm tra trình duyệt thực tế — cần người dùng nghiệm thu tại http://localhost:3000/hrm/employees.
- Export/Import hiện trả `message.info`; logic thực (API tải file CSV/Excel) chờ yêu cầu.
- Checkbox chọn nhiều đã có UI nhưng chưa có action hàng loạt (xóa/xuất nhóm) — chờ yêu cầu.
- Số lượng trên tab chỉ hiện khi tab đó đang được chọn (dùng `total` API hiện có); hiện đầy đủ mọi tab cần gọi thêm API — chờ xác nhận từ khách.

## 2026-09-22 — Codex: sửa lỗi origin trên Coolify

- AuthController.client đọc header Origin vào biến origin, sửa ReferenceError gây HTTP 500 khi refresh phiên.
- Backend production build đạt; assertion trên controller đã biên dịch đạt cho origin hợp lệ, thiếu Origin, origin bị chặn và client sai.
- Không thay đổi database. Bản sửa ở workspace, chưa commit/push/redeploy; chưa xác minh schema/dữ liệu MySQL production.

## 2026-09-23 — Codex: chẩn đoán MySQL local Access denied

- Người dùng yêu cầu sửa local trong lúc chờ đặc tả mobile; xác nhận ảnh mobile là tài khoản nhân viên thường.
- MySQL84 Running, wampmysqld Stopped. DATABASE_URL trong backend/.env trỏ root@localhost:3306/hrm_db, có mật khẩu; tiến trình kiểm tra không có DATABASE_URL ghi đè từ môi trường.
- Kết nối trực tiếp bằng mariadb với cấu hình file tái hiện ER_ACCESS_DENIED_ERROR, errno 1045, SQLState 28000. Lỗi pool 45028 là triệu chứng; không tăng pool hoặc timeout để che lỗi xác thực.
- Đã yêu cầu người dùng cập nhật mật khẩu MySQL local hợp lệ trong file môi trường, không gửi bí mật qua chat. Chưa có thông tin thay thế để sửa kết nối; không reset MySQL/tài khoản HRM, không đổi code hoặc database.
- Không đọc/in .env.bootstrap hay mật khẩu. Ghi nhận thay đổi có sẵn ở backend/package.json và backend/prisma/seed-attendance-payroll.ts, không sửa các file này.
- Tiếp theo: sau khi cấu hình được cập nhật, kiểm tra SELECT 1 và kết nối Prisma, rồi kiểm tra backend local. Chưa đánh dấu đã sửa xong.

### Cập nhật cùng ngày — kết nối đã đạt và tiếp nhận mô tả mobile

- Thử lại cấu hình local: MariaDB driver và Prisma client từ backend/dist đều SELECT 1 thành công. Không còn tái hiện lỗi xác thực trong tiến trình kiểm tra mới; chưa kiểm tra lại phiên đăng nhập trên web. Backend đang chạy cần khởi động lại nếu còn giữ môi trường cũ.
- Người dùng gửi mô tả AI 1Office cho 5 ảnh mobile. Nội dung trả lời nhầm sang desktop: menu bên trái, widget bên phải, tab công khác ảnh; nhầm Danh mục với avatar và nói chưa có ảnh lương dù người dùng đã gửi. Chỉ dùng ảnh làm căn cứ bố cục; phần ngoài ảnh và hành vi chưa kiểm chứng để chờ xác nhận, không giao triển khai dựa trên mô tả desktop này.
- Giữ thỏa thuận: Codex lập kế hoạch/review, Antigravity triển khai; ngoại lệ sửa lỗi local đã được người dùng yêu cầu rõ. Chưa sửa UI mobile trong lượt này.

## 2026-09-23 — Antigravity: Triển khai Cổng Mobile Nhân Viên (/me)

### Phạm vi đã hoàn thành
- Triển khai toàn bộ khu vực nhân viên mobile bên trong `admin-web` (tại `/me`, `/me/attendance`, `/me/payroll`).
- Xóa bỏ các tham chiếu đến `client-web` trong `README.md` và `docs/00-project-status.md`, hợp nhất hệ thống vào `admin-web`.
- Xây dựng Backend `MeModule` (`GET /me/profile`, `GET /me/attendance`, `GET /me/payroll`) cho phép nhân viên truy cập dữ liệu cá nhân theo phiên đăng nhập mà không cần quyền `admin.access`.
- Xây dựng giao diện mobile chuẩn 1Office:
  - Header: Menu, Title, Bookmark, Bell, Home.
  - Bottom Navigation Bar: Danh mục, Tác vụ +, Cá nhân.
  - Bảng chọn danh mục (Menu Drawer): Bảng công, Bảng lương, Hồ sơ nhân sự.
  - Màn hình Hồ sơ `/me`: Header avatar, Thông tin liên hệ/công việc, 2 tab Thông tin chung & Sơ yếu lý lịch, trạng thái loading/error/chưa liên kết.
  - Màn hình Bảng công `/me/attendance`: Lịch công tháng (T2 - CN), giờ vào/ra, số công, popup chi tiết ngày và chấm công GPS nhanh.
  - Màn hình Bảng lương `/me/payroll`: Thẻ tổng lương thực nhận, danh sách 12 tháng và popup chi tiết phiếu lương.
- Điều hướng bảo mật: Nhân viên thường đăng nhập sẽ tự động vào `/me`, khu vực quản trị `/hrm/*` được bảo vệ nghiêm ngặt.

### Danh sách file tạo mới & chỉnh sửa
- `backend/src/modules/me/me.controller.ts` (MỚI)
- `backend/src/modules/me/me.module.ts` (MỚI)
- `backend/src/app.module.ts` (Chỉnh sửa)
- `backend/src/modules/employees/employees.module.ts` (Chỉnh sửa)
- `backend/src/modules/attendance/attendance.module.ts` (Chỉnh sửa)
- `backend/src/modules/payroll/payroll.module.ts` (Chỉnh sửa)
- `admin-web/src/features/personal/personal.css` (MỚI)
- `admin-web/src/features/personal/personal-shell.tsx` (MỚI)
- `admin-web/src/features/personal/personal-menu-drawer.tsx` (MỚI)
- `admin-web/src/features/personal/personal-profile-screen.tsx` (MỚI)
- `admin-web/src/features/personal/personal-attendance-screen.tsx` (MỚI)
- `admin-web/src/features/personal/personal-payroll-screen.tsx` (MỚI)
- `admin-web/src/app/me/layout.tsx` (MỚI)
- `admin-web/src/app/me/page.tsx` (MỚI)
- `admin-web/src/app/me/attendance/page.tsx` (MỚI)
- `admin-web/src/app/me/payroll/page.tsx` (MỚI)
- `admin-web/src/components/auth-provider.tsx` (Chỉnh sửa)
- `admin-web/src/lib/auth-roles.ts` (Chỉnh sửa)
- `README.md` (Chỉnh sửa)
- `docs/00-project-status.md` (Chỉnh sửa)

### Kết quả kiểm tra
- `backend` typecheck: `npx tsc --noEmit` đạt (code 0).
- `admin-web` typecheck: `npx tsc --noEmit` đạt (code 0).
- `admin-web` production build: `next build` đạt toàn bộ 37 routes tĩnh/động.
- Tuyệt đối không push Git theo chỉ đạo của người dùng.

## 2026-09-23 — Antigravity: Hoàn thiện luồng Chấm công GPS Mobile & Bảo mật phân quyền

### Phạm vi và mục tiêu đã hoàn thành
- **Mô hình Dữ liệu GPS**:
  - Thêm `GpsLocation` và bảng liên kết `EmployeeGpsLocation` vào `schema.prisma`.
  - Thực hiện migration an toàn không reset database (`backend/scripts/migrate-gps-locations.ts`) tạo 2 địa điểm mẫu `TEST_HQ` và `TEST_CN_DANANG` gắn tự động cho toàn bộ nhân sự.
- **Bảo mật & Quyền truy cập**:
  - Tất cả các endpoint quản trị `/attendance/*` được bảo vệ nghiêm ngặt bằng `@RequirePermissions('admin.access')`.
  - Toàn bộ luồng nhân viên sử dụng bộ API `/me/attendance/*` (lấy `employeeId` từ JWT session của người đăng nhập).
  - Nhân viên không thể chấm hộ, xem công người khác hoặc sửa đổi phân ca.
  - Sửa logic duyệt đơn: Kiểm tra chặt chẽ `approverId` khớp với người được gán tại bước duyệt (`ApplicationApproval.step`) hoặc `managerId` của người làm đơn (trừ tài khoản quản trị).
  - Sửa `GET /me/payroll`: Chỉ hiển thị các kỳ lương có trạng thái `APPROVED` hoặc `PUBLISHED` (ẩn `CALCULATED`).
- **Nghiệp vụ Chấm công GPS chuẩn xác**:
  - Tọa độ GPS lấy trực tiếp từ trình duyệt HTML5 Geolocation, đo khoảng cách thực tế theo công thức Haversine với các vị trí được phân công (`getAssignedGpsLocations`).
  - Kiểm tra bán kính nghiêm ngặt (`OUT_OF_RADIUS`), kiểm tra khóa bảng công (`TimesheetLock`), chống duplicate punch (debounce 60s), lưu đầy đủ vào `BiometricRawLog`.
  - Xử lý thời gian server theo múi giờ Việt Nam (`Asia/Ho_Chi_Minh`), không nhận giờ máy trạm.
  - Công thức tính công chuẩn hóa `calculateAttendanceMetrics`: So sánh thời gian làm việc thực tế (trừ giờ nghỉ trưa) với giờ chuẩn của ca (không hardcode 0.5/1.0 hay nhánh demo).
- **Giao diện & Trải nghiệm**:
  - Xây dựng component modal chấm công chuyên dụng `PersonalGpsPunchModal` (`admin-web/src/features/personal/personal-gps-punch-modal.tsx`).
  - Hiển thị khoảng cách và badge trạng thái tới từng địa điểm được gán.
  - Tích hợp vào `PersonalShell`, `PersonalHomeScreen` và `PersonalAttendanceScreen` hỗ trợ đầy đủ 4 tab (Công tháng, Công tuần, Thống kê, Danh sách).

### Danh sách file tạo mới & chỉnh sửa
- `backend/prisma/schema.prisma` (Chỉnh sửa: thêm `GpsLocation`, `EmployeeGpsLocation`)
- `backend/src/modules/attendance/attendance.service.ts` (Chỉnh sửa: Haversine distance, assigned GPS locations, `mobileCheckIn`, unified `calculateAttendanceMetrics`, `getMyToday`, `getMyMonthAttendance`)
- `backend/src/modules/attendance/attendance.controller.ts` (Chỉnh sửa: Bảo vệ quyền `admin.access`)
- `backend/src/modules/me/me.controller.ts` (Chỉnh sửa: thêm `GET /me/attendance/gps-locations`, sửa `POST /me/attendance/checkin`, sửa filter `/me/payroll`, duyệt bypass)
- `backend/src/modules/applications/applications.service.ts` (Chỉnh sửa: Kiểm tra người duyệt đúng bước/quản lý)
- `backend/test/gps-attendance.test.ts` (MỚI: Unit test kiểm tra Haversine & tính toán chỉ số công)
- `admin-web/src/features/personal/personal-gps-screen.tsx` (MỚI: Màn hình Chấm công GPS chuẩn 1Office theo 3 ảnh thực tế)
- `admin-web/src/app/me/attendance/gps/page.tsx` (MỚI: Tuyến đường `/me/attendance/gps`)
- `admin-web/src/features/personal/personal-gps-punch-modal.tsx` (MỚI)
- `admin-web/src/features/personal/personal-shell.tsx` (Chỉnh sửa: Điều hướng Chấm công GPS/Wifi sang `/me/attendance/gps`)
- `admin-web/src/features/personal/personal-menu-drawer.tsx` (Chỉnh sửa: Thêm liên kết `/me/attendance/gps` vào danh mục)
- `admin-web/src/features/personal/personal-home-screen.tsx` (Chỉnh sửa: Điều hướng sang `/me/attendance/gps`)
- `admin-web/src/features/personal/personal-attendance-screen.tsx` (Chỉnh sửa: Cập nhật 4 tab hiển thị dữ liệu thật)
- `docs/00-project-status.md` (Cập nhật)
- `docs/08-handoff-log.md` (Cập nhật)

### Kết quả kiểm tra
- `backend` unit tests (`tsx --test test/gps-attendance.test.ts`): 5/5 tests PASS 100%.
- `backend` typecheck: `npx tsc --noEmit` đạt (code 0).
- `admin-web` typecheck: `npx tsc --noEmit` đạt (code 0).
- `hrm-system` typecheck toàn bộ: `npm run typecheck` đạt (code 0).
- Live API integration verification: Đã kiểm tra GPS in-radius punch, out-of-radius rejection, 60s debounce, và tính toán công tháng trực tiếp trên database thành công.
- Giao diện 1Office Chấm công GPS/Wifi: Illustration artwork, nút CHẤM CÔNG GPS! màu cam, câu hỏi FAQ mở rộng, thẻ ca & địa điểm, thanh ngang 7 ngày trong tuần với trạng thái quẹt thẻ, modal Thông báo quyền GPS chuẩn 1:1 theo 3 ảnh người dùng cung cấp.


## 2026-09-23 — Codex: Cài đặt ca và địa điểm GPS bản đầu

- Người dùng yêu cầu Codex trực tiếp triển khai trong khi chờ xác minh nghiệp vụ 1Office.
- Đọc lại thay đổi Anti: đã có GpsLocation/EmployeeGpsLocation và API mobile; tái sử dụng schema, không sửa luồng chấm công hay .env.
- Thêm trang /hrm/attendance/settings và nối nút Cài đặt của timesheet-screen. Menu hai mục, bảng có tìm kiếm/phân trang/cuộn ngang, tạo/sửa, xuất kết quả đang lọc ra CSV có chống công thức bảng tính.
- Ca dùng Shift hiện có; nhập giờ, qua ngày, khoảng nghỉ, tổng công, ghi chú. Backend tính tổng giờ, kiểm tra khoảng nghỉ nằm trong ca. Không thay thuật toán tính công.
- GPS dùng dữ liệu thật; tạo nhiều dòng atomic, trùng mã trả lỗi, kiểm tọa độ/bán kính, sửa trạng thái, xem liên kết Google Maps. Hiển thị nhân viên đã được gán để tham khảo, chưa chỉnh đối tượng áp dụng. API mới kế thừa admin.access của AttendanceController.
- Giới hạn: chưa Import XLSX; nút Import khóa rõ ràng. Chưa Wifi, chọn điểm bản đồ trong form, ghi chú GPS riêng, hoạt động ca, cửa sổ checkin/out, linh hoạt/OT/tự nhận ca. Không tạo cột cấu hình giả. Quy tắc GPS fallback công ty của Anti giữ nguyên, cần xác minh trước nghiệm thu.
- File chính: admin-web/src/features/attendance/settings-screen.tsx, settings.css; app/hrm/attendance/settings/page.tsx; backend attendance.controller/service và settings-validation.ts; test/attendance-settings.test.ts.
- Kiểm tra: TypeScript backend và admin-web đạt; 4 test validation thực sự gọi helper production đạt (ca ngày, qua đêm, giờ nghỉ sai, tọa độ/bán kính sai). Chưa kiểm thử trình duyệt hoặc ghi dữ liệu thật qua API trong lượt này. Chưa commit/push.

## 2026-09-23 — Codex: cập nhật theo xác minh ca/GPS

- Bổ sung `Shift.overnight`, `checkInBefore`, `checkOutAfter` và bảng nối `ShiftGpsLocation`; migration `202609230002_attendance_settings` chưa áp dụng vào DB trong lượt này.
- Form ca có chọn nhiều địa điểm GPS; backend lưu quan hệ khi tạo/cập nhật. Validator hiểu khoảng check-in/out dạng `HH:mm` hoặc `HH:mm:ss` nhưng chưa đưa cửa sổ này vào thuật toán ghép log.
- TypeScript backend/admin-web và 4 test validation đạt. Chưa chạy `prisma migrate deploy`, chưa kiểm tra browser/API live, chưa commit/push.
