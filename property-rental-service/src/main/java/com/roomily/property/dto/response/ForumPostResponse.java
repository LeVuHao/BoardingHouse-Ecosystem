package com.roomily.property.dto.response;

import com.roomily.property.entity.ForumPost;
import com.roomily.property.entity.ForumPostImage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForumPostResponse {

    private Long id;
    private Long landlordId;
    private String landlordName;
    private String title;
    private String description;
    private BigDecimal price;
    private String address;
    private String city;
    private String district;
    private String ward;
    private String contactPhone;
    private BigDecimal roomArea;
    private String roomType;
    private String utilities;
    private Long roomId;
    private Boolean isRented;
    private Boolean roommateNeeded;
    private Integer roommateCount;
    private String roommateNote;
    private String status;
    private List<String> images;
    private LocalDateTime createdAt;

    public static ForumPostResponse fromEntity(ForumPost post) {
        if (post == null) return null;

        List<String> imgUrls = post.getImages() != null ?
                post.getImages().stream()
                        .map(ForumPostImage::getImageUrl)
                        .collect(Collectors.toList()) :
                Collections.emptyList();

        return ForumPostResponse.builder()
                .id(post.getId())
                .landlordId(post.getLandlordId())
                .landlordName(post.getLandlordName())
                .title(post.getTitle())
                .description(post.getDescription())
                .price(post.getPrice())
                .address(post.getAddress())
                .city(post.getCity())
                .district(post.getDistrict())
                .ward(post.getWard())
                .contactPhone(post.getContactPhone())
                .roomArea(post.getRoomArea())
                .roomType(post.getRoomType())
                .utilities(post.getUtilities())
                .roomId(post.getRoomId())
                .isRented(post.getIsRented())
                .roommateNeeded(post.getRoommateNeeded())
                .roommateCount(post.getRoommateCount())
                .roommateNote(post.getRoommateNote())
                .status(post.getStatus())
                .images(imgUrls)
                .createdAt(post.getCreatedAt())
                .build();
    }
}
