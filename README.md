# 🏠 Roomily - Microservices-based Boarding House & Roommate Finding Platform

> **Roomily** là một hệ sinh thái microservices toàn diện hỗ trợ tìm kiếm phòng trọ, quản lý cho thuê, kết nối bạn cùng phòng (roommate matching) và trao đổi thảo luận thông qua diễn đàn cộng đồng dành cho sinh viên và người đi làm.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

Dự án được xây dựng theo mô hình **Microservices Architecture** với Java Spring Boot 3, Spring Cloud và React.js (Vite):

```
                       +-------------------------+
                       |   React Frontend (Vite) |
                       |        (Port 5173)      |
                       +------------+------------+
                                    |
                                    v
                       +-------------------------+
                       |   Spring Cloud Gateway  |
                       |        (Port 8080)      |
                       +------------+------------+
                                    |
         +--------------------------+--------------------------+
         |                          |                          |
         v                          v                          v
+------------------+       +------------------+       +------------------+
|   Auth Service   |       |  Property/Rental |       | Billing Service  |
|    (Port 8081)   |       |    (Port 8082)   |       |    (Port 8083)   |
+------------------+       +------------------+       +------------------+
         |                          |                          |
         +--------------------------+--------------------------+
                                    |
                                    v
                       +-------------------------+
                       |  Notification Service   |
                       |        (Port 8084)      |
                       +-------------------------+
                                    |
      +-----------------------------+-----------------------------+
      |                             |                             |
      v                             v                             v
+------------+               +--------------+              +--------------+
|   MySQL    |               |   RabbitMQ   |              | Redis Lock   |
| (Databases)|               | (Async Bus)  |              |  (Redisson)  |
+------------+               +--------------+              +--------------+
```

---

## 📦 Danh Sách Dịch Vụ & Cổng (Service Ports)

| Service | Port | Công Nghệ | Mô Tả |
| :--- | :--- | :--- | :--- |
| **Eureka Server** | `8761` | Spring Cloud Netflix Eureka | Service Discovery & Registry |
| **API Gateway** | `8080` | Spring Cloud Gateway | API Routing, JWT Authentication Filter, CORS |
| **Auth Service** | `8081` | Spring Boot 3, Spring Security, JWT | Đăng ký, đăng nhập, phân quyền (USER, LANDLORD, ADMIN) |
| **Property & Rental Service** | `8082` | Spring Boot 3, Spring Data JPA, Redis Lock | Quản lý khu trọ, phòng trọ, yêu cầu thuê, diễn đàn & tin nhắn |
| **Billing & Payment Service** | `8083` | Spring Boot 3, Spring Data JPA | Hóa đơn điện nước, thanh toán tiền phòng |
| **Notification Service** | `8084` | Spring Boot 3, RabbitMQ Consumer | Thông báo thời gian thực về hợp đồng, phê duyệt và tin nhắn |
| **Frontend Web App** | `5173` | React 19, Vite, Tailwind CSS, Lucide Icons | Giao diện người dùng hiện đại, responsive, dark/light tones |

---

## 🚀 Tính Năng Chính

### 1. Dành cho Khách thuê & Sinh viên (Tenant / User)
- 🔍 **Tìm kiếm & Lọc phòng thông minh:** Theo khoảng giá, diện tích, khu vực quận/huyện, tiện ích đi kèm.
- 🤝 **Tìm kiếm Bạn cùng phòng (Roommate Matching):** Xem bài đăng tìm bạn cùng phòng, gửi yêu cầu xin ở ghép.
- 💬 **Diễn đàn & Tin nhắn thời gian thực:** Đăng bài thảo luận, trao đổi trực tiếp giữa người tìm phòng và chủ trọ.
- 📑 **Quản lý hợp đồng & Hóa đơn:** Theo dõi hợp đồng thuê phòng còn hiệu lực và trạng thái các hóa đơn hàng tháng.

### 2. Dành cho Chủ trọ (Landlord)
- 🏢 **Quản lý Bất động sản & Phòng:** Thêm/sửa/xóa tòa nhà, cấu hình thông tin chi tiết từng phòng kèm hình ảnh thực tế.
- 📨 **Xét duyệt yêu cầu thuê & ở ghép:** Tiếp nhận và duyệt/từ chối yêu cầu từ người dùng trực tiếp trên dashboard.
- 🧾 **Lập hóa đơn định kỳ:** Tạo hóa đơn tiền phòng, tiền điện, nước định kỳ và gửi thông báo tới người thuê.

### 3. Dành cho Quản trị viên (Admin)
- 📊 **Dashboard Thống kê:** Báo cáo tổng thể người dùng, chủ trọ, số lượng phòng và bài viết toàn hệ thống.
- 🛡️ **Quản trị rủi ro:** Khóa/kích hoạt tài khoản khi phát hiện dấu hiệu vi phạm hoặc tin giả.

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy (Quick Start)

### 1. Yêu cầu môi trường
- **Java:** JDK 17+
- **Node.js:** Node 18+ & npm
- **Database / Message Broker:** MySQL 8.0, Redis, RabbitMQ
- **Docker & Docker Compose** (khuyến nghị)

### 2. Khởi chạy bằng Docker Compose (Khuyên dùng)
```bash
# Khởi động toàn bộ cơ sở hạ tầng và microservices
docker-compose up -d

# Kiểm tra trạng thái các container
docker-compose ps
```

### 3. Khởi chạy thủ công (Development Mode)
1. **Khởi tạo cơ sở dữ liệu:** Chạy các file SQL trong thư mục `/database` vào MySQL server.
2. **Khởi động Eureka Server:**
   ```bash
   cd eureka-server && ./mvnw spring-boot:run
   ```
3. **Khởi động API Gateway:**
   ```bash
   cd api-gateway && ./mvnw spring-boot:run
   ```
4. **Khởi động các dịch vụ nghiệp vụ:** Chạy lần lượt `auth-service`, `property-rental-service`, `billing-payment-service`, `notification-service`.
5. **Khởi chạy Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Truy cập giao diện tại: `http://localhost:5173`

---

## 📚 Tài Liệu Kỹ Thuật Bổ Sung
- Chi tiết kiến trúc hệ thống và quy trình nghiệp vụ: [`project_architecture.md`](./project_architecture.md)
- Bộ API Test bằng Postman: Thư mục [`/postman`](./postman)

---

## 📄 License & Tác Quyền
Đồ án môn học phân tán / kiến trúc hướng dịch vụ - Nhóm phát triển **Roomily Team**.
