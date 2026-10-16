package com.roomily.billing.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Payload SePay Webhook bắn sang khi người thuê chuyển khoản thanh toán hóa đơn thành công.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class SepayWebhookRequest {
    private Long id;                  // ID giao dịch trên SePay
    private String gateway;           // Tên ngân hàng (ví dụ: BIDV)
    private String transactionDate;   // Thời gian giao dịch
    private String accountNumber;     // Số tài khoản nhận
    private String code;              // Mã thanh toán (nếu SePay bóc tách được)
    private String content;           // Toàn bộ nội dung chuyển khoản (VD: BILL108 hoặc BILL 108)
    private String transferType;      // in (tiền vào) hoặc out (tiền ra)
    private BigDecimal transferAmount;// Số tiền giao dịch
    private BigDecimal accumulated;   // Số dư tích lũy sau giao dịch
    private String subAccount;        // Tài khoản phụ
    private String referenceCode;     // Mã tham chiếu ngân hàng
    private String description;       // Mô tả chi tiết
}
