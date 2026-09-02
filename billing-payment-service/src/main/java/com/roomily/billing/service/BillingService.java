package com.roomily.billing.service;

import com.roomily.billing.client.AuthClient;
import com.roomily.billing.dto.request.CreateBillRequest;
import com.roomily.billing.dto.response.BillResponse;
import com.roomily.billing.entity.Bill;
import com.roomily.billing.entity.PaymentTransaction;
import com.roomily.billing.repository.BillRepository;
import com.roomily.billing.repository.PaymentTransactionRepository;
import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingService {

    private final BillRepository billRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final AuthClient authClient;

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

    /**
     * TẠO URL THANH TOÁN VNPAY SANDBOX (CHO KÍCH HOẠT CHỦ TRỌ HOẶC THANH TOÁN HÓA ĐƠN)
     */
    @Transactional
    public String createVNPayPaymentUrl(Long userId, String type, Long billId, BigDecimal amount) {
        String vnpTxnRef = "TXN_" + System.currentTimeMillis() + "_" + userId;

        // Lưu transaction PENDING vào database
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

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnpCreateDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_CreateDate", vnpCreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnpExpireDate = formatter.format(cld.getTime());
        vnpParams.put("vnp_ExpireDate", vnpExpireDate);

        List<String> fieldNames = new ArrayList<>(vnpParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext(); ) {
            String fieldName = itr.next();
            String fieldValue = vnpParams.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnpSecureHash = hmacSHA512(vnpHashSecret, hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnpSecureHash;

        return vnpPayUrl + "?" + queryUrl;
    }

    /**
     * XỬ LÝ VNPAY CALLBACK / IPN
     */
    @Transactional
    public Map<String, Object> handleVNPayCallback(Map<String, String> allParams) {
        String vnpTxnRef = allParams.get("vnp_TxnRef");
        String vnpResponseCode = allParams.get("vnp_ResponseCode");
        String vnpTransactionNo = allParams.get("vnp_TransactionNo");

        PaymentTransaction txn = paymentTransactionRepository.findByVnpTxnRef(vnpTxnRef)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giao dịch: " + vnpTxnRef));

        txn.setVnpResponseCode(vnpResponseCode);
        txn.setVnpTransactionNo(vnpTransactionNo);

        Map<String, Object> result = new HashMap<>();

        if ("00".equals(vnpResponseCode)) {
            txn.setStatus("SUCCESS");
            paymentTransactionRepository.save(txn);

            if ("LANDLORD_ACTIVATION".equals(txn.getTransactionType())) {
                try {
                    authClient.activateLandlord(txn.getUserId());
                    result.put("message", "Kích hoạt tài khoản chủ trọ thành công!");
                } catch (Exception ex) {
                    log.error("Failed to activate landlord via Feign: {}", ex.getMessage());
                }
            } else if ("BILL_PAYMENT".equals(txn.getTransactionType()) && txn.getBillId() != null) {
                billRepository.findById(txn.getBillId()).ifPresent(bill -> {
                    bill.setStatus("PAID");
                    billRepository.save(bill);
                });
                result.put("message", "Thanh toán hóa đơn thành công!");
            }

            result.put("success", true);
        } else {
            txn.setStatus("FAILED");
            paymentTransactionRepository.save(txn);
            result.put("success", false);
            result.put("message", "Giao dịch thanh toán thất bại hoặc đã bị hủy.");
        }

        result.put("transaction", txn);
        return result;
    }

    private String hmacSHA512(String key, String data) {
        try {
            Mac sha512Hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            sha512Hmac.init(secretKey);
            byte[] hash = sha512Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte b : hash) {
                result.append(String.format("%02x", b));
            }
            return result.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
