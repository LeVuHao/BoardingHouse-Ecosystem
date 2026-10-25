package com.roomily.billing.service;

import com.roomily.billing.config.RabbitMQConfig;
import com.roomily.billing.dto.request.CreateBillRequest;
import com.roomily.billing.dto.request.SepayWebhookRequest;
import com.roomily.billing.dto.response.BillPaymentQrResponse;
import com.roomily.billing.dto.response.BillResponse;
import com.roomily.billing.entity.Bill;
import com.roomily.billing.entity.PaymentTransaction;
import com.roomily.billing.repository.BillRepository;
import com.roomily.billing.repository.PaymentTransactionRepository;
import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillRepository billRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${sepay.api-key:}")
    private String sepayApiKey;

    @Value("${sepay.webhook-token:}")
    private String sepayWebhookToken;

    @Value("${sepay.bank-code:BIDV}")
    private String bankCode;

    @Value("${sepay.bank-account:8890014407}")
    private String bankAccount;

    @Value("${sepay.account-holder:LE VU HAO}")
    private String accountHolder;

    @Transactional
    public BillResponse createBill(Long landlordId, CreateBillRequest req) {
        BigDecimal elec = req.getElectricityAmount() != null ? req.getElectricityAmount() : BigDecimal.ZERO;
        BigDecimal water = req.getWaterAmount() != null ? req.getWaterAmount() : BigDecimal.ZERO;
        BigDecimal other = req.getOtherAmount() != null ? req.getOtherAmount() : BigDecimal.ZERO;
        BigDecimal total = req.getRoomAmount().add(elec).add(water).add(other);

        Bill bill = Bill.builder()
                .contractId(req.getContractId())
                .roomId(req.getRoomId())
                .landlordId(landlordId)
                .tenantId(req.getTenantId())
                .monthYear(req.getMonthYear())
                .roomAmount(req.getRoomAmount())
                .electricityAmount(elec)
                .waterAmount(water)
                .otherAmount(other)
                .totalAmount(total)
                .status("UNPAID")
                .dueDate(req.getDueDate())
                .build();

        Bill saved = billRepository.save(bill);

        publishEvent("invoice.created", saved.getTenantId(),
                "Hóa đơn tháng " + saved.getMonthYear() + " đã được tạo",
                "Tổng tiền: " + saved.getTotalAmount() + " đ. Hạn thanh toán: " + saved.getDueDate(),
                saved.getId());

        return BillResponse.fromEntity(saved);
    }

    public List<BillResponse> getBillsByTenant(Long tenantId) {
        return billRepository.findByTenantId(tenantId).stream()
                .map(BillResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BillResponse> getBillsByLandlord(Long landlordId) {
        return billRepository.findByLandlordId(landlordId).stream()
                .map(BillResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public BillResponse updateBillStatus(Long landlordId, Long billId, String status) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + billId));
        if (!bill.getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không có quyền cập nhật hóa đơn này");
        }
        bill.setStatus(status.toUpperCase());
        Bill saved = billRepository.save(bill);

        if ("PAID".equalsIgnoreCase(status)) {
            publishEvent("bill.paid", bill.getTenantId(),
                    "Hóa đơn tháng " + bill.getMonthYear() + " đã được xác nhận thanh toán",
                    "Chủ trọ đã xác nhận thanh toán thành công hóa đơn tháng " + bill.getMonthYear() + " với tổng tiền: " + bill.getTotalAmount() + " đ.",
                    bill.getId());
        }

        return BillResponse.fromEntity(saved);
    }

    /**
     * Sinh mã QR thanh toán chuẩn VietQR SePay cho hóa đơn tiền trọ
     */
    @Transactional
    public BillPaymentQrResponse createBillPaymentQR(Long userId, Long billId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn với ID: " + billId));

        if (!bill.getTenantId().equals(userId)) {
            throw new BadRequestException("Bạn không có quyền truy cập thanh toán hóa đơn này");
        }

        String paymentCode = "BILL" + bill.getId();
        String encodedHolder = URLEncoder.encode(accountHolder, StandardCharsets.UTF_8);
        String encodedCode = URLEncoder.encode(paymentCode, StandardCharsets.UTF_8);
        long amountLong = bill.getTotalAmount().longValue();

        String qrUrl = String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                bankCode,
                bankAccount,
                amountLong,
                encodedCode,
                encodedHolder
        );

        // Lưu bản ghi giao dịch chờ thanh toán
        PaymentTransaction txn = paymentTransactionRepository.findByVnpTxnRef(paymentCode)
                .orElse(null);

        if (txn == null) {
            txn = PaymentTransaction.builder()
                    .userId(userId)
                    .billId(billId)
                    .transactionType("BILL_PAYMENT")
                    .amount(bill.getTotalAmount())
                    .paymentMethod("SEPAY_VIETQR")
                    .vnpTxnRef(paymentCode)
                    .status(bill.getStatus().equals("PAID") ? "SUCCESS" : "PENDING")
                    .build();
        } else {
            txn.setAmount(bill.getTotalAmount());
            if ("PAID".equalsIgnoreCase(bill.getStatus())) {
                txn.setStatus("SUCCESS");
            }
        }
        paymentTransactionRepository.save(txn);

        return BillPaymentQrResponse.builder()
                .billId(bill.getId())
                .tenantId(bill.getTenantId())
                .monthYear(bill.getMonthYear())
                .amount(bill.getTotalAmount())
                .paymentCode(paymentCode)
                .qrImageUrl(qrUrl)
                .bankName("BIDV (Ngân hàng TMCP Đầu tư và Phát triển Việt Nam)")
                .bankAccount(bankAccount)
                .accountHolder(accountHolder)
                .status(bill.getStatus())
                .build();
    }

    /**
     * Xử lý Webhook SePay bắn về khi người thuê chuyển khoản thanh toán hóa đơn
     */
    @Transactional
    public boolean handleSepayWebhook(SepayWebhookRequest webhook, String authHeader) {
        if (webhook == null) return false;

        // 1. Kiểm tra xác thực Webhook Token / API Key nếu có cấu hình
        String expectedKey = (sepayApiKey != null && !sepayApiKey.isBlank()) ? sepayApiKey : sepayWebhookToken;
        if (expectedKey != null && !expectedKey.isBlank()) {
            if (authHeader == null || (!authHeader.contains(expectedKey) && !authHeader.equalsIgnoreCase("Apikey " + expectedKey))) {
                log.warn("[SePay Bill Webhook] Từ chối webhook do Authorization header không hợp lệ! Header: {}", authHeader);
                return false;
            }
        }

        // 2. Chỉ xử lý tiền vào (in) hoặc transferAmount > 0
        if (webhook.getTransferAmount() == null || webhook.getTransferAmount().compareTo(BigDecimal.ZERO) <= 0) {
            log.info("[SePay Bill Webhook] Bỏ qua giao dịch không phải nạp tiền: {}", webhook);
            return false;
        }

        String content = (webhook.getContent() != null ? webhook.getContent() : "") + " "
                + (webhook.getCode() != null ? webhook.getCode() : "");
        String normalized = content.toUpperCase().replaceAll("[^A-Z0-9]", "");

        // 3. Trích xuất mã hóa đơn BILL<id> từ nội dung chuyển khoản
        Matcher matcher = Pattern.compile("BILL(\\d+)").matcher(normalized);
        if (!matcher.find()) {
            log.warn("[SePay Bill Webhook] Không tìm thấy mã hóa đơn (BILL<id>) trong nội dung: {}", content);
            return false;
        }

        Long billId = Long.parseLong(matcher.group(1));
        Bill bill = billRepository.findById(billId).orElse(null);
        if (bill == null) {
            log.warn("[SePay Bill Webhook] Không tìm thấy hóa đơn ID: {} trong hệ thống", billId);
            return false;
        }

        // 4. XỬ LÝ IDEMPOTENCY: Nếu hóa đơn đã được thanh toán trước đó (SePay retry)
        if ("PAID".equalsIgnoreCase(bill.getStatus())) {
            log.info("[SePay Bill Webhook] [Idempotent] Hóa đơn #{} đã được gạch nợ PAID trước đó. Trả về thành công để SePay ngừng retry.", billId);
            return true;
        }

        // 5. ĐỐI SOÁT SỐ TIỀN: Tiền chuyển phải >= tổng tiền của hóa đơn
        if (webhook.getTransferAmount().compareTo(bill.getTotalAmount()) < 0) {
            log.warn("[SePay Bill Webhook] Số tiền thanh toán không đủ cho hóa đơn #{}: nhận {} đ, yêu cầu {} đ",
                    billId, webhook.getTransferAmount(), bill.getTotalAmount());
            return false;
        }

        log.info("[SePay Bill Webhook] Khớp hóa đơn #{}, Tenant ID: {}, Số tiền: {}",
                billId, bill.getTenantId(), webhook.getTransferAmount());

        // 6. Gạch nợ hóa đơn sang PAID
        bill.setStatus("PAID");
        billRepository.save(bill);

        // 7. Cập nhật bản ghi giao dịch
        String paymentCode = "BILL" + bill.getId();
        PaymentTransaction txn = paymentTransactionRepository.findByVnpTxnRef(paymentCode)
                .orElse(null);

        if (txn == null) {
            txn = PaymentTransaction.builder()
                    .userId(bill.getTenantId())
                    .billId(bill.getId())
                    .transactionType("BILL_PAYMENT")
                    .vnpTxnRef(paymentCode)
                    .build();
        }
        txn.setStatus("SUCCESS");
        txn.setPaymentMethod("SEPAY_VIETQR");
        txn.setAmount(webhook.getTransferAmount());
        txn.setVnpTransactionNo(webhook.getId() != null ? String.valueOf(webhook.getId()) : webhook.getReferenceCode());
        txn.setVnpResponseCode("00");
        paymentTransactionRepository.save(txn);

        // 8. Bắn sự kiện RabbitMQ thông báo cho Chủ trọ & Người thuê
        publishEvent("bill.paid", bill.getLandlordId(),
                "Hóa đơn tháng " + bill.getMonthYear() + " đã được thanh toán",
                "Người thuê đã thanh toán tự động qua VietQR SePay số tiền: " + bill.getTotalAmount() + " đ.",
                bill.getId());

        publishEvent("bill.paid", bill.getTenantId(),
                "Thanh toán hóa đơn tháng " + bill.getMonthYear() + " thành công",
                "Hệ thống đã tự động gạch nợ thành công hóa đơn tiền phòng tháng " + bill.getMonthYear() + ".",
                bill.getId());

        log.info("[SePay Bill Webhook] Đã gạch nợ hóa đơn #{} thành công", billId);
        return true;
    }

    private void publishEvent(String routingKey, Long userId, String title, String content, Long referenceId) {
        Map<String, Object> event = new HashMap<>();
        event.put("userId", userId);
        event.put("title", title);
        event.put("content", content);
        event.put("type", routingKey);
        event.put("referenceId", referenceId);
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
        } catch (Exception ex) {
            log.error("Failed to publish event [{}]: {}", routingKey, ex.getMessage());
        }
    }
}