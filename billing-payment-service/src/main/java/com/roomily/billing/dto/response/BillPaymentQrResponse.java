package com.roomily.billing.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillPaymentQrResponse {
    private Long billId;
    private Long tenantId;
    private String monthYear;
    private BigDecimal amount;
    private String paymentCode;
    private String qrImageUrl;
    private String bankName;
    private String bankAccount;
    private String accountHolder;
    private String status;
}
