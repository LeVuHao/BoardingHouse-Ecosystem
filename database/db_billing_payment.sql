-- ============================================================
-- DATABASE: db_billing_payment
-- Service: Billing & Payment Service
-- Mô tả: Quản lý hóa đơn và giao dịch VNPay
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_billing_payment
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE db_billing_payment;

-- ----------------------------
-- Bảng invoices (Hóa đơn phòng trọ hàng tháng)
-- contract_id và room_id tham chiếu sang db_property_rental
-- (Cross-DB reference – KHÔNG dùng FOREIGN KEY, chỉ dùng INDEX)
-- ----------------------------
CREATE TABLE invoices (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    contract_id     BIGINT          NOT NULL COMMENT 'Ref: db_property_rental.contracts.id',
    room_id         BIGINT          NOT NULL COMMENT 'Ref: db_property_rental.rooms.id',
    -- tenant_id để User có thể query hóa đơn của mình mà không cần join sang DB khác
    tenant_id       BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    billing_cycle   VARCHAR(7)      NOT NULL COMMENT 'Tháng xuất hóa đơn. Format: YYYY-MM. VD: 2026-08',
    total_amount    DECIMAL(12, 2)  NOT NULL COMMENT 'Tổng tiền. Landlord tự tính và nhập (điện+nước+phòng+dịch vụ)',
    due_date        DATE            NOT NULL COMMENT 'Hạn chót đóng tiền',
    status          VARCHAR(20)     NOT NULL DEFAULT 'UNPAID'
                    COMMENT 'UNPAID | PAID | OVERDUE',
    note            TEXT            NULL COMMENT 'Ghi chú từ Landlord (VD: điện 150kWh x 3500đ = 525k...)',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    -- Mỗi hợp đồng chỉ có 1 hóa đơn cho 1 tháng
    UNIQUE KEY uq_invoices_contract_cycle (contract_id, billing_cycle),
    INDEX idx_invoices_tenant_id (tenant_id),
    INDEX idx_invoices_status (status),
    INDEX idx_invoices_room_id (room_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng transactions (Giao dịch VNPay Sandbox)
-- Ghi lại toàn bộ lịch sử thanh toán qua VNPay
-- ----------------------------
CREATE TABLE transactions (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    txn_ref             VARCHAR(100)    NOT NULL COMMENT 'Mã tham chiếu gửi sang VNPay. Format: {userId}_{timestamp}',
    amount              DECIMAL(12, 2)  NOT NULL COMMENT 'Số tiền giao dịch (VNĐ)',
    payment_type        VARCHAR(50)     NOT NULL
                        COMMENT 'BILL_PAYMENT',
    reference_id        BIGINT          NOT NULL COMMENT 'InvoiceId',
    vnp_transaction_no  VARCHAR(100)    NULL COMMENT 'Mã giao dịch VNPay trả về qua IPN',
    bank_code           VARCHAR(20)     NULL COMMENT 'Mã ngân hàng thực hiện giao dịch',
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING'
                        COMMENT 'PENDING | SUCCESS | FAILED',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at        TIMESTAMP       NULL     COMMENT 'Thời điểm VNPay xác nhận thành công',

    PRIMARY KEY (id),
    UNIQUE KEY uq_transactions_txn_ref (txn_ref),
    INDEX idx_transactions_status (status),
    INDEX idx_transactions_payment_type (payment_type),
    INDEX idx_transactions_reference_id (reference_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
