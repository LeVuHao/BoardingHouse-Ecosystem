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
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal area;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "current_occupants", nullable = false)
    @Builder.Default
    private Integer currentOccupants = 0;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "AVAILABLE"; // AVAILABLE | FULL | MAINTENANCE

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Integer version = 0;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RoomImage> images = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
