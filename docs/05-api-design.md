# 05 — API

Base URL local: http://localhost:3002/api/v1. Swagger: /api/docs, OpenAPI JSON: /api/docs-json.

| Method | Path dưới /api/v1 | Yêu cầu |
| --- | --- | --- |
| GET | /health | Public; chỉ liveness tiến trình |
| POST | /auth/login | username + password; header X-HRM-Client |
| POST | /auth/refresh | Refresh cookie + header X-HRM-Client |
| POST | /auth/logout | Refresh cookie + header X-HRM-Client; idempotent |
| GET | /auth/me | Bearer access token; được gọi trước khi đổi mật khẩu lần đầu |
| POST | /auth/change-password | Bearer, X-HRM-Client; currentPassword + newPassword |
| GET | /auth/admin-access | Bearer, admin.access; yêu cầu đã đổi mật khẩu |

X-HRM-Client là admin hoặc client. Các POST auth kiểm tra Origin nếu có và yêu cầu custom header; trình duyệt khác origin phải qua CORS allowlist, credentials=true.
POST /auth/login nhận thêm rememberMe?: boolean (mặc định false). Cookie refresh chỉ có Expires khi rememberMe=true; lựa chọn được lưu theo phiên, giữ khi refresh/đổi mật khẩu.
Header này chọn portal/session, không phải quyền hạn. Quyền thật luôn lấy từ database.

## Response

Login/refresh/change-password trả:
- accessToken, expiresIn (900 giây).
- user: id, username, displayName, employeeId, mustChangePassword, roles [{id,name}], permissions [code].
- Set-Cookie refresh HttpOnly theo portal, path=/api/v1/auth, SameSite=Lax; Secure khi NODE_ENV=production.
- Cache-Control: no-store.

Không trả passwordHash, authVersion hoặc refresh token trong JSON.
GET me trả user cùng cấu trúc trên. Logout trả message và xóa cookie, thu hồi phiên.

## Lỗi và giới hạn

400: DTO/password không hợp lệ. 401: sai thông tin hoặc phiên không hợp lệ. 403: thiếu quyền, sai origin/portal hoặc phải đổi mật khẩu. 429: quá giới hạn.
PASSWORD_CHANGE_REQUIRED được trả trong code của lỗi 403 từ guard.
ValidationPipe loại bỏ việc gửi thêm trường bằng forbidNonWhitelisted.
Login và đổi mật khẩu tối đa 10 yêu cầu/phút/IP; các endpoint auth khác 120/phút/IP, bộ đếm trong memory cho một tiến trình.

## Giới hạn

Đã có API Nhân sự, danh mục và lịch sử; hợp đồng, phân trang và mã lỗi tại [10-employees-mvp.md](10-employees-mvp.md). Backend sở hữu nghiệp vụ; Next.js chỉ gọi REST.
Chưa có API CRUD users/roles, data scope theo cá nhân/phòng ban, audit toàn hệ thống, endpoint logout mọi máy hoặc quản lý danh sách thiết bị.
Đọc docs/07-authentication.md trước khi cấu hình triển khai HTTPS/proxy.
