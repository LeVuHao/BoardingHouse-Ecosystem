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
    password        VARCHAR(255)    NULL COMMENT 'BCrypt hash – NULL với tài khoản Google',
    full_name       VARCHAR(100)    NOT NULL,
    phone_number    VARCHAR(20)     NOT NULL,
    role            VARCHAR(20)     NOT NULL COMMENT 'ADMIN | LANDLORD | USER',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE'
                    COMMENT 'ACTIVE | SUSPENDED',
    id_card_number  VARCHAR(20)     NULL     COMMENT 'CCCD – chỉ bắt buộc với Landlord',
    provider        VARCHAR(20)     NOT NULL DEFAULT 'LOCAL' COMMENT 'LOCAL | GOOGLE',
    provider_id     VARCHAR(255)    NULL     COMMENT 'Google sub với tài khoản đăng nhập Google',
    email_verified  TINYINT(1)      NOT NULL DEFAULT 1,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_provider_id (provider_id),
    INDEX idx_users_role (role),
    INDEX idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Bảng verification_codes
-- Lưu mã OTP gửi email (đặt lại mật khẩu)
-- ----------------------------
CREATE TABLE verification_codes (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    user_id         BIGINT          NOT NULL,
    code            VARCHAR(10)     NOT NULL,
    type            VARCHAR(30)     NOT NULL COMMENT 'PASSWORD_RESET',
    used            TINYINT(1)      NOT NULL DEFAULT 0,
    expires_at      DATETIME        NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_vc_user (user_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Dữ liệu seed (Admin mặc định)
-- Password: Admin@123 (BCrypt hash)
-- ----------------------------
INSERT INTO users (email, password, full_name, phone_number, role, status)
VALUES (
    'admin@phongtro.vn',
    '$2a$10$rTKi7mUcBLliKF/NJg0y9.PIyFcooCKE61x0reIxLV8otd8TvnCUe',
    'Super Admin',
    '0900000000',
    'ADMIN',
    'ACTIVE'
);
