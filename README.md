# 🏠 Roomily - Microservices Boarding House & Roommate Finding Platform

[![Java](https://img.shields.io/badge/Java-17%2B-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.0-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring Cloud](https://img.shields.io/badge/Spring_Cloud-2023.0.0-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-cloud)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.12-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

> **Roomily** là nền tảng trung gian kết nối thuê phòng trọ, quản lý cư dân và tìm người ở ghép trực tuyến xây dựng theo kiến trúc **Microservices (Database-per-Service)** chuẩn enterprise. Hệ thống giải quyết trọn vẹn bài toán minh bạch thông tin bất động sản cho thuê, kiểm soát tranh chấp chỗ ở với **Redis Distributed Lock (Redisson)**, đối soát thanh toán tự động qua **VietQR SePay Webhook**, và tích hợp tương tác cộng đồng thời gian thực với **RabbitMQ Event-Driven Architecture**.

---

## 📑 Mục Lục (Table of Contents)

1. [Tổng Quan Nghiệp Vụ & Đối Tượng Sử Dụng](#-1-tổng-quan-nghiệp-vụ--đối-tượng-sử-dụng)
2. [Kiến Trúc Hệ Thống (System Architecture)](#-2-kiến-trúc-hệ-thống-system-architecture)
3. [Danh Sách Microservices & Cổng Dịch Vụ](#-3-danh-sách-microservices--cổng-dịch-vụ)
4. [Phân Tích Chi Tiết Logic Nghiệp Vụ Từng Module](#-4-phân-tích-chi-tiết-logic-nghiệp-vụ-từng-module)
   - [4.1. Xác thực & Phân quyền (Auth & RBAC)](#41-xác-thực--phân-quyền-auth--rbac)
   - [4.2. Quản lý Bất động sản & Tìm kiếm Bản đồ (Property & Search)](#42-quản-lý-bất-động-sản--tìm-kiếm-bản-đồ-property--search)
   - [4.3. Tìm Người Ở Ghép & Khóa Phân Tán Redisson (Roommate & Concurrency)](#43-tìm-người-ở-ghép--khóa-phân-tán-redisson-roommate--concurrency)
   - [4.4. Diễn đàn Cộng đồng, Nhắn tin & Báo hỏng (Forum & Maintenance)](#44-diễn-đàn-cộng-đồng-nhắn-tin--báo-hỏng-forum--maintenance)
   - [4.5. Hóa Đơn & Cổng Thanh Toán Tự Động VietQR SePay](#45-hóa-đơn--cổng-thanh-toán-tự-động-vietqr-sepay)
   - [4.6. Kiến Trúc Hướng Sự Kiện (Event-Driven với RabbitMQ)](#46-kiến-trúc-hướng-sự-kiện-event-driven-với-rabbitmq)
5. [Thiết Kế Cơ Sở Dữ Liệu (Database-per-Service)](#-5-thiết-kế-cơ-sở-dữ-liệu-database-per-service)
6. [API Gateway Routing & Security Filter](#-6-api-gateway-routing--security-filter)
7. [Hướng Dẫn Khởi Chạy Hệ Thống (Deployment & Local Setup)](#-7-hướng-dẫn-khởi-chạy-hệ-thống-deployment--local-setup)
   - [Khởi chạy tự động với Docker Compose](#71-khởi-chạy-toàn-bộ-bằng-docker-compose-khuyên-dùng)
   - [Khởi chạy thủ công từng Service (Dev Mode)](#72-khởi-chạy-thủ-công-development-mode)
   - [Cấu hình Triển khai Vercel (Frontend)](#73-cấu-hình-triển-khai-frontend-lên-vercel)
8. [Cấu Trúc Thư Mục Dự Án (Project Structure)](#-8-cấu-trúc-thư-mục-dự-án-project-structure)
9. [Bản Quyền & Tác Quyền](#-9-bản-quyền--tác-quyền)

---

## 🎯 1. Tổng Quan Nghiệp Vụ & Đối Tượng Sử Dụng

Website được định vị là **sàn kết nối & quản lý phòng trọ chuyên biệt**, giải quyết 3 bài toán lớn:
1. **Minh bạch hóa thông tin trọ:** Khách thuê không phải tìm kiếm phòng qua các hội nhóm rủi ro; có thể tìm kiếm theo 24 quận/huyện TP.HCM, xem tiện ích xung quanh (trường đại học, bệnh viện), định vị tọa độ GPS trên bản đồ OpenStreetMap (Leaflet).
2. **Tối ưu chi phí ở ghép:** Giảm thiểu lãng phí chỗ ở khi phòng còn trống sức chứa. Hệ thống thiết lập cơ chế **chủ trọ là người duy nhất được kích hoạt tìm người ở ghép** sau khi đã xác thực người thuê đầu tiên, gắn nhãn trạng thái trực quan và quản lý minh bạch danh tính cư dân.
3. **Quản lý trọ & Vận hành không giấy tờ:** Chủ trọ quản lý khu trọ, tiếp nhận yêu cầu, xuất hóa đơn tháng, theo dõi lịch sử nộp tiền; Cư dân theo dõi hợp đồng, báo cáo sự cố hư hỏng (Maintenance Tickets), và gửi đánh giá 5 sao.

### Ba Nhóm Đối Tượng (Roles):
* **Cư dân / Người thuê (`USER`):** Tìm kiếm phòng trọ, gửi yêu cầu thuê phòng/ở ghép, theo dõi hợp đồng thuê đang hiệu lực, nhận hóa đơn tiền nhà định kỳ, quét mã VietQR tự động, tạo phiếu báo hỏng hóc thiết bị, đánh giá phòng trọ.
* **Chủ trọ (`LANDLORD`):** Đăng ký nâng cấp tài khoản, tạo/quản lý khu trọ & phòng trọ, tạo tin đăng diễn đàn, duyệt/từ chối yêu cầu thuê phòng và ở ghép, lập hóa đơn tiền phòng/điện/nước hàng tháng, tiếp nhận và xử lý sự cố báo hỏng.
* **Quản trị viên (`ADMIN`):** Quản lý toàn bộ danh sách người dùng, kiểm duyệt bài đăng diễn đàn, phê duyệt đơn đăng ký chủ trọ, xem nhật ký kiểm toán hệ thống (Audit Logs), theo dõi báo cáo vi phạm (Reports).

---

## 🏛️ 2. Kiến Trúc Hệ Thống (System Architecture)

Dự án áp dụng mô hình **Microservices Architecture** với các nguyên tắc cốt lõi:
* **Database-per-Service:** Mỗi nghiệp vụ quản lý cơ sở dữ liệu riêng biệt, không chia sẻ database tầng persistence.
* **API Gateway Pattern:** Cổng vào duy nhất tiếp nhận request từ Web & Mobile, phân giải JWT token, gắn headers định danh và điều hướng (routing) tới các service nội bộ.
* **Service Discovery:** Sử dụng Eureka Server để đăng ký và tự động khám phá vị trí các service.
* **Event-Driven Communication:** Sử dụng RabbitMQ để truyền tải thông điệp bất đồng bộ (notifications, event hooks).
* **Distributed Concurrency Lock:** Sử dụng Redisson (Redis Lock) giải quyết race condition tranh chấp giữ chỗ khi thuê phòng và duyệt ở ghép.

```
                                  +---------------------------------------+
                                  |         React Frontend (Vite)         |
                                  |    Deployed on Vercel / Port 5173     |
                                  +-------------------+-------------------+
                                                      |
                                             HTTP / HTTPS (REST API)
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |       Spring Cloud API Gateway        |
                                  |              (Port 8080)              |
                                  |  - JWT Authentication & RBAC Filter   |
                                  |  - Dynamic Route Dispatching          |
                                  |  - CORS & Global Rate Limiting        |
                                  +-------------------+-------------------+
                                                      |
              +-----------------------+---------------+-----------------------+-----------------------+
              |                       |                                       |                       |
              v                       v                                       v                       v
    +-------------------+   +--------------------+                  +--------------------+  +--------------------+
    |   Auth Service    |   |  Property & Rental |                  | Billing & Payment  |  |Notification Service|
    |    (Port 8081)    |   |     (Port 8082)    |                  |    (Port 8083)     |  |    (Port 8084)     |
    | - JWT / OAuth2    |   | - Properties/Rooms |                  | - Bills Management |  | - RabbitMQ Consumer|
    | - Audit Logging   |   | - Concurrency Lock |                  | - VietQR SePay API |  | - Notification Log |
    | - Landlord Reg    |   | - Forum & Messages |                  | - Webhook Handling |  | - Realtime Alerts  |
    +---------+---------+   +---------+----------+                  +---------+----------+  +---------+----------+
              |                       |                                       |                       |
              v                       v                                       v                       v
        [( MySQL:            [( MySQL:                               [( MySQL:               [( MySQL:
          db_auth )]            db_property_rental )]                   db_billing_payment )]   db_notification )]
              |                       |                                       |                       |
              +-----------------------+-------------------+-------------------+-----------------------+
                                                          |
                                      +-------------------+-------------------+
                                      |                                       |
                                      v                                       v
                           +----------------------+               +----------------------+
                           |  Redis (Port 6379)   |               | RabbitMQ (Port 5672) |
                           | - Redisson Lock      |               | - payment.exchange   |
                           | - Cache Layer        |               | - notification.exch  |
                           +----------------------+               +----------------------+
```

---

## 📦 3. Danh Sách Microservices & Cổng Dịch Vụ

| Tên Dịch Vụ | Module Directory | Port | Cơ Sở Dữ Liệu | Công Nghệ Chính |
| :--- | :--- | :---: | :--- | :--- |
| **Eureka Discovery Server** | `/eureka-server` | `8761` | *N/A (In-memory)* | Spring Cloud Netflix Eureka Server |
| **API Gateway** | `/api-gateway` | `8080` | *N/A* | Spring Cloud Gateway, Reactive WebFlux, JJWT |
| **Auth Service** | `/auth-service` | `8081` | `db_auth` | Spring Boot 3, Spring Security, JPA, BCrypt, Mail |
| **Property & Rental Service** | `/property-rental-service` | `8082` | `db_property_rental` | Spring Boot 3, JPA, Redisson 3.24, Leaflet Geo |
| **Billing & Payment Service** | `/billing-payment-service` | `8083` | `db_billing_payment` | Spring Boot 3, JPA, SePay Open API, RabbitMQ |
| **Notification Service** | `/notification-service` | `8084` | `db_notification` | Spring Boot 3, Spring AMQP (RabbitMQ Consumer) |
| **Frontend Web App** | `/frontend` | `5173` | *Browser Storage* | React 19, Vite, TailwindCSS, Lucide, Leaflet |

---

## 🔍 4. Phân Tích Chi Tiết Logic Nghiệp Vụ Từng Module

### 4.1. Xác thực & Phân quyền (Auth & RBAC)
* **Luồng Đăng nhập / Đăng ký:**
  - Hỗ trợ tài khoản thông thường (mật khẩu mã hóa BCrypt) và Google OAuth2 (xác thực token qua `GoogleTokenVerifier`).
  - Cung cấp tính năng Quên mật khẩu qua email: Tạo mã xác nhận OTP 6 chữ số ngẫu nhiên lưu tại `verification_codes` với thời gian hết hạn 10 phút.
* **Cơ chế Token & Context:**
  - Token chuẩn JWT HMAC-SHA256 chứa `sub` (userId), `role`, `email`.
  - Tại API Gateway, `AuthenticationFilter` xác thực chữ ký token, bóc tách claims và inject vào header nội bộ: `X-User-Id`, `X-User-Role`, `X-User-Email` trước khi chuyển tiếp vào các microservices.
* **Nâng cấp & Duyệt Chủ trọ (Landlord Onboarding):**
  - Người dùng gửi yêu cầu nâng cấp (`CreateLandlordApplicationRequest`).
  - Hệ thống sinh mã thanh toán định danh duy nhất (`SEPAYLL<timestamp><random>`) và mã VietQR tương ứng (phí kích hoạt 5.000 đ).
  - Hỗ trợ 2 luồng duyệt:
    1. Tự động qua Webhook SePay khi nhận được tiền.
    2. Quản trị viên duyệt thủ công trên trang `/admin/landlord-requests`.
* **Kiểm toán Hoạt động (Audit Log):** Mọi hành động quan trọng (Đăng nhập, Nâng cấp quyền, Khóa tài khoản) đều được ghi nhận vào bảng `audit_logs` phục vụ tra soát bảo mật.

---

### 4.2. Quản lý Bất động sản & Tìm kiếm Bản đồ (Property & Search)
* **Khu trọ (`Property`) & Phòng trọ (`Room`):**
  - Một khu trọ bao gồm: Tên, địa chỉ chi tiết (Thành phố, Quận/Huyện, Phường/Xã), tọa độ địa lý (`latitude`, `longitude`), danh sách tiện ích (`amenities`).
  - Phòng trọ liên kết với khu trọ: Mã phòng tự động (`MP-<id>`), diện tích, giá thuê cơ bản, tiền cọc, sức chứa tối đa (`capacity`), trạng thái (`AVAILABLE`, `RENTED`, `FULL`).
* **Bộ lọc Tìm kiếm Địa điểm Thông minh:**
  - Hỗ trợ danh sách gợi ý 24 quận/huyện TP.HCM, các trường Đại học trọng điểm (ĐHQG, Bách Khoa, Kinh Tế, KHTN, Sư Phạm Kỹ Thuật, FPT...) kết hợp với địa điểm thực tế trích xuất động từ database.
  - Xử lý logic từ khóa *"Tất cả khu vực"*, *"Tất cả"*, *"all"* để xóa bỏ điều kiện lọc địa phương khi người dùng muốn duyệt toàn bộ phòng trống.
  - Tích hợp bản đồ trực quan **OpenStreetMap / Leaflet**: Marker tương tác hiển thị giá phòng và điều hướng xem nhanh.

---

### 4.3. Tìm Người Ở Ghép & Khóa Phân Tán Redisson (Roommate & Concurrency)

#### Nghiệp vụ Siết chặt Ràng buộc Ở Ghép:
* Chỉ phòng **đã có người thuê chính thức** (hợp đồng `ACTIVE`) mới được phép tìm người ở ghép.
* **Chỉ Chủ trọ (`LANDLORD`)** mới có quyền cấu hình mở/đóng tìm người ở ghép cho phòng đó trên bài đăng diễn đàn. Khi bật, phòng hiển thị huy hiệu nhấp nháy: `🔴 ĐÃ CÓ NGƯỜI THUÊ (Tìm người ở ghép)`.
* Người tìm ở ghép gửi form đăng ký: Chọn số lượng người muốn ghép, xem tiêu chí bắt buộc của chủ trọ, cam kết nội quy và gửi yêu cầu.
* Khi chủ trọ bấm duyệt người ở ghép:
  - Hệ thống tự động tạo hợp đồng và phân quyền cư dân đầy đủ (`isStaying=true`).
  - Tự động chia đều giá phòng theo số lượng người thực tế đang ở.
  - Cập nhật số chỗ còn lại; tự động tắt chế độ tìm ở ghép khi phòng đã đạt sức chứa tối đa (`currentStay == capacity`).
  - Người ở ghép được cấp đầy đủ quyền hạn như người thuê chính: xem thông tin phòng, liên hệ chủ trọ, báo cáo hỏng hóc thiết bị và viết đánh giá.

#### Cơ chế Chống Tranh Chỗ Phân Tán (Redis Lock / Redisson):
Trong môi trường microservices nhiều instance, việc nhiều người cùng xin vào ở 1 vị trí trống cuối cùng dễ dẫn đến **Race Condition (Overbooking)**. Roomily giải quyết triệt để bằng khóa phân tán:

```java
// Logic khóa phân tán tại RentalRequestService.java
String lockKey = "lock:room:approve:" + room.getId();
RLock lock = redissonClient.getLock(lockKey);
try {
    // Chờ tối đa 5s để lấy lock, tự động giải phóng sau 10s tránh deadlock
    boolean isLocked = lock.tryLock(5, 10, TimeUnit.SECONDS);
    if (!isLocked) {
        throw new BadRequestException("Phòng đang được xử lý bởi yêu cầu khác, vui lòng thử lại sau!");
    }
    // Thực hiện kiểm tra sức chứa (Atomic) & Cập nhật trạng thái
    validateCapacityAndApprove(request, room);
} finally {
    if (lock.isHeldByCurrentThread()) {
        lock.unlock();
    }
}
```

---

### 4.4. Diễn đàn Cộng đồng, Nhắn tin & Báo hỏng (Forum & Maintenance)
* **Diễn đàn phòng trọ (`ForumPost`):**
  - Chủ trọ đăng bài giới thiệu phòng kèm bộ sưu tập ảnh, giá cả, nội quy.
  - Kiểm duyệt 3 trạng thái: `PENDING` -> `APPROVED` / `REJECTED` bởi Quản trị viên.
  - Tính năng tự động quét các tiện ích xung quanh (Bệnh viện, Trạm xe buýt, Siêu thị, Trường học) trong bán kính lân cận.
* **Hộp thư Liên hệ (`ForumMessage`):** Khách tìm trọ có thể gửi tin nhắn trực tiếp đến chủ trọ từ bài viết để thỏa thuận trước khi gửi yêu cầu thuê chính thức.
* **Phiếu Báo Hỏng Thiết Bị (`MaintenanceTicket`):**
  - Cư dân tạo yêu cầu sửa chữa (Điện, nước, điều hòa, khóa cửa...) kèm mức độ khẩn cấp (`URGENT`, `HIGH`, `NORMAL`).
  - Chủ trọ tiếp nhận và cập nhật tiến độ (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`).

---

### 4.5. Hóa Đơn & Cổng Thanh Toán Tự Động VietQR SePay
* **Lập hóa đơn định kỳ:** Chủ trọ lập hóa đơn tháng cho từng phòng đang thuê gồm: Tiền phòng cơ bản + Tiền điện + Tiền nước + Dịch vụ khác -> Hệ thống tự tính tổng tiền và tạo bản ghi trạng thái `UNPAID`.
* **Cơ chế Thanh toán VietQR SePay:**
  - Hệ thống gọi API VietQR sinh ảnh mã QR chuẩn NAPAS 247:
    `https://img.vietqr.io/image/BIDV-8890014407-compact2.png?amount=...&addInfo=BILL<id>&accountName=LE+VU+HAO`
  - Người thuê mở app ngân hàng quét mã, toàn bộ số tài khoản, số tiền và cú pháp `BILL<id>` được điền tự động.
* **Xử lý Webhook & Tính Độc Đẳng (Idempotency):**
  - SePay đẩy webhook biến động số dư về endpoint `/api/v1/payments/sepay-webhook`.
  - Backend sử dụng Regex bóc tách mã hóa đơn `BILL(\d+)`.
  - Kiểm tra giao dịch đã từng xử lý chưa qua `vnp_txn_ref` để tránh cộng dồn lặp lại.
  - **Hỗ trợ Thanh toán từng phần (Partial Payment):** Cộng dồn số tiền đã chuyển qua bảng `payment_transactions`. Nếu đã trả đủ $\ge$ tổng tiền hóa đơn, tự động gạch nợ sang `PAID`; nếu chưa đủ, chuyển trạng thái `PARTIALLY_PAID` và báo số tiền còn thiếu.
* **Biên lai Hóa đơn Chuẩn A4:** Cho phép người thuê và chủ trọ bấm **"In biên lai"** tạo file in ấn hoặc xuất PDF theo mẫu biên lai thu phí tài chính chuyên nghiệp.

---

### 4.6. Kiến Trúc Hướng Sự Kiện (Event-Driven với RabbitMQ)
Tách rời các nghiệp vụ nặng bằng hàng đợi thông điệp bất đồng bộ:
* **Exchange:** `roomily.exchange` (Topic Exchange).
* **Routing Keys & Handlers:**
  - `invoice.created`: Gửi thông báo đến người thuê khi có phiếu báo tiền trọ mới.
  - `bill.paid`: Gửi thông báo xác nhận thanh toán thành công đến cả Chủ trọ và Cư dân.
  - `bill.partial_paid`: Gửi thông báo khi nhận được thanh toán một phần.
  - `rental.request.created` / `rental.request.approved`: Bắn thông báo trạng thái thuê phòng.
  - `maintenance.ticket.created`: Bắn thông báo khẩn cấp tới chủ trọ khi có sự cố.

---

## 🗄️ 5. Thiết Kế Cơ Sở Dữ Liệu (Database-per-Service)

### 1. `db_auth` (Auth Service)
* `users`: `id`, `email`, `password`, `full_name`, `phone_number`, `id_card_number`, `role` (`USER`, `LANDLORD`, `ADMIN`), `status` (`ACTIVE`, `SUSPENDED`), `provider` (`LOCAL`, `GOOGLE`), `created_at`, `updated_at`.
* `landlord_registration_requests`: Đơn xin nâng cấp chủ trọ, mã thanh toán (`payment_code`), số tiền cọc, trạng thái duyệt (`PENDING`, `APPROVED`, `REJECTED`).
* `audit_logs`: Lịch sử hoạt động của người dùng (hành động, địa chỉ IP, mô tả chi tiết, thời gian).
* `verification_codes`: Mã OTP đặt lại mật khẩu và thời hạn hiệu lực.

### 2. `db_property_rental` (Property & Rental Service)
* `properties`: Khu trọ, tên toà nhà, địa chỉ, quận huyện, tọa độ `latitude`, `longitude`, tiện ích.
* `rooms`: Phòng trọ, số phòng, giá thuê, diện tích, sức chứa tối đa, trạng thái phòng, khóa phiên bản `@Version`.
* `room_images`: Danh sách ảnh thực tế của phòng trọ.
* `rental_requests`: Yêu cầu thuê/ở ghép, số lượng người xin ghép, ghi chú, trạng thái (`PENDING`, `APPROVED`, `REJECTED`).
* `contracts`: Hợp đồng phòng trọ lưu vết người thuê chính, ngày bắt đầu/kết thúc, giá thuê thỏa thuận, trạng thái `ACTIVE` / `TERMINATED`.
* `tenants`: Danh sách cư dân thực tế đang cư trú trong từng phòng (`is_staying=true/false`).
* `forum_posts` & `forum_messages`: Bài đăng tìm phòng/tìm bạn cùng phòng và tin nhắn trao đổi.
* `reviews`: Đánh giá 5 sao, bình luận và hình ảnh thực tế của người đã thuê.
* `maintenance_tickets`: Phiếu báo hỏng hóc trang thiết bị, mức độ ưu tiên và tiến độ xử lý.

### 3. `db_billing_payment` (Billing & Payment Service)
* `bills`: Hóa đơn tiền trọ, kỳ thanh toán (`month_year`), tiền phòng, tiền điện, tiền nước, chi phí phát sinh, tổng tiền, hạn nộp, trạng thái (`UNPAID`, `PARTIALLY_PAID`, `PAID`).
* `payment_transactions`: Lịch sử giao dịch thanh toán qua VietQR SePay, mã tham chiếu ngân hàng, số tiền đối soát, mã phản hồi.

### 4. `db_notification` (Notification Service)
* `notifications`: Thông báo hệ thống gửi đến người dùng: `user_id`, tiêu đề, nội dung, loại sự kiện (`type`), trạng thái đã đọc (`is_read`), `reference_id`.

---

## 🚦 6. API Gateway Routing & Security Filter

Tất cả các truy vấn từ client đi qua cổng **8080** và được định tuyến tự động dựa trên URL Path:

| Tuyến Đường (Path Predicate) | Đích Đến (Microservice) | Chính Sách Bảo Mật |
| :--- | :--- | :--- |
| `/api/v1/auth/**` | `lb://AUTH-SERVICE` | Public cho login/register/sepay-webhook; Private cho profile/audit |
| `/api/v1/rooms/**`, `/api/v1/properties/**` | `lb://PROPERTY-RENTAL-SERVICE` | Public cho tìm kiếm/chi tiết phòng; Private cho thêm/sửa/xóa |
| `/api/v1/rental/**`, `/api/v1/contracts/**` | `lb://PROPERTY-RENTAL-SERVICE` | Bắt buộc Token (Xác thực người thuê / Chủ trọ) |
| `/api/v1/bills/**`, `/api/v1/payments/**` | `lb://BILLING-PAYMENT-SERVICE` | Bắt buộc Token cho hóa đơn; Public cho SePay Webhook |
| `/api/v1/notifications/**` | `lb://NOTIFICATION-SERVICE` | Bắt buộc Token (Lấy thông báo của user hiện tại) |
| `/api/v1/admin/**` | *Route tương ứng* | **ADMIN Role Guard** (Chỉ tài khoản ADMIN mới được truy cập) |

---

## 🛠️ 7. Hướng Dẫn Khởi Chạy Hệ Thống (Deployment & Local Setup)

### Yêu Cầu Tiên Quyết:
* **Java:** JDK 17 trở lên.
* **Node.js:** Node 18+ và `npm`.
* **Cơ sở dữ liệu & Broker:** MySQL 8.0, Redis 7.0, RabbitMQ 3.12 (hoặc cài đặt Docker Desktop).

---

### 7.1. Khởi chạy toàn bộ bằng Docker Compose (Khuyên dùng)

Chỉ với 1 câu lệnh duy nhất, toàn bộ 4 Database, Redis, RabbitMQ, Discovery Server, API Gateway và 4 Microservices sẽ được dựng hoàn chỉnh:

```bash
# 1. Clone dự án về máy
git clone https://github.com/LeVuHao/Roomily.git
cd Roomily

# 2. Khởi chạy toàn bộ hạ tầng và các container microservices
docker-compose up -d

# 3. Theo dõi trạng thái hoạt động của hệ thống
docker-compose ps
```

---

### 7.2. Khởi chạy thủ công (Development Mode)

#### Bước 1: Khởi tạo Cơ sở dữ liệu
Import lần lượt các file SQL trong thư mục `/database` vào MySQL Server (Port `3306` hoặc `3307`):
* `database/db_auth.sql`
* `database/db_property_rental.sql`
* `database/db_billing_payment.sql`
* `database/db_notification.sql`

#### Bước 2: Khởi động Redis & RabbitMQ
Chạy Redis tại port `6379` và RabbitMQ tại port `5672` (hoặc bật container phụ trợ):
```bash
docker run -d --name redis-dev -p 6379:6379 redis:7-alpine
docker run -d --name rabbitmq-dev -p 5672:5672 -p 15672:15672 rabbitmq:3-management-alpine
```

#### Bước 3: Khởi động các Spring Boot Microservices theo đúng thứ tự
Mở từng cửa sổ dòng lệnh riêng biệt:
```bash
# 1. Eureka Server (Bắt buộc chạy đầu tiên)
cd eureka-server && ./mvnw spring-boot:run

# 2. API Gateway (Cổng định tuyến)
cd api-gateway && ./mvnw spring-boot:run

# 3. Các Core Services
cd auth-service && ./mvnw spring-boot:run
cd property-rental-service && ./mvnw spring-boot:run
cd billing-payment-service && ./mvnw spring-boot:run
cd notification-service && ./mvnw spring-boot:run
```

#### Bước 4: Khởi động Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
👉 Truy cập ứng dụng tại: `http://localhost:5173`

---

### 7.3. Cấu hình Triển khai Frontend lên Vercel

Frontend được tối ưu hóa sẵn sàng cho Vercel:
1. File cấu hình [`frontend/vercel.json`](./frontend/vercel.json) đã được thiết lập rewrite tránh lỗi 404 cho React Router SPA:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
2. Trên Vercel Dashboard, chỉ định:
   * **Root Directory:** `frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
   * **Environment Variable:** `VITE_API_URL` trỏ về địa chỉ public của API Gateway (Ví dụ: `https://api-gateway.yourdomain.com/api/v1`).

---

## 📂 8. Cấu Trúc Thư Mục Dự Án (Project Structure)

```
microservice/
├── .github/                       # GitHub Actions CI/CD workflows
├── api-gateway/                   # Spring Cloud Gateway (Port 8080)
│   └── src/main/java/com/roomily/gateway/filter/AuthenticationFilter.java
├── auth-service/                  # Quản lý tài khoản, JWT, Google OAuth, Audit Log (Port 8081)
│   └── src/main/java/com/roomily/auth/service/AuthService.java
├── billing-payment-service/       # Hóa đơn, Cổng VietQR SePay Webhook (Port 8083)
│   └── src/main/java/com/roomily/billing/service/BillingService.java
├── common/                        # Thư viện dùng chung (Response envelope, Exceptions, Core DTOs)
├── database/                      # Các script SQL khởi tạo bảng và dữ liệu mẫu
├── eureka-server/                 # Netflix Eureka Discovery Service (Port 8761)
├── frontend/                      # Giao diện Web SPA React 19 + Vite
│   ├── src/
│   │   ├── api/                   # Axios client & Interceptors (auto JWT header)
│   │   ├── components/            # UI components (Bản đồ Leaflet, ThemeToggle, Navbar...)
│   │   └── pages/                 # Rooms, RoomDetail, MyContracts, LandlordHub, AdminDashboard...
│   ├── vercel.json                # Cấu hình rewrite định tuyến SPA cho Vercel
│   └── package.json
├── mobile/                        # Ứng dụng di động React Native Expo cho cư dân
├── notification-service/          # RabbitMQ Consumer & Quản lý thông báo (Port 8084)
├── postman/                       # Bộ API Collection kiểm thử tự động
├── property-rental-service/       # Quản lý trọ, ở ghép, Redis Lock Redisson, Diễn đàn (Port 8082)
│   └── src/main/java/com/roomily/property/service/RentalRequestService.java
├── docker-compose.yml             # Điều phối container toàn bộ hệ thống
├── pom.xml                        # Root Maven POM (Multi-module build)
└── README.md                      # Tài liệu kỹ thuật dự án
```

---

## 👥 9. Bản Quyền & Tác Quyền

Dự án phát triển bởi **Roomily Engineering Team** phục vụ cho học phần Kiến trúc Phần mềm Hướng dịch vụ / Hệ thống Phân tán.

* **Trưởng nhóm & Kỹ sư Kiến trúc:** Lê Vũ Hảo ([GitHub: @LeVuHao](https://github.com/LeVuHao))
* Mọi đóng góp và báo cáo lỗi xin vui lòng mở [GitHub Issues](https://github.com/LeVuHao/Roomily/issues) hoặc gửi Pull Request.

---
*⭐ Đừng quên bấm Star cho repository nếu bạn thấy kiến trúc dự án hữu ích!*
