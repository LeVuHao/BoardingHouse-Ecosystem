-- ============================================================
-- DATABASE: db_notification
-- Service: Notification Service
-- Mô tả: Lưu thông báo trong hệ thống, nhận từ RabbitMQ events
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_notification
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE db_notification;

-- ----------------------------
-- Bảng notifications
-- user_id tham chiếu sang db_auth.users.id
-- (Cross-DB reference – KHÔNG dùng FOREIGN KEY, chỉ dùng INDEX)
-- ----------------------------
CREATE TABLE notifications (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    user_id     BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id – người nhận thông báo',
    title       VARCHAR(150)    NOT NULL COMMENT 'Tiêu đề ngắn gọn',
    content     TEXT            NOT NULL COMMENT 'Nội dung chi tiết thông báo',
    type        VARCHAR(50)     NULL
                COMMENT 'Loại thông báo: RENTAL_APPROVED | RENTAL_REJECTED | JOIN_APPROVED | JOIN_REJECTED | LANDLORD_ACTIVATED | INVOICE_CREATED',
    is_read     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_notifications_user_id (user_id),
    INDEX idx_notifications_is_read (is_read),
    INDEX idx_notifications_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
