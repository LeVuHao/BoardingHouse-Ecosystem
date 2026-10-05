package com.roomily.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Long id;
    private String adminEmail;
    private String adminName;
    private String action;
    private String details;
    private String ipAddress;
    private LocalDateTime createdAt;
}
