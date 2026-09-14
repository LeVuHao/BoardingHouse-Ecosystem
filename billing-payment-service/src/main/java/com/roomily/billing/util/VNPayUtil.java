package com.roomily.billing.util;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class VNPayUtil {

    private VNPayUtil() {
    }

    public static String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Loi tinh HMAC-SHA512: " + e.getMessage(), e);
        }
    }

    public static String buildHashData(Map<String, String> params) {
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        for (Iterator<String> itr = fieldNames.iterator(); itr.hasNext(); ) {
            String fieldName = itr.next();
            String fieldValue = params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                hashData.append(fieldName).append('=')
                        .append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }
        return hashData.toString();
    }

    public static boolean verifySignature(Map<String, String> allParams, String secretKey) {
        String receivedHash = allParams.get("vnp_SecureHash");
        if (receivedHash == null || receivedHash.isBlank()) {
            return false;
        }
        Map<String, String> filtered = new HashMap<>(allParams);
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");
        String hashData = buildHashData(filtered);
        String computedHash = hmacSHA512(secretKey, hashData);
        return computedHash.equalsIgnoreCase(receivedHash);
    }
}