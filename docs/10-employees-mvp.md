# Nhân sự MVP — hướng dẫn và hợp đồng API

Phạm vi theo 4 điểm được người dùng duyệt trong docs/09-employees-requirements.md. Thực thi nghiệp vụ trong NestJS; admin-web gọi API thật.

## Chạy và sử dụng

### Bố cục khu vực Nhân sự (2026-09-17)

Từ menu ứng dụng chọn Nhân sự để mở `/hrm/employees`. Thanh bên chuyển sang các mục Tổng quan, Nhân sự, Hợp đồng, Quyết định, Báo cáo và Tùy chỉnh; nội dung hiển thị bên phải. Nút menu trên cùng vẫn mở danh sách 8 ứng dụng.

Mục Nhân sự dùng API hiện có, bổ sung tab trạng thái đồng bộ với bộ lọc, số lượng kết quả và bảng rộng cuộn ngang trong vùng nội dung. Giữ thao tác danh mục, thêm/sửa, xem chi tiết và lịch sử theo quyền.

Các đường dẫn con `dashboard`, `contracts`, `decisions`, `reports`, `customize` hiện là trang “Sẽ triển khai sau”, có liên kết quay lại hồ sơ. Chưa có nghiệp vụ, số liệu dashboard, import/export hay tùy chỉnh trường dữ liệu ở những trang này.

Phần nội dung danh sách giữ bố cục Gemini đã chỉnh: tab phía trên, bộ lọc/số lượng bên trái, tải lại/danh mục bên phải và nút thêm ở header. Bảng tách riêng vị trí và chức danh, ngày hiển thị DD/MM/YYYY, tên nhân sự mở chi tiết.

### Sắp xếp, nhóm và chọn cột

Bấm **Bộ lọc** bên trái để mở menu sắp xếp/nhóm/chọn cột/bỏ nhóm. Chọn **Tìm kiếm và lọc hồ sơ** trong menu để mở các ô tìm kiếm, trạng thái, phòng ban và vị trí. Không còn nút Tùy chọn danh sách riêng bên phải.

- Mở **Bộ lọc → Sắp xếp danh sách**, chọn trường rồi chọn tăng/giảm, hoặc bấm tiêu đề cột (tăng → giảm → bỏ sắp xếp). API sắp xếp trước khi phân trang, thêm ID làm tiêu chí phụ để giữ thứ tự ổn định khi giá trị bằng nhau.
- **Nhóm dữ liệu** hỗ trợ một cấp: phòng ban, vị trí hoặc chức danh. Đã bỏ lựa chọn nhóm theo trạng thái trên giao diện theo yêu cầu; dùng các tab phía trên để lọc trạng thái. Mặc định phòng ban; chọn **Bỏ nhóm** để về danh sách thường. Hồ sơ thiếu danh mục vào “Chưa xác định”. API giữ các hồ sơ cùng nhóm liền nhau; tiêu chí sắp xếp áp dụng trong từng nhóm. Khi bỏ nhóm, sắp xếp áp dụng trên toàn bộ danh sách.
- Badge nhóm là tổng số hồ sơ của nhóm trên **toàn bộ kết quả đã lọc**, không chỉ trang hiện tại. Bảng vẫn phân trang 20 hồ sơ và chỉ hiện nhóm có hồ sơ trên trang đó; một nhóm có thể tiếp tục ở trang sau. Thu gọn nhóm không thay đổi tổng số trang.
- **Chọn cột hiển thị**: tìm tên trường, bật/tắt (giữ ít nhất một cột), kéo tay nắm đổi thứ tự hoặc dùng nút lên/xuống. Có 13 trường hiện có: mã, tên, phòng ban, vị trí, chức danh, ngày vào làm, trạng thái, quản lý, ngày sinh, giới tính, email, điện thoại, địa chỉ. Cột thao tác luôn giữ ở cuối.
- Lưu danh sách/thứ tự cột trong localStorage với khóa `hrm:employee-columns:v1:<userId>`; không lưu dữ liệu hồ sơ. Giữ qua tải lại/đăng nhập lại trên cùng trình duyệt, không đồng bộ giữa thiết bị. Nếu storage bị chặn hoặc dữ liệu lưu hỏng, màn hình vẫn dùng được với mặc định/bộ nhớ phiên.
- **Mặc định** khôi phục cột và thứ tự ban đầu; độ rộng cột do ứng dụng quy định, chưa có kéo chỉnh độ rộng. Nhóm/sắp xếp chưa lưu qua tải lại trang.

Email/SMS, cập nhật hàng loạt, import/export, mã chấm công, xếp hạng và chữ ký số tiếp tục để sau; nút Nhập/Xuất từ giao diện hiện tại chỉ thông báo sẽ bổ sung.

Trên máy hiện tại migration `202609160001_employees` đã áp dụng vào hrm_db; quyền đã thêm vào role có `system.manage`. Không đổi mật khẩu/tài khoản hiện có. Theo yêu cầu tiếp theo của người dùng, đã chạy seed 24 nhân sự và 10 danh mục mẫu.

### Dữ liệu mẫu

Chạy từ thư mục backend:

```powershell
npm.cmd run employees:seed
```

Tạo 24 hồ sơ giả lập (đủ thử phân trang 20 dòng), 4 phòng ban, 3 vị trí, 3 chức danh. Mã bắt đầu DEMO_, tên có (mẫu), email example.com, không tạo tài khoản đăng nhập. Có 9 trạng thái, quản lý trực tiếp và lịch sử tạo từ script. Chạy lại bỏ qua hồ sơ đã có, giữ các chỉnh sửa trên giao diện. Script dùng ID cố định và transaction; nếu mã trùng với dữ liệu khác thì hủy toàn bộ, không ghi đè.

Khi muốn xóa bộ mẫu, chạy riêng `npm.cmd run employees:seed:clean`. Lệnh này xóa cả chỉnh sửa/lịch sử của các hồ sơ thuộc bộ mẫu; không dùng mẫu làm hồ sơ thật. Chặn dọn nếu tài khoản hoặc hồ sơ ngoài bộ mẫu đang liên kết đến nhân sự/danh mục mẫu. Không xóa theo tiền tố DEMO_ mà dùng tập ID cố định và kiểm tra lịch sử khởi tạo của hồ sơ. Cả hai lệnh từ chối khi NODE_ENV=production. Lệnh dọn chưa được chạy trên dữ liệu hiện tại.

Máy khác: cấu hình backend/.env, chạy lần lượt trong backend:

```powershell
npm.cmd run prisma:generate
npm.cmd run db:deploy
npm.cmd run employees:permissions
npm.cmd run dev
```

Máy mới chưa có tài khoản: dùng `npm.cmd run auth:bootstrap` sau migrate (bao gồm seed quyền Nhân sự). Quyền không dựa vào tên role.

Trong terminal admin-web chạy `npm.cmd run dev`. Đăng nhập, mở menu HRM → Nhân sự (`/hrm/employees`). Nếu vừa được cấp quyền, tải lại trang để UI đọc quyền mới.

1. Bấm **Danh mục**, tạo phòng ban, vị trí, chức danh cần dùng. Danh mục phẳng, chưa có cây chi nhánh hay quan hệ vị trí thuộc phòng ban.
2. Bấm **Thêm nhân sự**; bắt buộc mã và họ tên, trạng thái mặc định Đang làm việc. Có thể bổ sung thông tin liên hệ/công việc sau.
3. Bấm **Xem** hoặc tên để xem chi tiết và lịch sử; bấm **Sửa** để cập nhật.
4. Nghỉ việc: sửa trạng thái; tài khoản đăng nhập không tự khóa. Không có thao tác xóa hồ sơ.

## Quyền

| Quyền | Thao tác |
|---|---|
| employee.view | Danh sách, chi tiết, lịch sử, đọc danh mục toàn công ty |
| employee.create | Tạo hồ sơ (cần thêm employee.view) |
| employee.update | Sửa hồ sơ (cần thêm employee.view) |
| employee.catalog.manage | Tạo/sửa/ngừng dùng danh mục (cần thêm employee.view) |

`admin.access` vẫn cần để vào admin-web. Chưa có UI gán role/quyền; không tự cấp quyền cho nhân viên thường. Backend kiểm quyền từng request, không dựa vào việc ẩn nút.

## API

Tiền tố `/api/v1`, Bearer access token từ auth hiện có. DTO từ chối trường lạ.

| Method | Route | Nội dung |
|---|---|---|
| GET | /employees | `q` tìm mã/tên; `status`, `departmentId`, `positionId`; `page` mặc định 1, `pageSize` 20, tối đa 100 |
| POST | /employees | Tạo hồ sơ |
| GET | /employees/:id | Chi tiết |
| PATCH | /employees/:id | Sửa, bắt buộc `version` vừa đọc |
| GET | /employees/:id/history | Lịch sử, `page`/`pageSize` |
| GET | /employee-catalogs | Toàn bộ danh mục phẳng; danh sách nhỏ phục vụ select |
| POST | /employee-catalogs | `kind`, `code`, `name`, `active` (mặc định true) |
| PATCH | /employee-catalogs/:id | Sửa mã/tên/active; không đổi kind |

Danh sách và lịch sử trả `{items,total,page,pageSize}`. Danh mục trả mảng. Nhân sự không trả User/password/token.

GET `/employees` nhận thêm `sortBy` (code/name/birthday/joinDate/gender/email/phone/address/status/department/position/jobTitle/manager), `sortDirection=asc|desc` (mặc định asc), `groupBy=departmentId|positionId|jobTitleId|status` (bỏ trống để không nhóm). Trường danh mục/quản lý sắp xếp theo tên. API dùng danh sách trường cho phép, từ chối trường/chiều không hợp lệ bằng 400. Response danh sách thêm `groups: [{value: string|null, count: number}]`, rỗng nếu không nhóm. Truy vấn danh sách/count/group cùng transaction RepeatableRead. Quyền employee.view giữ nguyên, không migration.

Ví dụ tạo:

```json
{"code":"NV001","name":"Nguyễn Văn An","status":"WORKING","joinDate":"2026-09-16"}
```

Các trường tùy chọn: gender, birthday, joinDate, email, phone, address, departmentId, positionId, jobTitleId, managerId. Gửi null để xóa trường tùy chọn. Mã chuẩn hóa uppercase, 1–50 ký tự Latin/số/._-, duy nhất. Email chưa kiểm trùng. Ngày là YYYY-MM-DD, lưu SQL DATE, ngày sinh không tương lai.

Status: WAITING, WORKING, TEMPORARY, MATERNITY_LEAVE, UNPAID_LEAVE, MILITARY_LEAVE, STUDY_LEAVE, SICK_LEAVE, STOP_WORKING. Đây là mã nội bộ, không sao chép mã API 1Office. MVP cho đổi trực tiếp giữa các trạng thái có hiệu lực ngay; chưa có quy trình quyết định/duyệt hay ngày hiệu lực tương lai.

Danh mục kind: DEPARTMENT, POSITION, JOB_TITLE. Chỉ gán mới danh mục active đúng loại. Hồ sơ cũ vẫn giữ danh mục đã ngừng dùng. Quản lý khi gán mới phải WORKING, không cần có tài khoản; cấm tự quản lý/vòng lặp. Khi quản lý nghỉ việc, chưa tự điều chuyển cấp dưới.

Tạo/sửa hồ sơ và history cùng transaction Serializable. `version` chống ghi đè dữ liệu cũ. HTTP 400 sai dữ liệu, 401 chưa đăng nhập, 403 thiếu quyền, 404 không tồn tại, 409 trùng mã/xung đột chỉnh sửa (cần tải lại). History lưu snapshot trước/sau và tên người sửa tại thời điểm thực hiện, không có API sửa/xóa. Hồ sơ trước migration chưa có lịch sử hồi tố.

## Giới hạn

- Chưa có lương, CCCD, ngân hàng, bảo hiểm, file, import/export, hợp đồng, kiêm nhiệm, duyệt, phân quyền theo phòng ban/cá nhân, hay tự sửa hồ sơ trên client-web.
- Danh sách hiện tìm mã/tên, lọc trạng thái/phòng ban/vị trí; chưa lọc khoảng ngày vào làm hoặc tìm email/SĐT.
- Danh mục trả toàn bộ để phục vụ MVP; cần phân trang/remote search khi số lượng tăng. Lịch sử danh mục riêng và chống ghi đè sửa danh mục chưa triển khai.
- Responsive đã bố trí form một cột trên điện thoại; bảng nhiều cột cuộn ngang trong vùng bảng. PWA/service worker chưa triển khai.

## Kiểm tra

Backend build trước khi chạy integration: `npm.cmd run build`, `npm.cmd run test:employees`, `npm.cmd run test:integration`, `npm.cmd test`.
Test tạo/dọn fixture riêng trong database đang cấu hình, không reset database hoặc mật khẩu thật. Không chạy backend build đồng thời với integration.

Browser tùy chọn: build admin-web; cài Playwright ngoài repo hoặc cấu hình PLAYWRIGHT_MODULE rồi chạy `node test/employees.browser.cjs` từ backend. Dùng Edge và tiến trình kiểm tra riêng (3347/3300); các cổng này cần trống.
