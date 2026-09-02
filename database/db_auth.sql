-- ============================================================
-- DATABASE: db_auth
-- Service: Auth Service
-- Mô tả: Quản lý tài khoản người dùng, phân quyền và trạng thái
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_auth
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE db_auth;

-- ----------------------------
-- Bảng users
-- Gom luôn thông tin Landlord vào đây bằng các cột nullable
-- Tránh tạo thêm bảng landlord_profiles riêng cho MVP
-- ----------------------------
CREATE TABLE users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    email           VARCHAR(100)    NOT NULL,
    password        VARCHAR(255)    NOT NULL COMMENT 'BCrypt hash',
    full_name       VARCHAR(100)    NOT NULL,
    phone_number    VARCHAR(20)     NOT NULL,
    role            VARCHAR(20)     NOT NULL COMMENT 'ADMIN | LANDLORD | USER',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                    COMMENT 'ACTIVE | PENDING_PAYMENT (chỉ Landlord chưa kích hoạt) | SUSPENDED',
    id_card_number  VARCHAR(20)     NULL     COMMENT 'CCCD – chỉ bắt buộc với Landlord',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Dữ liệu seed (Admin mặc định)
-- Password: Admin@123 (BCrypt hash)
-- ----------------------------
INSERT INTO users (email, password, full_name, phone_number, role, status)
VALUES (
    'admin@phongtro.vn',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Super Admin',
    '0900000000',
    'ADMIN',
    'ACTIVE'
);
