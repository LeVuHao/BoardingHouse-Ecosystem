# Prompt tích hợp giao diện TrọChuẩn vào project thật

Dán nguyên đoạn dưới đây cho AI coding agent của bạn (Claude Code, Cursor...) kèm
theo 3 file: `01_trang_chu.html`, `02_tim_phong.html`, `03_chi_tiet_phong.html`.

---

```
Tôi có 3 file HTML/CSS/JS tĩnh làm mẫu thiết kế cho 1 nền tảng thuê phòng trọ
(kiến trúc thật là microservices: auth-service, property-service, billing-service,
notification-service qua API Gateway + Eureka). Hãy đọc kỹ và chuyển thành các
trang/component trong project React của tôi theo đúng yêu cầu sau:

1. GIỮ NGUYÊN HỆ THỐNG THIẾT KẾ
   - Giữ nguyên toàn bộ biến màu trong khối :root (--ink, --accent, --bg, --border,
     --success, --pending...), font Manrope (heading) + Inter (body), bo góc,
     khoảng cách. Tách khối :root này thành 1 file CSS dùng chung
     (VD: styles/tokens.css), import 1 lần duy nhất ở entry point.
   - Không tự ý đổi màu/font/bo góc khi chuyển sang component — nếu cần thêm biến
     mới thì thêm vào file tokens, không hardcode giá trị rời trong component.

2. BA TRANG TƯƠNG ỨNG 3 FILE
   - 01_trang_chu.html  -> trang chủ (route "/")
   - 02_tim_phong.html  -> trang tìm kiếm/lọc phòng (route "/rooms"), bao gồm toàn
     bộ logic lọc/sắp xếp/phân trang/debounce 500ms đang viết bằng vanilla JS ở
     cuối file — chuyển thành state React (useState/useEffect), giữ nguyên tên
     biến/tham số filter (city, minPrice, maxPrice, minArea, maxArea, roomType,
     roommateOnly, amenities, sort, page).
   - 03_chi_tiet_phong.html -> trang chi tiết phòng (route "/rooms/:id"), gồm
     gallery ảnh, tab "Thông tin phòng" / "Ở ghép", modal gửi yêu cầu thuê / xin
     ở ghép.

3. NỐI API THẬT (thay cho mảng ROOMS mock trong các file)
   - Danh sách phòng:  GET /api/v1/rooms       (dùng RoomSpecification, JPA)
   - Chi tiết 1 phòng: GET /api/v1/rooms/{id}
   - Gửi yêu cầu thuê: POST /api/v1/rental-requests   { roomId, message }
   - Xin ở ghép:       POST /api/v1/join-requests      { roomId, message }
   Toàn bộ response đi qua Gateway nên bọc trong ApiResponse chuẩn — nhớ lấy
   field "data" thay vì dùng thẳng response.

4. XỬ LÝ RIÊNG CHO "XIN THAM GIA Ở GHÉP" — ĐỌC KỸ PHẦN NÀY
   Đây là chỗ có race condition thật ở backend (2 người bấm nút gần như cùng lúc
   cho cùng 1 chỗ trống). Yêu cầu xử lý ở property-service:
   - Dùng Redisson Distributed Lock quanh key "room:{roomId}:join" cho critical
     section kiểm tra currentOccupants < capacity.
   - Nếu còn chỗ: tạo JoinRequest trạng thái PENDING (chưa tăng occupants ngay,
     occupants chỉ tăng khi được duyệt).
   - Nếu hết chỗ: trả 409 CONFLICT.
   Phía FE: gọi API, xử lý đúng 2 nhánh 200/409 như comment đã ghi sẵn trong
   03_chi_tiet_phong.html (không tự suy luận còn chỗ hay không bằng cách so sánh
   occupants/capacity ở FE, vì dữ liệu FE luôn có thể trễ hơn BE).

5. TRẠNG THÁI PHÒNG
   Badge trạng thái (AVAILABLE / ROOMMATE_OPEN / FULL) lấy trực tiếp từ field
   `status` backend trả về, không tự tính lại ở FE.

6. ẢNH
   Hiện đang dùng ảnh mẫu từ picsum.photos (ảnh thật, chỉ để demo). Khi có
   FileStorageService thật (lưu tại ./uploads/rooms/), đổi các trường ảnh
   (thumbnailUrl / imgs) sang URL ảnh đã upload thật, giữ nguyên cấu trúc
   gallery/thumbnail đang có.

7. RESPONSIVE
   Cả 3 file đã có sẵn @media cho màn hình <900px — giữ nguyên breakpoint này
   khi chuyển sang CSS Modules / styled-components / Tailwind (tuỳ stack hiện
   tại của tôi), không cần thiết kế lại responsive từ đầu.

Sau khi xong, cho tôi xem cấu trúc thư mục/component bạn đã tạo trước khi
tiếp tục viết logic backend.
```

---

### Nếu AI agent hỏi bạn dùng framework/styling gì
Trả lời đúng theo project thật của bạn (React thường + CSS module, hay có dùng
Tailwind/MUI...). 3 file HTML trên viết bằng CSS thuần nên chuyển sang stack nào
cũng được — cứ nói rõ để AI agent không tự đoán sai và phá vỡ style.
