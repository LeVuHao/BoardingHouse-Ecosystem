-- =====================================================================
-- Module 2 (Admin): Quản lý Khu trọ, Kiểm duyệt bài đăng, Danh mục tiện ích
--
-- LƯU Ý: property-rental-service đang chạy với spring.jpa.hibernate.ddl-auto=update
-- nên Hibernate sẽ TỰ THÊM các cột/bảng dưới đây khi khởi động service.
-- File này chỉ để tham khảo / chạy tay khi ddl-auto bị tắt.
-- =====================================================================
USE property_rental;

-- 1) Khu trọ: trạng thái hiển thị (ACTIVE | HIDDEN | DELETED)
ALTER TABLE properties
    ADD COLUMN status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN status_reason VARCHAR(500) NULL;

-- 2) Bài đăng diễn đàn: trạng thái kiểm duyệt (PENDING | APPROVED | REJECTED)
--    Bài đã có sẵn được đặt APPROVED để không bị ẩn sau khi nâng cấp.
ALTER TABLE forum_posts
    ADD COLUMN moderation_status VARCHAR(20)  NOT NULL DEFAULT 'APPROVED',
    ADD COLUMN reject_reason     VARCHAR(500) NULL,
    ADD COLUMN moderated_at      DATETIME     NULL,
    ADD COLUMN moderated_by      BIGINT       NULL;

-- 3) Danh mục tiện ích
CREATE TABLE IF NOT EXISTS amenities (
    id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    icon       VARCHAR(100) NULL,
    active     BIT          NOT NULL DEFAULT 1,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);
