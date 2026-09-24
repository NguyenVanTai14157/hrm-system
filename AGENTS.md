# 🛡️ BỘ NGUYÊN TẮC BẮT BUỘC CHO AI TRONG DỰ ÁN HRM (HRM-SYSTEM)

Mọi AI tham gia hỗ trợ dự án này PHẢI TUÂN THỦ 100% các nguyên tắc sau đây trong tất cả các phiên làm việc, không có ngoại lệ:

---

### 1. 🚫 CẤM TUYỆT ĐỐI GIT COMMIT & GIT PUSH
- **Không bao giờ** tự ý chạy các lệnh: `git commit`, `git push`, `git merge`, `git rebase` hoặc bất kỳ thao tác đẩy mã nguồn nào lên remote repository/host.
- Việc commit và push mã nguồn hoàn toàn thuộc quyền quản lý và quyết định của người dùng (chủ dự án).

---

### 2. 🗄️ BẢO VỆ DỮ LIỆU & CƠ SỞ DỮ LIỆU THỰC TẾ
- **Không tự ý xóa dữ liệu**: Tuyệt đối không chạy các lệnh có nguy cơ phá hủy như `DROP DATABASE`, `DROP TABLE`, `TRUNCATE` hoặc các câu lệnh `DELETE` bừa bãi không có lý do chính đáng.
- **Không tự ý chạy script fake dữ liệu test**: Tuyệt đối không âm thầm tạo script chèn dữ liệu mẫu/dữ liệu rác vào Database để đối phó.
- **Dữ liệu phải chuẩn xác**: Mọi chức năng (Chấm công, Nhân sự, Phân ca, Bảng lương, Đơn từ...) phải truy xuất và phản ánh đúng dữ liệu thực tế được lưu trong Database.

---

### 3. ⚙️ BẢO VỆ CẤU TRÚC HỆ THỐNG ĐANG HOẠT ĐỘNG
- Không đụng chạm, không xóa hoặc làm thay đổi các file cấu hình, các module đang chạy ổn định nếu không có yêu cầu cụ thể liên quan từ người dùng.
- Khi sửa lỗi, chỉ tập trung giải quyết đúng phạm vi và nguyên nhân lỗi, không làm xáo trộn kiến trúc chung.

---

### 4. 🎨 TIÊU CHUẨN GIAO DIỆN & TÍNH NĂNG
- Giữ vững chuẩn thiết kế giao diện theo phong cách **1Office** (bố cục header, menu, thẻ thông tin, màu sắc nhận diện, tương thích cả Web và Mobile).
- Loại bỏ triệt để các chuỗi địa chỉ/dữ liệu gán cứng (hardcode) trong code.

---

### 5. ✅ TIÊU CHUẨN KIỂM ĐỊNH (QUALITY ASSURANCE)
- **Thời điểm kiểm định**: Chạy kiểm định sau khi hoàn tất một nhóm thay đổi hoàn chỉnh, không chạy sau từng lần chỉnh file.
- **Phạm vi Typecheck**:
  - Chỉ sửa Backend: chạy `npm run typecheck` tại Backend đạt **0 lỗi**.
  - Chỉ sửa Admin-Web: chạy `npx tsc --noEmit` tại Admin-Web đạt **0 lỗi**.
  - Sửa cả hai hoặc thay đổi API/schema/kiểu dữ liệu dùng chung: bắt buộc chạy cả hai.
- **Kiểm thử nghiệp vụ (Logic Test)**:
  - Với logic nghiệp vụ trọng yếu (tính công, bảng lương, phân quyền, xóa dữ liệu...): bắt buộc chạy thêm kiểm thử cô lập liên quan.
  - Sửa giao diện đơn giản không bắt buộc viết kiểm thử tự động mới.
- **Tối ưu & Phát hành**:
  - Không chạy lại kiểm tra đã đạt nếu không có thay đổi hoặc phát hiện mới liên quan.
  - Trước khi phát hành vận hành: chạy đầy đủ kiểm định.
- **Báo cáo minh bạch**: Báo rõ đã chạy gì, kết quả và phần chưa kiểm tra; tuyệt đối không bỏ kiểm tra chỉ để báo hoàn thành nhanh.
