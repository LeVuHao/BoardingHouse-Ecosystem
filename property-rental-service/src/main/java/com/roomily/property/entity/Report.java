package com.roomily.property.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "reporter_name", length = 100)
    private String reporterName;

    @Column(name = "reporter_email", length = 100)
    private String reporterEmail;

    // ROOM | FORUM_POST
    @Column(name = "target_type", nullable = false, length = 30)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "target_title", length = 255)
    private String targetTitle;

    @Column(name = "target_address", length = 255)
    private String targetAddress;

    @Column(name = "target_owner_id")
    private Long targetOwnerId;

    @Column(name = "target_owner_name", length = 100)
    private String targetOwnerName;

    // SCAM | FAKE_PRICE | MISLEADING_PHOTOS | UNREACHABLE_OR_HARASSMENT | SENSITIVE_CONTENT | OTHER
    @Column(nullable = false, length = 50)
    private String reason;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evidence_images", columnDefinition = "json")
    @Builder.Default
    private List<String> evidenceImages = new ArrayList<>();

    // PENDING | RESOLVED | DISMISSED
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    // WARNING | HIDE_POST | BAN_USER | DISMISS
    @Column(name = "admin_action", length = 30)
    private String adminAction;

    @Column(name = "admin_note", length = 1000)
    private String adminNote;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
