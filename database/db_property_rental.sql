-- ============================================================
-- DATABASE: db_property_rental
-- Service: Property & Rental Service
-- Mô tả: Quản lý khu trọ, phòng, ảnh, yêu cầu thuê,
--         ở ghép, tenant và hợp đồng
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_property_rental
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE db_property_rental;

-- ----------------------------
-- Bảng properties (Khu trọ)
-- landlord_id tham chiếu sang db_auth.users.id
-- (Cross-DB reference – KHÔNG dùng FOREIGN KEY, chỉ dùng INDEX)
-- ----------------------------
CREATE TABLE properties (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    landlord_id BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    title       VARCHAR(150)    NOT NULL,
    description TEXT            NULL,
    address     VARCHAR(255)    NOT NULL,
    city        VARCHAR(100)    NOT NULL,
    district    VARCHAR(100)    NOT NULL,
    ward        VARCHAR(100)    NOT NULL,
    utilities   VARCHAR(500)    NULL COMMENT 'Phân tách bởi dấu phẩy. VD: WiFi,Bãi xe,Máy lạnh',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_properties_landlord_id (landlord_id),
    INDEX idx_properties_city_district (city, district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng rooms (Phòng trọ)
-- ----------------------------
CREATE TABLE rooms (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    property_id         BIGINT          NOT NULL,
    room_number         VARCHAR(20)     NOT NULL COMMENT 'VD: P101, P102',
    price               DECIMAL(12, 2)  NOT NULL COMMENT 'Giá thuê/tháng (VNĐ)',
    area                DECIMAL(6, 2)   NOT NULL COMMENT 'Diện tích m²',
    capacity            INT             NOT NULL COMMENT 'Sức chứa tối đa (người)',
    current_occupants   INT             NOT NULL DEFAULT 0 COMMENT 'Số người đang ở',
    status              VARCHAR(20)     NOT NULL DEFAULT 'AVAILABLE'
                        COMMENT 'AVAILABLE | FULL | MAINTENANCE',
    version             INT             NOT NULL DEFAULT 0 COMMENT 'Optimistic Locking – tăng mỗi lần update',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_rooms_property FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE,
    INDEX idx_rooms_status (status),
    INDEX idx_rooms_price (price),
    INDEX idx_rooms_area (area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng room_images (Ảnh phòng trọ)
-- ----------------------------
CREATE TABLE room_images (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    room_id     BIGINT          NOT NULL,
    image_url   VARCHAR(500)    NOT NULL COMMENT 'URL ảnh (có thể là Base64 URL hoặc link cloud)',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_room_images_room FOREIGN KEY (room_id)
        REFERENCES rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng rental_requests (Yêu cầu thuê phòng trực tiếp)
-- user_id tham chiếu sang db_auth.users.id
-- ----------------------------
CREATE TABLE rental_requests (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    room_id     BIGINT          NOT NULL,
    note        TEXT            NULL COMMENT 'Ghi chú của người thuê',
    status      VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                COMMENT 'PENDING | APPROVED | REJECTED | CANCELLED',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_rental_req_room FOREIGN KEY (room_id)
        REFERENCES rooms (id) ON DELETE CASCADE,
    INDEX idx_rental_req_user_id (user_id),
    INDEX idx_rental_req_room_id (room_id),
    INDEX idx_rental_req_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng tenants (Người đang cư trú trong phòng)
-- Được tạo tự động khi rental_request hoặc join_request được APPROVED.
-- user_id UNIQUE đảm bảo 1 user chỉ ở 1 phòng tại một thời điểm.
-- ----------------------------
CREATE TABLE tenants (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    room_id     BIGINT          NOT NULL,
    user_id     BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    joined_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_tenants_room FOREIGN KEY (room_id)
        REFERENCES rooms (id) ON DELETE CASCADE,
    UNIQUE KEY uq_tenants_user_id (user_id),
    INDEX idx_tenants_room_id (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng contracts (Hợp đồng thuê phòng)
-- Được tạo tự động khi Landlord duyệt rental_request.
-- landlord_id và tenant_id tham chiếu sang db_auth.users.id
-- ----------------------------
CREATE TABLE contracts (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    landlord_id     BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    tenant_id       BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id – người ký thuê chính',
    room_id         BIGINT          NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    rental_price    DECIMAL(12, 2)  NOT NULL COMMENT 'Giá thuê chốt trên hợp đồng',
    deposit         DECIMAL(12, 2)  NOT NULL COMMENT 'Tiền cọc',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                    COMMENT 'ACTIVE | EXPIRED | TERMINATED',
    contract_url    VARCHAR(500)    NULL COMMENT 'Link PDF hợp đồng (nếu có)',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_contracts_room FOREIGN KEY (room_id)
        REFERENCES rooms (id) ON DELETE RESTRICT,
    INDEX idx_contracts_tenant_id (tenant_id),
    INDEX idx_contracts_landlord_id (landlord_id),
    INDEX idx_contracts_room_id (room_id),
    INDEX idx_contracts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng roommate_posts (Bài đăng tìm người ở ghép)
-- creator_id phải là tenant đang ở phòng đó (kiểm tra ở tầng application logic)
-- ----------------------------
CREATE TABLE roommate_posts (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    room_id     BIGINT          NOT NULL,
    creator_id  BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id – phải là tenant của phòng',
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NULL COMMENT 'Mô tả phong cách sống, yêu cầu ở ghép',
    price_share DECIMAL(12, 2)  NOT NULL COMMENT 'Giá phòng chia đều dự kiến (VNĐ/người/tháng)',
    status      VARCHAR(20)     NOT NULL DEFAULT 'OPEN'
                COMMENT 'OPEN | FULL | CLOSED',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_rmpost_room FOREIGN KEY (room_id)
        REFERENCES rooms (id) ON DELETE CASCADE,
    -- Một phòng chỉ có một bài OPEN tại một thời điểm
    -- (kiểm tra ở application logic, không phải UNIQUE ở DB)
    INDEX idx_rmpost_room_id (room_id),
    INDEX idx_rmpost_status (status),
    INDEX idx_rmpost_creator_id (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng join_requests (Yêu cầu tham gia ở ghép)
-- user_id tham chiếu sang db_auth.users.id
-- ----------------------------
CREATE TABLE join_requests (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    post_id         BIGINT          NOT NULL,
    user_id         BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id – người xin vào ở ghép',
    introduction    TEXT            NULL COMMENT 'Lời giới thiệu bản thân',
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                    COMMENT 'PENDING | APPROVED | REJECTED | CANCELLED',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_joinreq_post FOREIGN KEY (post_id)
        REFERENCES roommate_posts (id) ON DELETE CASCADE,
    -- Mỗi user chỉ có 1 request PENDING cho 1 bài đăng
    UNIQUE KEY uq_joinreq_post_user (post_id, user_id),
    INDEX idx_joinreq_user_id (user_id),
    INDEX idx_joinreq_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng reviews (Đánh giá & Bình luận 5 sao từ người thuê)
-- ----------------------------
CREATE TABLE reviews (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    reviewer_id     BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id – người viết đánh giá',
    reviewer_name   VARCHAR(255)    NULL COMMENT 'Tên người đánh giá',
    reviewee_id     BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id – chủ trọ được đánh giá',
    contract_id     BIGINT          NULL COMMENT 'Ref: hợp đồng liên quan',
    post_id         BIGINT          NULL COMMENT 'Ref: bài đăng trọ forum_posts.id',
    room_id         BIGINT          NULL COMMENT 'Ref: phòng trọ rooms.id',
    rating          TINYINT         NOT NULL COMMENT '1 đến 5 sao',
    comment         TEXT            NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_reviews_post_id (post_id),
    INDEX idx_reviews_room_id (room_id),
    INDEX idx_reviews_reviewee_id (reviewee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
