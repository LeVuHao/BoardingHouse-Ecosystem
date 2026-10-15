package com.roomily.property.dto.response;

import com.roomily.property.entity.Report;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private String targetType; // ROOM | FORUM_POST
    private Long targetId;
    private String targetTitle;
    private String targetAddress;
    private Long targetOwnerId;
    private String targetOwnerName;
    private String reason;
    private String description;
    private List<String> evidenceImages;
    private String status; // PENDING | RESOLVED | DISMISSED
    private String adminAction; // WARNING | HIDE_POST | BAN_USER | DISMISS
    private String adminNote;
    private Long resolvedBy;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ReportResponse fromEntity(Report report) {
        if (report == null) return null;
        return ReportResponse.builder()
                .id(report.getId())
                .reporterId(report.getReporterId())
                .reporterName(report.getReporterName())
                .reporterEmail(report.getReporterEmail())
                .targetType(report.getTargetType())
                .targetId(report.getTargetId())
                .targetTitle(report.getTargetTitle())
                .targetAddress(report.getTargetAddress())
                .targetOwnerId(report.getTargetOwnerId())
                .targetOwnerName(report.getTargetOwnerName())
                .reason(report.getReason())
                .description(report.getDescription())
                .evidenceImages(report.getEvidenceImages())
                .status(report.getStatus())
                .adminAction(report.getAdminAction())
                .adminNote(report.getAdminNote())
                .resolvedBy(report.getResolvedBy())
                .resolvedAt(report.getResolvedAt())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
