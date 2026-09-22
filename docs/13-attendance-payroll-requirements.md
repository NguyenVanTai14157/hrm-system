# 13 - Chấm công & Bảng lương: Phân tích yêu cầu tham khảo (Hadibeauty)

Ngày: 2026-09-17. Nguồn: Nội dung trích xuất từ hệ thống AI tham khảo.

## 1. Nhân sự và Tài khoản
- **Trình tự:** Bắt buộc tạo Hồ sơ nhân sự trước, sau đó kích hoạt Tài khoản người dùng.
- **Phòng ban:** Nhân viên có 1 phòng ban chính, có thể có nhiều phòng ban kiêm nhiệm. Hỗ trợ "tách dòng" (break rule) nếu điều chuyển giữa tháng.
- **Đầu vào thiết yếu:** Để phân ca cần (Mã NV, Họ tên, Phòng ban, Vị trí). Để tính lương cần thêm (Lương cơ bản, Phụ cấp, Loại hợp đồng, Ngày vào làm).

## 2. Ca làm việc và Chấm công GPS
- **Loại ca:** Hỗ trợ ca hành chính (Back Office) và ca xoay (Front Office). Có ca qua đêm, ca gãy, nhiều ca 1 ngày.
- **Phân ca:** Quản lý tạo bảng phân ca. Nhân viên có thể tạo đơn Đổi ca/Đăng ký ca.
- **GPS:** Gắn với 4 địa điểm thực tế (14 Lê Duy Đình, 126 Phan Thanh, 108 NV Thoại, 93 Phan Đăng Lưu). Bán kính cấu hình ẩn trên app mobile.
- **Quy tắc chốt:** 2 lần chấm/ca (In/Out). Đi trễ/về sớm tự tính ra phút. Thiếu chấm công phải làm Đơn bổ sung. Làm thêm phải làm Đơn OT.

## 3. Đơn từ và Phê duyệt
- **Loại đơn MVP:** Đơn xin nghỉ, Đơn làm thêm, Đơn tăng ca, Đơn check in/out, Đơn đăng ký/đổi ca.
- **Người duyệt:** Quản lý trực tiếp (bước 1), Trưởng bộ phận / HR (bước 2).
- **Tác động:** Đơn duyệt xong tự động trừ phép, bù công, cộng giờ OT vào bảng công. Nếu bảng công đã chốt (Locked) thì không tự động cập nhật trừ khi Mở chốt.

## 4. Chốt bảng chấm công
- **Kỳ công:** 1 -> 31 hàng tháng.
- **Xử lý:** HR kiểm tra báo cáo trễ/sớm và tab đơn từ chờ duyệt trước khi chốt. Vẫn cho phép chốt nếu còn đơn chưa duyệt (sẽ ghi nhận là thiếu công). Hỗ trợ sửa công bằng tay trên bảng công.

## 5. Bảng lương (Payroll)
- **Danh sách bảng lương:** 6 mẫu (NVBH, Thu ngân, Kho, Marketing, Quản lý cửa hàng, Văn phòng). Lấy dữ liệu tự động từ Bảng công toàn công ty.
- **Công thức:** Gắn theo "Loại bảng lương" (dành cho một tập hợp vị trí/phòng ban), không gắn lẻ từng cá nhân.
- **Dữ liệu đầu vào:** Lương CB/Phụ cấp (từ Hồ sơ), Ngày công/OT (từ Bảng công), Ứng lương/Thưởng (từ file Import hoặc nhập tay).
- **Quy trình:** Admin chọn Tháng -> Chọn Bảng lương -> Chọn Bảng công -> Tạo -> (Hệ thống tính toán ra Draft) -> Duyệt/Chốt -> Gửi Payslip.

## 6. Minh họa chu trình 1 tháng
- *Đầu tháng:* Phân ca xoay (Ca sáng 8h-16h) cho NV.
- *Trong tháng:* Chấm công bằng GPS trên Mobile.
- *Ngoại lệ:* Gửi Đơn xin nghỉ phép 1 ngày -> Được duyệt.
- *Cuối tháng:* Bảng công chốt 25 công đi làm + 1 công phép = 26 công.
- *Tính lương:* (Lương CB + Phụ cấp) / 26 * 26 = Thực nhận. Gửi Payslip.
