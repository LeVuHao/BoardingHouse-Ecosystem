package com.roomily.billing.soap;

import jakarta.xml.bind.annotation.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

public class SoapTypes {

    @XmlAccessorType(XmlAccessType.FIELD)
    @XmlType(name = "", propOrder = {"vnpTxnRef"})
    @XmlRootElement(name = "GetTransactionStatusRequest", namespace = "http://roomily.com/billing/soap")
    @Getter
    @Setter
    public static class GetTransactionStatusRequest {
        @XmlElement(namespace = "http://roomily.com/billing/soap", required = true)
        private String vnpTxnRef;
    }

    @XmlAccessorType(XmlAccessType.FIELD)
    @XmlType(name = "", propOrder = {"vnpTxnRef", "userId", "amount", "transactionType", "status", "paymentMethod"})
    @XmlRootElement(name = "GetTransactionStatusResponse", namespace = "http://roomily.com/billing/soap")
    @Getter
    @Setter
    public static class GetTransactionStatusResponse {
        @XmlElement(namespace = "http://roomily.com/billing/soap", required = true)
        private String vnpTxnRef;
        @XmlElement(namespace = "http://roomily.com/billing/soap", required = true)
        private Long userId;
        @XmlElement(namespace = "http://roomily.com/billing/soap", required = true)
        private BigDecimal amount;
        @XmlElement(namespace = "http://roomily.com/billing/soap", required = true)
        private String transactionType;
        @XmlElement(namespace = "http://roomily.com/billing/soap", required = true)
        private String status;
        @XmlElement(namespace = "http://roomily.com/billing/soap", required = true)
        private String paymentMethod;
    }
}
