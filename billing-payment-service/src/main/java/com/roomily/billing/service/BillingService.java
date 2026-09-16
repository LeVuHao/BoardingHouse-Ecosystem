package com.roomily.billing.service;

import com.roomily.billing.client.AuthClient;
import com.roomily.billing.client.dto.LandlordStatusDto;
import com.roomily.billing.config.RabbitMQConfig;
import com.roomily.billing.dto.request.CreateBillRequest;
import com.roomily.billing.dto.response.BillResponse;
import com.roomily.billing.entity.Bill;
import com.roomily.billing.entity.PaymentTransaction;
import com.roomily.billing.repository.BillRepository;
import com.roomily.billing.repository.PaymentTransactionRepository;
import com.roomily.billing.util.VNPayUtil;
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
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillRepository billRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final AuthClient authClient;
    private final RabbitTemplate rabbitTemplate;

    @Value("${vnpay.tmnCode:DEMO1234}")
    private String vnpTmnCode;

    @Value("${vnpay.hashSecret:DEMOSECRETKEYFORVNPAYSANDBOX123456}")
    private String vnpHashSecret;

    @Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpPayUrl;

    @Value("${vnpay.returnUrl:http://localhost:8080/api/v1/payments/vnpay-callback}")
    private String vnpReturnUrl;

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
                "Hoa don thang " + saved.getMonthYear() + " da duoc tao",
                "Tong tien: " + saved.getTotalAmount() + " d. Han thanh toan: " + saved.getDueDate(),
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
    public String createVNPayPaymentUrl(Long userId, String type, Long billId, BigDecimal amount) {
        if ("LANDLORD_ACTIVATION".equals(type)) {
            LandlordStatusDto status;
            try {
                status = authClient.getLandlordStatus(userId).getData();
            } catch (Exception ex) {
                log.error("Failed to fetch landlord status via Feign: {}", ex.getMessage());
                throw new ResourceNotFoundException("Không tìm thấy tài khoản chủ trọ");
            }
            if (status == null) {
                throw new ResourceNotFoundException("Không tìm thấy tài khoản chủ trọ");
            }
            if (!"LANDLORD".equalsIgnoreCase(status.getRole())) {
                throw new BadRequestException("Tài khoản không phải chủ trọ");
            }
            if ("ACTIVE".equalsIgnoreCase(status.getStatus())) {
                throw new BadRequestException("Tài khoản đã được kích hoạt trước đó");
            }
            if (!"PENDING_PAYMENT".equalsIgnoreCase(status.getStatus())) {
                throw new BadRequestException("Tài khoản không ở trạng thái chờ thanh toán");
            }
        }

        String vnpTxnRef = "TXN_" + System.currentTimeMillis() + "_" + userId;

        PaymentTransaction txn = PaymentTransaction.builder()
                .userId(userId)
                .billId(billId)
                .transactionType(type)
                .amount(amount)
                .paymentMethod("VNPAY")
                .vnpTxnRef(vnpTxnRef)
                .status("PENDING")
                .build();
        paymentTransactionRepository.save(txn);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", "2.1.0");
        vnpParams.put("vnp_Command", "pay");
        vnpParams.put("vnp_TmnCode", vnpTmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
        vnpParams.put("vnp_CurrCode", "VND");
        vnpParams.put("vnp_TxnRef", vnpTxnRef);
        vnpParams.put("vnp_OrderInfo", "Thanh toan " + type + " - User " + userId);
        vnpParams.put("vnp_OrderType", "other");
        vnpParams.put("vnp_Locale", "vn");
        vnpParams.put("vnp_ReturnUrl", vnpReturnUrl);
        vnpParams.put("vnp_IpAddr", "127.0.0.1");

        // KHÔNG dùng Calendar/TimeZone theo tên ("Asia/Ho_Chi_Minh", "Etc/GMT+7"...):
        // trên một số JRE rút gọn (vd Alpine), việc tra timezone theo ID có thể âm thầm
        // KHÔNG áp dụng offset nào cả (coi như GMT+0) mà không hề báo lỗi, khiến
        // vnp_CreateDate/vnp_ExpireDate sai lệch và VNPay báo "quá thời gian chờ
        // thanh toán" (code=15) dù thanh toán ngay lập tức.
        // Dùng ZoneOffset.ofHours(7) (tính toán số học thuần túy, không phụ thuộc
        // dữ liệu tzdata) để chắc chắn luôn ra đúng giờ Việt Nam (UTC+7, không DST).
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        OffsetDateTime nowVN = OffsetDateTime.now(ZoneOffset.ofHours(7));
        vnpParams.put("vnp_CreateDate", nowVN.format(formatter));
        vnpParams.put("vnp_ExpireDate", nowVN.plusMinutes(15).format(formatter));

        String hashData = VNPayUtil.buildHashData(vnpParams);
        String vnpSecureHash = VNPayUtil.hmacSHA512(vnpHashSecret, hashData);

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder query = new StringBuilder();
        for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext(); ) {
            String fieldName = itr.next();
            query.append(fieldName).append('=')
                    .append(URLEncoder.encode(vnpParams.get(fieldName), StandardCharsets.US_ASCII));
            if (itr.hasNext()) {
                query.append('&');
            }
        }
        query.append("&vnp_SecureHash=").append(vnpSecureHash);

        return vnpPayUrl + "?" + query;
    }

    @Transactional
    public Map<String, Object> handleVNPayCallback(Map<String, String> allParams) {
        Map<String, Object> result = new HashMap<>();

        if (!VNPayUtil.verifySignature(allParams, vnpHashSecret)) {
            log.warn("VNPay callback CHU KY KHONG HOP LE! params={}", allParams);
            result.put("success", false);
            result.put("message", "Chu ky khong hop le, giao dich bi tu choi");
            return result;
        }

        String vnpTxnRef = allParams.get("vnp_TxnRef");
        String vnpResponseCode = allParams.get("vnp_ResponseCode");
        String vnpTransactionNo = allParams.get("vnp_TransactionNo");

        PaymentTransaction txn = paymentTransactionRepository.findByVnpTxnRef(vnpTxnRef)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay giao dich: " + vnpTxnRef));

        if ("SUCCESS".equals(txn.getStatus()) || "FAILED".equals(txn.getStatus())) {
            result.put("success", "SUCCESS".equals(txn.getStatus()));
            result.put("message", "Giao dich da duoc xu ly truoc do");
            result.put("transaction", txn);
            return result;
        }

        txn.setVnpResponseCode(vnpResponseCode);
        txn.setVnpTransactionNo(vnpTransactionNo);

        if ("00".equals(vnpResponseCode)) {
            txn.setStatus("SUCCESS");
            paymentTransactionRepository.save(txn);

            if ("LANDLORD_ACTIVATION".equals(txn.getTransactionType())) {
                try {
                    authClient.activateLandlord(txn.getUserId());
                } catch (Exception ex) {
                    log.error("Failed to activate landlord via Feign: {}", ex.getMessage());
                }
                publishEvent("landlord.payment.success", txn.getUserId(),
                        "Kich hoat tai khoan thanh cong",
                        "Chuc mung! Tai khoan chu tro cua ban da duoc kich hoat.",
                        txn.getId());
                result.put("message", "Kich hoat tai khoan chu tro thanh cong!");

            } else if ("BILL_PAYMENT".equals(txn.getTransactionType()) && txn.getBillId() != null) {
                billRepository.findById(txn.getBillId()).ifPresent(bill -> {
                    bill.setStatus("PAID");
                    billRepository.save(bill);
                    publishEvent("bill.paid", bill.getLandlordId(),
                            "Hoa don da duoc thanh toan",
                            "Tenant da thanh toan hoa don thang " + bill.getMonthYear() + ".",
                            bill.getId());
                });
                result.put("message", "Thanh toan hoa don thanh cong!");
            }
            result.put("success", true);
        } else {
            txn.setStatus("FAILED");
            paymentTransactionRepository.save(txn);
            result.put("success", false);
            result.put("message", "Giao dich thanh toan that bai hoac da bi huy.");
        }

        result.put("transaction", txn);
        return result;
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