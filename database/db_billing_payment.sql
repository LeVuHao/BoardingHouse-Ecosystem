-- ============================================================
-- DATABASE: db_billing_payment
-- Service: Billing & Payment Service
-- Mô tả: Quản lý hóa đơn và giao dịch SePay VietQR
-- ============================================================

CREATE DATABASE IF NOT EXISTS db_billing_payment
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE db_billing_payment;

-- ----------------------------
-- Bảng bills (Hóa đơn phòng trọ hàng tháng)
-- ----------------------------
CREATE TABLE IF NOT EXISTS bills (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    contract_id         BIGINT          NOT NULL COMMENT 'Ref: db_property_rental.contracts.id',
    room_id             BIGINT          NOT NULL COMMENT 'Ref: db_property_rental.rooms.id',
    landlord_id         BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    tenant_id           BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    month_year          VARCHAR(10)     NOT NULL COMMENT 'Tháng xuất hóa đơn (YYYY-MM)',
    room_amount         DECIMAL(12, 2)  NOT NULL,
    electricity_amount  DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    water_amount        DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    other_amount        DECIMAL(12, 2)  NOT NULL DEFAULT 0.00,
    total_amount        DECIMAL(12, 2)  NOT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'UNPAID' COMMENT 'UNPAID | PAID | OVERDUE',
    due_date            DATE            NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_bills_tenant_id (tenant_id),
    INDEX idx_bills_landlord_id (landlord_id),
    INDEX idx_bills_status (status),
    INDEX idx_bills_contract_id (contract_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ----------------------------
-- Bảng payment_transactions (Lịch sử giao dịch VietQR SePay)
-- ----------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    user_id             BIGINT          NOT NULL COMMENT 'Ref: db_auth.users.id',
    bill_id             BIGINT          NULL COMMENT 'Ref: bills.id',
    transaction_type    VARCHAR(30)     NOT NULL DEFAULT 'BILL_PAYMENT',
    amount              DECIMAL(12, 2)  NOT NULL,
    payment_method      VARCHAR(20)     NOT NULL DEFAULT 'SEPAY_VIETQR',
    vnp_txn_ref         VARCHAR(100)    NOT NULL COMMENT 'Mã thanh toán đối soát: BILL<id>',
    vnp_transaction_no  VARCHAR(100)    NULL COMMENT 'Mã tham chiếu SePay',
    vnp_response_code   VARCHAR(10)     NULL DEFAULT '00',
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | SUCCESS | FAILED',
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_pt_vnp_txn_ref (vnp_txn_ref),
    INDEX idx_pt_bill_id (bill_id),
    INDEX idx_pt_user_id (user_id),
    INDEX idx_pt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
