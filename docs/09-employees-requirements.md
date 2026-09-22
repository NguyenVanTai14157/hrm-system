# 09 — Nhân sự: phân tích yêu cầu tham khảo

Ngày: 2026-09-16. Nguồn: nội dung người dùng chuyển từ AI của hệ thống tham khảo. Chưa được kiểm chứng trực tiếp; nhãn “xác nhận thực tế” của nguồn không phải xác nhận của dự án này.
Trạng thái: người dùng đã đồng ý 4 ý phạm vi phiên bản đầu tiên ngày 2026-09-16. Nội dung nguồn bị ngắt ở bước 1 của kịch bản cuối.

## Thiết kế phiên bản đầu tiên được triển khai

- Mã nhập tay 1–50 ký tự Latin/số/dấu chấm/gạch, chuẩn hóa in hoa và unique. Họ tên bắt buộc; các trường khác không bắt buộc.
- Danh mục phẳng theo loại Phòng ban/Vị trí/Chức danh; mỗi hồ sơ liên kết tối đa một mục mỗi loại. Chưa khẳng định quan hệ cấp bậc/chi nhánh hoặc ràng buộc vị trí thuộc phòng ban nào. Đây là lựa chọn giới hạn cho MVP.
- Giới tính và trạng thái dùng mã nội bộ rõ nghĩa. 9 trạng thái theo danh sách tham khảo, mặc định WORKING; thử việc/chính thức không trộn vào trạng thái.
- Quyền employee.view/create/update và employee.catalog.manage. Phiên bản đầu đọc trên toàn công ty; chưa có quyền tự xem/sửa cá nhân.
- Không tự đặt unique email khi phạm vi chống trùng chưa chốt. Chưa lưu CCCD, lương, ngân hàng, bảo hiểm hoặc ảnh.
- Ngày sinh/ngày vào làm là ngày lịch (DATE); ngày sinh không ở tương lai. Chỉnh sửa có hiệu lực ngay; chưa lên lịch hoặc hồi tố quyết định nhân sự. Chuyển trạng thái bằng sửa hồ sơ có quyền, chưa có luồng duyệt.
- Quản lý trực tiếp là Employee đang WORKING khi gán mới, không bắt buộc có User. Cấm tự quản lý và vòng lặp quản lý; nghỉ việc không tự đổi quản lý của cấp dưới hoặc khóa tài khoản.
- Mọi lần tạo/sửa lưu snapshot trước/sau, người sửa và thời điểm trong cùng transaction. Version chống ghi đè khi hai người sửa đồng thời. Lịch sử chỉ đọc.
- Không có API DELETE. Danh mục có thể ngừng sử dụng; hồ sơ đã gán vẫn giữ liên kết và tên được lưu trong lịch sử.
- API: GET/POST /employees, GET/PATCH /employees/:id, GET /employees/:id/history; GET/POST /employee-catalogs, PATCH /employee-catalogs/:id. Phân trang tối đa 100.
- Seed quyền mới vào các role đã có system.manage, không hard-code tên role; tài khoản thường không tự nhận quyền nhân sự.

## Nội dung đã thu thập

- Danh sách có nhóm Đang làm việc, Chờ nhận việc, Nghỉ tạm thời, Nghỉ việc, Tất cả.
- Tìm kiếm họ tên/mã/SĐT/email; lọc đơn vị, trạng thái, vị trí, ngày vào làm và các thuộc tính mở rộng.
- Hồ sơ chia thông tin chung, công việc, liên hệ, lương/phụ cấp, hợp đồng/bảo hiểm và hồ sơ cá nhân khác.
- Theo nguồn, tối thiểu họ tên và mã nhân sự; mã nhập hoặc sinh tự động, duy nhất toàn hệ thống.
- Một đơn vị chính, một vị trí chính; có thể kiêm nhiệm. Quản lý trực tiếp phục vụ luồng duyệt sau này.
- Nguồn liệt kê 9 trạng thái: chờ nhận việc, đang làm, nghỉ tạm thời, thai sản, nghỉ không lương dài hạn, nghĩa vụ quân sự, đi học, ốm đau, nghỉ việc.
- Điều chuyển có thể qua quyết định hoặc sửa hồ sơ; cần lưu lịch sử và ngày hiệu lực.
- Cấp tài khoản từ hồ sơ; sửa hồ sơ cá nhân và quyền xem dữ liệu nhạy cảm cần cơ chế riêng.
- Import/export, quyết định, hợp đồng, lịch sử lương và bảo hiểm là các chức năng liên quan, không mặc định triển khai cùng CRUD hồ sơ đầu tiên.

## Những điểm chưa đủ rõ

1. Phạm vi quyền chỉ được mô tả là khả năng chung; chưa có ma trận actor/action/data-scope của dự án.
2. Chống trùng email/CCCD: “đang làm việc” có tính cả chờ nhận việc hoặc nghỉ tạm thời không? Khi tái tuyển dụng và trùng hồ sơ cũ thì xử lý thế nào? Không suy luận từ tên cờ cấu hình.
3. Chín trạng thái không có thử việc/chính thức. Cần tách tình trạng làm việc khỏi giai đoạn thử việc/loại hợp đồng, không tự thêm enum trộn lẫn.
4. Chưa có bảng chuyển trạng thái, ngày hiệu lực tương lai, điều chuyển hồi tố và quy tắc sửa lịch sử.
5. Tự sửa hồ sơ được bật theo nguồn, nhưng chưa xác nhận doanh nghiệp có bắt buộc duyệt hay không và trường nào sửa trực tiếp.
6. Cây tổ chức/phòng ban/vị trí/chức danh và quan hệ kiêm nhiệm chưa đủ cardinality để tạo schema. Không tự suy ra vị trí chỉ thuộc một phòng ban.
7. Kiểm tra dữ liệu liên kết trước xóa mới là mô tả khả năng chung. Chưa chốt chính sách xóa/lưu trữ của dự án.
8. “Tuổi = năm hiện tại - năm sinh” là cách nguồn mô tả; nếu hiển thị tuổi đủ cần tính theo ngày sinh thực tế, không lưu cột tuổi cố định.
9. Tên mã như WAITTING hoặc các field của nguồn chỉ là tham khảo, không bắt buộc sao chép vào API nội bộ.

## Phạm vi phiên bản đầu tiên đề xuất

- Admin/HR có permission tương ứng: danh sách, tìm kiếm/lọc/phân trang, tạo, xem chi tiết, sửa hồ sơ cơ bản.
- Trường ban đầu: mã, họ tên, giới tính, ngày sinh, email, SĐT, địa chỉ, đơn vị chính, vị trí/chức danh, quản lý trực tiếp, ngày vào làm, trạng thái làm việc.
- Danh mục tổ chức và vị trí cần đủ để chọn trong form; quan hệ phải chốt trước migration.
- Ghi người sửa/thời điểm; các thay đổi công việc cần lịch sử trước khi hỗ trợ điều chuyển/nghỉ việc thực tế.
- Chưa đưa lương, ngân hàng, bảo hiểm, CCCD/hộ chiếu, gia đình, file đính kèm, import/export, quyết định và kiêm nhiệm vào đợt đầu. Đây là đề xuất chia giai đoạn, chưa phải loại khỏi phạm vi HRM cuối cùng.
- Giữ quyết định đã chốt: trạng thái nhân sự và khóa tài khoản là hai thao tác riêng; không tự khóa khi nghỉ việc.

## Bốn điểm đã được người dùng chốt

- Đồng ý phạm vi phiên bản đầu tiên hay cần thêm mục nào ngay?
- Mã nhân sự nhập tay trước hay sinh tự động theo quy tắc nào?
- Phạm vi dữ liệu đợt đầu: chỉ người có quyền quản lý xem toàn công ty, hay cần cá nhân/phòng ban/chi nhánh ngay?
- Chính sách xóa đợt đầu: không xóa cứng, chỉ chuyển trạng thái/lưu lịch sử, hay có trường hợp được xóa?

Người dùng đã đồng ý: MVP cơ bản, mã nhập tay, quyền xem toàn công ty cho người có permission, không xóa cứng. Bản triển khai theo mục thiết kế đầu file; hướng dẫn và giới hạn tại [10-employees-mvp.md](10-employees-mvp.md). Không triển khai cả 8 module từ mô tả tham khảo này.
