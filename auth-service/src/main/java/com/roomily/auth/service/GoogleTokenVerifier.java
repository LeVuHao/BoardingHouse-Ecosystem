package com.roomily.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.roomily.common.exception.BadRequestException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigInteger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Component
public class GoogleTokenVerifier {

    private static final String CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
    private static final String GOOGLE_ISSUER_1 = "https://accounts.google.com";
    private static final String GOOGLE_ISSUER_2 = "accounts.google.com";
    private static final long JWKS_TTL_MS = 6 * 60 * 60 * 1000L;

    @Value("${google.client-id}")
    private String googleClientId;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    private volatile JsonNode jwksKeys;
    private volatile long jwksFetchedAt;

    public GoogleProfile verify(String idToken) {
        if (googleClientId == null || googleClientId.isBlank() || googleClientId.startsWith("YOUR_")) {
            throw new BadRequestException("Google login chưa được cấu hình (google.client-id)");
        }
        if (idToken == null || idToken.isBlank()) {
            throw new BadRequestException("Thiếu Google ID token");
        }

        String[] parts = idToken.split("\\.");
        if (parts.length != 3) {
            throw new BadRequestException("Google ID token không hợp lệ");
        }

        String kid = extractKid(parts[0]);
        if (kid == null) {
            throw new BadRequestException("Google ID token thiếu kid");
        }

        PublicKey publicKey = resolvePublicKey(kid);
        Claims claims;
        try {
            claims = Jwts.parserBuilder()
                    .setSigningKey(publicKey)
                    .build()
                    .parseClaimsJws(idToken)
                    .getBody();
        } catch (Exception ex) {
            throw new BadRequestException("Không thể xác thực chữ ký Google token");
        }

        String audience = claims.get("aud", String.class);
        if (!googleClientId.equals(audience)) {
            throw new BadRequestException("Google token không khớp client id");
        }
        String issuer = claims.getIssuer();
        if (!GOOGLE_ISSUER_1.equals(issuer) && !GOOGLE_ISSUER_2.equals(issuer)) {
            throw new BadRequestException("Google token có issuer không hợp lệ");
        }

        String sub = claims.getSubject();
        String email = claims.get("email", String.class);
        String name = claims.get("name", String.class);
        String picture = claims.get("picture", String.class);
        Boolean emailVerified = claims.get("email_verified", Boolean.class);

        if (email == null || sub == null) {
            throw new BadRequestException("Google token thiếu thông tin email");
        }
        if (Boolean.FALSE.equals(emailVerified)) {
            throw new BadRequestException("Email Google chưa được xác thực");
        }

        return new GoogleProfile(sub, email, name, picture, Boolean.TRUE.equals(emailVerified));
    }

    private String extractKid(String headerSegment) {
        try {
            JsonNode header = objectMapper.readTree(decodeSegment(headerSegment));
            return header.path("kid").asText(null);
        } catch (Exception ex) {
            throw new BadRequestException("Không thể đọc Google token header");
        }
    }

    private PublicKey resolvePublicKey(String kid) {
        JsonNode key = findKey(kid);
        if (key == null) {
            jwksKeys = null;
            key = findKey(kid);
        }
        if (key == null) {
            throw new BadRequestException("Không tìm thấy Google public key tương ứng");
        }
        try {
            byte[] modulusBytes = Base64.getUrlDecoder().decode(pad(key.path("n").asText()));
            byte[] exponentBytes = Base64.getUrlDecoder().decode(pad(key.path("e").asText()));
            RSAPublicKeySpec spec = new RSAPublicKeySpec(
                    new BigInteger(1, modulusBytes),
                    new BigInteger(1, exponentBytes));
            return KeyFactory.getInstance("RSA").generatePublic(spec);
        } catch (Exception ex) {
            throw new BadRequestException("Không thể dựng Google public key");
        }
    }

    private JsonNode findKey(String kid) {
        JsonNode keys = getJwksKeys();
        if (keys == null || !keys.isArray()) return null;
        for (JsonNode key : keys) {
            if (kid.equals(key.path("kid").asText())) {
                return key;
            }
        }
        return null;
    }

    private JsonNode getJwksKeys() {
        if (jwksKeys == null || System.currentTimeMillis() - jwksFetchedAt > JWKS_TTL_MS) {
            refreshJwks();
        }
        return jwksKeys;
    }

    private synchronized void refreshJwks() {
        if (jwksKeys != null && System.currentTimeMillis() - jwksFetchedAt <= JWKS_TTL_MS) {
            return;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(CERTS_URL))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("Google JWKS HTTP " + response.statusCode());
            }
            JsonNode root = objectMapper.readTree(response.body());
            jwksKeys = root.path("keys");
            jwksFetchedAt = System.currentTimeMillis();
        } catch (Exception ex) {
            if (jwksKeys == null) {
                throw new BadRequestException("Không thể tải Google public keys");
            }
        }
    }

    private String decodeSegment(String segment) {
        try {
            byte[] bytes = Base64.getUrlDecoder().decode(pad(segment));
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (Exception ex) {
            throw new BadRequestException("Google token payload không hợp lệ");
        }
    }

    private static String pad(String s) {
        int mod = s.length() % 4;
        if (mod == 0) return s;
        StringBuilder sb = new StringBuilder(s);
        for (int i = mod; i < 4; i++) {
            sb.append('=');
        }
        return sb.toString();
    }

    public record GoogleProfile(String sub, String email, String name, String picture, boolean emailVerified) {
    }
}