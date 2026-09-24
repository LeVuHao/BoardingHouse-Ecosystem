package com.roomily.property.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "forum_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "landlord_id", nullable = false)
    private Long landlordId;

    @Column(name = "landlord_name", length = 100)
    private String landlordName;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(nullable = false, length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String ward;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "room_area", precision = 6, scale = 2)
    private BigDecimal roomArea;

    @Column(name = "room_type", length = 50)
    private String roomType;

    @Column(length = 500)
    private String utilities;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "is_rented", nullable = false)
    @Builder.Default
    private Boolean isRented = false;

    @Column(name = "roommate_needed", nullable = false)
    @Builder.Default
    private Boolean roommateNeeded = false;

    @Column(name = "roommate_count")
    private Integer roommateCount;

    @Column(name = "roommate_note", length = 500)
    private String roommateNote;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE | CLOSED

    @OneToMany(mappedBy = "forumPost", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ForumPostImage> images = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
