# 07 — Xác thực: phạm vi đã thống nhất

## Quyết định

- Username + mật khẩu; không tự đăng ký.
- Username do quản trị nhập, chữ Latin/số/dấu . _ -, 3–50 ký tự, chuẩn hóa lowercase; chưa cho đổi username.
- Email không bắt buộc.
- Tách User/Employee; bootstrap Admin độc lập, tài khoản nhân viên gắn hồ sơ khi triển khai cấp tài khoản.
- Nhiều role động, quyền cộng gộp; không làm quyền riêng ghi đè.
- Mật khẩu cấp mới/reset bắt buộc đổi. Ít nhất 10 ký tự, tối đa 72 byte UTF-8 để tránh bcrypt cắt ngầm; bcrypt cost 12.
- Khóa tài khoản là thao tác thủ công; chưa tự khóa theo trạng thái thôi việc.
- Quên mật khẩu: nhờ người quản trị/vận hành, chưa có email/SMS/SSO/2FA.

## Luồng đã triển khai

1. Hai web kiểm tra refresh cookie khi mở. Chưa có phiên thì chuyển /login; backend lỗi mạng hiển thị Thử lại.
2. Login kiểm tra bcrypt, ACTIVE, admin.access nếu là admin portal.
3. Backend tạo Session (7 ngày tuyệt đối), refresh ngẫu nhiên 48 byte chỉ lưu SHA-256, access JWT HS256 15 phút.
4. Cookie refresh HttpOnly tách hrm_admin_refresh và hrm_client_refresh. Access token chỉ ở bộ nhớ JS, không localStorage.
5. Nếu mustChangePassword=true, web chỉ hiển thị trang đổi mật khẩu; global guard chặn API khác ngoài me/change-password.
6. Đổi mật khẩu kiểm tra mật khẩu cũ, cấm trùng; tăng authVersion, thu hồi mọi phiên và cấp phiên mới cho portal hiện tại trong transaction.
7. Refresh dùng token một lần; updateMany atomically đánh dấu usedAt. Replay thu hồi toàn bộ phiên. Giữ hạn 7 ngày ban đầu, không gia hạn vô tận.
8. Frontend gom các refresh trong một tab; Web Locks đồng bộ thao tác cookie giữa các tab cùng origin. Nếu browser không hỗ trợ Web Locks, chỉ có bảo vệ trong một tab; xung đột đa tab có thể yêu cầu đăng nhập lại.
9. Logout thu hồi phiên hiện tại trên server rồi xóa cookie và trạng thái UI. Thất bại mạng hiện lỗi, không giả báo đã đăng xuất.
10. Guard kiểm tra phiên/User/quyền trong DB trên mỗi API. UI cập nhật khi focus/tải lại hoặc mỗi 60 giây khi trang hiển thị.

## Tài khoản đầu tiên và phục hồi

### Keep me logged in

Login nhận rememberMe (boolean, mặc định false), lưu theo Session. Chọn: refresh cookie có Expires theo hạn phiên 7 ngày; không chọn: cookie phiên trình duyệt, backend vẫn giới hạn tối đa 7 ngày. Trình duyệt có chế độ khôi phục phiên có thể khôi phục cả session cookie; cần bấm Đăng xuất khi muốn kết thúc chắc chắn.
Refresh và đổi mật khẩu giữ lựa chọn rememberMe. Đăng xuất luôn thu hồi phiên và xóa cookie.
Hai web chỉ lưu username vào localStorage khi login thành công và có chọn checkbox. Sau logout form điền lại username; password/token không được lưu trong localStorage. Bỏ chọn xóa username đã lưu; storage bị chặn không làm hỏng đăng nhập.
Migration 202609150002_remember_login thêm Session.rememberMe default false. Phiên cũ chuyển sang session cookie ở lần refresh tiếp theo.

auth:bootstrap chỉ chạy khi database chưa có User. Tạo tên admin và mật khẩu ngẫu nhiên trong backend/.env.bootstrap, không ghi ra log hoặc đưa lên Git.
Chạy lại không ghi đè tài khoản có sẵn. Sau khi đổi mật khẩu, file bootstrap chỉ là thông tin khởi tạo cũ.
auth:reset-password là công cụ người vận hành có quyền truy cập backend: đọc backend/.env.reset (RESET_USERNAME/RESET_PASSWORD), reset và thu hồi phiên.
Đây không phải API reset công khai. Màn hình quản trị cấp/reset/khóa tài khoản là lát cắt tiếp theo.

## Triển khai

- Dùng HTTPS; NODE_ENV=production bật Secure cookie. Giữ web và API cùng site (ví dụ các subdomain của cùng domain) cho SameSite=Lax.
- CORS_ORIGINS liệt kê chính xác origin của hai web, không dùng wildcard; không lưu secret trong NEXT_PUBLIC_*.
- DATABASE_URL adapter hiện hỗ trợ host/port/user/password/database. Kết nối đang dùng MySQL cục bộ; TLS/CA cho database từ xa phải bổ sung trước triển khai từ xa.
- MySQL 8 có thể cần khóa RSA khi xác thực lại sau khởi động. Adapter cho phép lấy khóa từ server chỉ với host loopback (localhost/127.0.0.1/::1) và NODE_ENV khác production. Kết nối từ xa/production không bật tùy chọn này; cần TLS được xác minh hoặc khóa công khai được cấu hình tin cậy. Tham khảo [MariaDB connection options](https://mariadb.com/docs/connectors/mariadb-connector-nodejs/node-js-connection-options).
- Rate limit hiện theo IP, memory một tiến trình; trước nhiều instance cần shared store. Nếu có proxy, chốt trust-proxy chính xác trước để tránh lấy sai IP.
- Không cache API auth hoặc dữ liệu HRM nhạy cảm trong service worker tương lai.
- Chưa có quản lý thiết bị, dọn phiên tự động, nhật ký audit, 2FA hoặc kiểm thử tải.

## Tham khảo kỹ thuật

- [NestJS authentication](https://docs.nestjs.com/security/authentication)
- [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting)
- [Prisma MySQL](https://www.prisma.io/docs/orm/overview/databases/mysql)

Các thông số 15 phút/7 ngày/cost 12 là lựa chọn kỹ thuật của lần triển khai này, có thể điều chỉnh sau khi đo tải và chốt yêu cầu vận hành.
