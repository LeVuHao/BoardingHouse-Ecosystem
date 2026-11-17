# 📱 ROOMILY MOBILE APP (REACT NATIVE / EXPO)

Dự án ứng dụng di động cho nền tảng quản lý phòng trọ sinh viên **Roomily**.

---

## 🛠️ PHÂN HỆ DO VÕ GIA HUY PHỤ TRÁCH (ĐÃ HOÀN THÀNH 100% GIAO DIỆN)

Huy đã xây dựng hoàn chỉnh toàn bộ giao diện và tương tác cho phân hệ **Khám phá phòng trọ & Thuê phòng**:

1. **`src/components/RoomCard.js`**: Card phòng trọ chuẩn Airbnb/Chợ Tốt (ảnh, giá nổi bật, diện tích, sức chứa, địa chỉ, badge "Còn phòng" / "Tìm ở ghép", badge "Đã xác minh").
2. **`src/screens/rooms/RoomListScreen.js`**:
   - Thanh tìm kiếm theo khu vực, trường ĐH (PTIT, HUTECH...).
   - Bộ lọc giá dạng Chip ngang: Tất cả, Dưới 2 triệu, 2-4 triệu, Trên 4 triệu.
   - Bộ lọc theo Quận/Huyện: TP. Thủ Đức, Bình Thạnh, Quận 10...
   - Kéo xuống để Refresh (Pull to refresh).
   - Tự động fallback sang Mock Data nếu Backend chưa bật.
3. **`src/screens/rooms/RoomDetailScreen.js`**:
   - Album ảnh trượt Carousel kèm dải ảnh thumbnail chọn nhanh.
   - Bảng thông số: Diện tích, Tiền cọc, Sức chứa.
   - Bảng biểu phí điện nước: Giá điện, giá nước, internet.
   - Danh sách tiện ích có sẵn (máy lạnh, wifi, gác lửng, camera...).
   - Khối liên hệ Chủ trọ (có nút gọi điện trực tiếp).
   - Thanh cố định dưới cùng và Modal "Gửi Yêu Cầu Thuê Phòng" (`POST /rental/requests`).
4. **`src/screens/rooms/MyContractsScreen.js`**:
   - Màn hình "Trọ của tôi / Hợp đồng của tôi" (`GET /contracts/my`).
   - Hiển thị phòng đang thuê, ngày duyệt, số tiền cọc.
   - Khối hóa đơn tháng tích hợp sẵn nút "Thanh toán VietQR".
5. **`App.js`**: Đã dựng sẵn Bottom Tab Navigator (5 tab: Khám phá, Trọ của tôi, Ở ghép, Hóa đơn, Tài khoản) và Stack Navigator kết nối mượt mà giữa các màn hình.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### 1. Cài đặt thư viện:
Mở terminal tại thư mục `mobile`:
```bash
cd mobile
npm install
```

### 2. Cấu hình IP máy tính:
Mở file `src/constants/config.js`, đổi `DEV_LAN_IP` thành IP Wi-Fi của máy (xem bằng lệnh `ipconfig` trên Windows):
```javascript
export const DEV_LAN_IP = '192.168.100.62'; // Thay bằng IP của bạn
```

### 3. Khởi chạy app:
```bash
npm start
```
- Mở ứng dụng **Expo Go** trên điện thoại (tải miễn phí trên App Store / Google Play).
- Quét mã QR hiển thị trên màn hình terminal để trải nghiệm trực tiếp app trên điện thoại thật!
