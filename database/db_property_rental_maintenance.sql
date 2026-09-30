-- ============================================================
-- MIGRATION: Maintenance Tickets (Báo hỏng / Sự cố)
-- Database: db_property_rental
-- Mô tả: Thêm bảng quản lý ticket báo hỏng từ người thuê
-- ============================================================

USE db_property_rental;

-- ----------------------------
-- Bảng maintenance_tickets (Ticket báo hỏng)
-- tenant_id, landlord_id tham chiếu sang db_auth.users.id
-- ----------------------------
CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    room_id         BIGINT          NOT NULL,
    tenant_id       BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id - người báo hỏng',
    landlord_id     BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id - chủ trọ xử lý',

    -- Phân loại sự cố
    category        VARCHAR(50)     NOT NULL
                    COMMENT 'ELECTRICAL | PLUMBING | APPLIANCE | STRUCTURAL | SECURITY | CLEANING | OTHER',
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NOT NULL,
    urgency         VARCHAR(20)     NOT NULL DEFAULT 'NORMAL'
                    COMMENT 'LOW | NORMAL | HIGH | URGENT',

    -- Trạng thái xử lý
    status          VARCHAR(20)     NOT NULL DEFAULT 'OPEN'
                    COMMENT 'OPEN | IN_PROGRESS | RESOLVED | CLOSED | CANCELLED',

    -- Ghi chú xử lý của chủ trọ
    landlord_note   TEXT            NULL,
    resolved_at     TIMESTAMP       NULL,

    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_ticket_room FOREIGN KEY (room_id)
        REFERENCES rooms (id) ON DELETE CASCADE,
    INDEX idx_ticket_tenant (tenant_id),
    INDEX idx_ticket_landlord (landlord_id),
    INDEX idx_ticket_status (status),
    INDEX idx_ticket_urgency (urgency),
    INDEX idx_ticket_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Bảng ticket_images (Ảnh đính kèm sự cố)
-- ----------------------------
CREATE TABLE IF NOT EXISTS ticket_images (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    ticket_id   BIGINT          NOT NULL,
    image_url   VARCHAR(500)    NOT NULL,
    uploaded_by BIGINT          NULL COMMENT 'Ref: db_auth.users.id',
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_ticket_image FOREIGN KEY (ticket_id)
        REFERENCES maintenance_tickets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Bổ sung latitude/longitude cho properties (Leaflet Map)
-- ----------------------------
ALTER TABLE properties
    ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 7) NULL COMMENT 'Vĩ độ GPS',
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL COMMENT 'Kinh độ GPS';

-- ----------------------------
-- Bổ sung latitude/longitude cho forum_posts (Leaflet Map)
-- ----------------------------
ALTER TABLE forum_posts
    ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 7) NULL COMMENT 'Vĩ độ GPS',
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL COMMENT 'Kinh độ GPS';
