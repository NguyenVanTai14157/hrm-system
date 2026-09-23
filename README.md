# HRM System

**Tiếp nhận dự án:** đọc [trạng thái hiện tại](docs/00-project-status.md) và [nhật ký bàn giao](docs/08-handoff-log.md) trước khi sửa code. Cuối mỗi lượt làm, cập nhật hai file này để người/AI tiếp theo tiếp tục đúng tiến độ.

Hệ thống HRM gồm `admin-web` (tích hợp Cổng quản trị và Cổng nhân viên di động `/me`) và `backend` NestJS dùng MySQL. Đã có đăng nhập username/mật khẩu, refresh phiên, đổi mật khẩu và đăng xuất.

## Cấu trúc

- **admin-web/**: Next.js 16, React 19, TypeScript, Ant Design — Cổng quản trị (`/hrm`) và Cổng nhân viên di động (`/me`) chạy tại cổng **3000**.
- **backend/**: NestJS 11, Prisma 7, MySQL, JWT, bcrypt — API chạy tại cổng **3002**.
- **docs/**: Yêu cầu, thiết kế, kế hoạch và tài liệu bàn giao.

Định hướng Web App / PWA cho nhân viên mobile; đã loại bỏ workspace `client-web` riêng biệt để hợp nhất toàn bộ cổng nhân viên vào `admin-web/src/app/me` và `admin-web/src/features/personal`.

## Chạy trên máy hiện tại

Mở hai terminal:

```powershell
cd D:\hrm-system\backend
npm.cmd run dev
```

```powershell
cd D:\hrm-system\admin-web
npm.cmd run dev
```

- **Cổng Quản trị / Nhân viên:** http://localhost:3000/login
  - Tài khoản Admin đăng nhập sẽ vào Cổng Quản Trị: `http://localhost:3000/`
  - Tài khoản Nhân viên đăng nhập sẽ tự động vào Cổng Di động: `http://localhost:3000/me`
- **Swagger Docs:** http://localhost:3002/api/docs
- **Health Check:** http://localhost:3002/api/v1/health

**Tài khoản ban đầu:** xem backend/.env.bootstrap trên máy. File không đưa lên Git. Lần đầu phải đổi mật khẩu. Mật khẩu MySQL khác mật khẩu HRM. Sau khi đổi mật khẩu, mật khẩu trong file bootstrap không còn dùng đăng nhập được.

## Thiết lập trên máy mới

Yêu cầu Node >=22.12, npm 10+, MySQL 8.4. Chạy npm.cmd ci tại root.
Chỉ copy .env.example nếu chưa có file môi trường; không ghi đè file đã cấu hình.

1. Tạo database hrm_db trong MySQL.
2. Copy backend/.env.example thành backend/.env, nhập DATABASE_URL.
3. Tạo JWT_ACCESS_SECRET bằng lệnh sau, điền vào backend/.env:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

4. Copy .env.example thành .env.local trong từng web.
5. Tại root:

```powershell
npm.cmd run prisma:generate --workspace backend
npm.cmd run db:deploy --workspace backend
npm.cmd run auth:bootstrap --workspace backend
```

Bootstrap chỉ tạo tài khoản khi database chưa có user, không đổi mật khẩu tài khoản hiện hữu.
URL database cần URL-encode ký tự đặc biệt trong username/password. Giữ cùng hostname localhost cho hai web và API khi chạy local.

## Quên mật khẩu trong giai đoạn này

Người vận hành backend tạo file backend/.env.reset với RESET_USERNAME và RESET_PASSWORD, rồi chạy:

```powershell
npm.cmd run auth:reset-password --workspace backend
```

Mật khẩu mới cần ít nhất 10 ký tự, tối đa 72 byte UTF-8. Reset thu hồi mọi phiên và yêu cầu đổi mật khẩu lần đầu, không tự mở khóa tài khoản. Xóa file chứa mật khẩu reset sau khi sử dụng. Chưa có API/UI quản trị cấp tài khoản hoặc reset; chưa tích hợp email/SMS.

## Kiểm tra

```powershell
npm.cmd run build
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test:backend
npm.cmd run test:integration --workspace backend
```

Integration test cần MySQL đã migrate, cổng 3342 trống; tạo và dọn đúng các bản ghi thử nghiệm của nó. Không chạy đồng thời test với build vì build thay thư mục dist.
Browser check tùy chọn: backend/test/auth.browser.cjs cần Playwright và Edge, backend đã build, hai web đã build, các cổng 3343/3300/3301 trống. Cấu hình PLAYWRIGHT_MODULE nếu Playwright cài ngoài dự án. Test chuyển request API tới backend thật ở cổng 3343 để không đụng backend phát triển 3002.

Xem [đặc tả xác thực](docs/07-authentication.md), [API](docs/05-api-design.md), [kế hoạch](docs/06-implementation-plan.md).
