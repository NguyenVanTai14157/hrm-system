# 11 — Đơn từ: Phân tích yêu cầu tham khảo

Ngày: 2026-09-17. Nguồn: nội dung người dùng cung cấp từ AI của hệ thống tham khảo.

## 1. Các loại đơn hỗ trợ (Application Types) & Trường bắt buộc

Hệ thống hỗ trợ 10 loại đơn từ chuẩn phục vụ công tác chấm công và nhân sự:

| Tên loại đơn | Mã đối tượng | Mục đích | Các trường bắt buộc |
| --- | --- | --- | --- |
| **Đơn xin nghỉ** | `approval-leave-leave` | Nghỉ cả ca, nhiều ngày, phép năm, ốm đau... | Lý do nghỉ, Mô tả, Danh sách ca nghỉ (Từ ngày, Đến ngày, Ca bắt đầu/kết thúc) |
| **Đơn vắng mặt** | `approval-absence-absence` | Đi trễ / Về sớm / Ra ngoài giữa giờ | Chi tiết vắng mặt (Ngày vắng, Từ giờ, Đến giờ, Lý do) |
| **Đơn check in/out** | `approval-inout-inout` | Bổ sung giờ chốt khi quên/máy lỗi | Mô tả, Chi tiết chốt (Ngày chốt, Giờ chốt, Lý do) |
| **Đơn làm thêm (OT)**| `approval-overtime-overtime`| Làm thêm ngoài giờ | Thời gian (Từ ngày/giờ - Đến ngày/giờ), Kiểu (Tính công/Nghỉ bù), Mô tả |
| **Đơn đổi ca** | `approval-shiftchange-shiftchange`| Đổi ca/đổi người làm | Ngày đổi, Ca hiện tại, Ca muốn đổi, Nhân sự đổi cùng |
| **Đơn tăng ca** | `approval-shiftmore-shiftmore` | Đăng ký làm thêm ca trong ngày | Ngày làm, Ca tăng cường |
| **Đơn đăng ký ca** | `approval-shiftregister-shiftregister`| Đăng ký lịch làm việc tuần/tháng | Danh sách ca đăng ký theo ngày |
| **Đơn công tác** | `approval-mission-mission` | Đi công tác | Thời gian, Địa điểm, Mục đích, Phương tiện |
| **Đơn làm theo chế độ**| `approval-worktime-worktime`| Chế độ con nhỏ, thai sản | Loại chế độ, Thời gian áp dụng |
| **Đơn thôi việc** | `approval-resign-resign` | Nghỉ việc | Ngày dự kiến nghỉ, Lý do, Ý kiến bàn giao |

## 2. Quy trình duyệt (Approval Workflow)

- Cột "Approval step" thể hiện tiến trình hiện tại của đơn (VD: Bước 1/2: Quản lý trực tiếp).
- **Cơ chế thiết lập**: Hoàn toàn linh hoạt (định nghĩa trong phân hệ `workflow-approvals-approval`).
- Cho phép duyệt theo cấp bậc (VD: Quản lý trực tiếp) hoặc theo đích danh tài khoản.
- Cơ chế: Đồng thời (AND) hoặc Song song (OR).
- Quy tắc quá hạn: Tự động duyệt, Tự động từ chối, hoặc Chuyển tiếp người thay thế.

## 3. Trạng thái đơn từ (Statuses)

- **WAITING**: Đơn mới gửi, chờ bước duyệt đầu tiên.
- **APPROVING**: Đã duyệt bước trước, chờ bước kế tiếp.
- **APPROVED**: Đã hoàn tất các bước duyệt (có hiệu lực).
- **NO_APPROVED**: Bị từ chối ở một bước bất kỳ.
- **CANCELED**: Người tạo chủ động hủy khi chưa duyệt xong.

**Tab "No Approver"**:
- Xảy ra khi: Đơn yêu cầu quản lý duyệt nhưng hồ sơ nhân sự trống `live_manager_id`, hoặc người duyệt bị khóa/chuyển công tác.
- Giải quyết: Admin/HR duyệt thay, hoặc chỉ định lại, và cập nhật lại `live_manager_id` trong hồ sơ nhân sự để giải quyết triệt để.

## 4. Phân quyền và Phạm vi dữ liệu (Permissions)

- **Nhân viên thông thường**: Chỉ xem/sửa đơn của chính mình.
- **Quản lý cấp trung**: Xem danh sách đơn của nhân sự thuộc phòng ban/chi nhánh quản lý. Được duyệt/không duyệt/chuyển tiếp/yêu cầu giải trình.
- **Admin/HR**: Xem toàn bộ đơn. Có quyền duyệt thay, hoàn duyệt, hủy đơn, xuất báo cáo.
- **Hủy đơn**: Nhân viên được tự hủy đơn nếu đơn đang ở trạng thái `WAITING`.

## 5. Tự động liên kết dữ liệu (Integration)

Khi đơn ở trạng thái **APPROVED**, hệ thống tự động cập nhật vào Bảng chấm công / lương:
- **Đơn xin nghỉ**: Trừ quỹ phép năm, ghi nhận ký hiệu LEAVE.
- **Đơn vắng mặt**: Bù trừ thời gian đi muộn/về sớm (không bị tính LATE_MINUTE).
- **Đơn check in/out**: Bổ sung mốc giờ vào/ra thực tế.
- **Đơn làm thêm**: Kết xuất số giờ tăng ca (HOUR_OVERTIME) để tính tiền.
