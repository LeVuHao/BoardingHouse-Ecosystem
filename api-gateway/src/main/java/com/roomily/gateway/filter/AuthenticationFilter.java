package com.roomily.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.List;

@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String jwtSecret;

    private static final List<String> OPEN_ENDPOINTS = List.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/landlord/register",
            "/api/v1/auth/landlord/status",
            "/api/v1/rooms/search",
            "/api/v1/properties/search",
            "/api/v1/payments/vnpay-callback",
            "/api/v1/payments/create-activation-url",
            "/ws",
            "/ws/"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // 1. Check open/whitelisted endpoints
        if (isSecured(path, request.getMethod().name())) {
            // 2. Check Authorization header
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange, "Missing Authorization Header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Invalid Authorization Header format", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);
            try {
                Claims claims = validateAndGetClaims(token);
                String userId = claims.getSubject();
                String role = claims.get("role", String.class);

                // Mutate request with extracted user information headers
                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id", userId)
                        .header("X-User-Role", role)
                        .build();

                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            } catch (Exception ex) {
                return onError(exchange, "Invalid or expired JWT token: " + ex.getMessage(), HttpStatus.UNAUTHORIZED);
            }
        }

        return chain.filter(exchange);
    }

    private boolean isSecured(String path, String method) {
        // GET requests to rooms and properties details / search can be public
        if ("GET".equalsIgnoreCase(method)) {
            if (path.startsWith("/api/v1/rooms") || path.startsWith("/api/v1/properties") || path.startsWith("/api/v1/rental/posts")) {
                if (!path.contains("/my-") && !path.contains("/requests")) {
                    return false;
                }
            }
        }

        return OPEN_ENDPOINTS.stream().noneMatch(path::startsWith);
    }

    private Claims validateAndGetClaims(String token) {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String jsonResponse = String.format("{\"success\": false, \"message\": \"%s\", \"data\": null}", err);
        DataBuffer buffer = response.bufferFactory().wrap(jsonResponse.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}