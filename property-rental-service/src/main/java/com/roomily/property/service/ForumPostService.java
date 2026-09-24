package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.request.CreateForumPostRequest;
import com.roomily.property.dto.response.ForumPostResponse;
import com.roomily.property.entity.ForumPost;
import com.roomily.property.entity.ForumPostImage;
import com.roomily.property.entity.Property;
import com.roomily.property.entity.Room;
import com.roomily.property.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ForumPostService {

    private final ForumPostRepository forumPostRepository;
    private final ForumPostImageRepository forumPostImageRepository;
    private final TenantRepository tenantRepository;
    private final ContractRepository contractRepository;
    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;

    /**
     * Tự động đảm bảo mỗi ForumPost có 1 Room & Property tương ứng trong hệ thống
     */
    @Transactional
    public Room ensureRoomForPost(ForumPost post) {
        if (post.getRoomId() != null) {
            Optional<Room> existing = roomRepository.findById(post.getRoomId());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        Property property = Property.builder()
                .landlordId(post.getLandlordId())
                .title(post.getTitle() != null ? post.getTitle() : "Phòng trọ")
                .description(post.getDescription())
                .address(post.getAddress() != null ? post.getAddress() : "Chưa cập nhật")
                .city(post.getCity() != null ? post.getCity() : "TP.HCM")
                .district(post.getDistrict() != null ? post.getDistrict() : "Quận 1")
                .ward(post.getWard() != null ? post.getWard() : "")
                .utilities(post.getUtilities())
                .build();
        Property savedProp = propertyRepository.save(property);

        Room room = Room.builder()
                .property(savedProp)
                .roomNumber("P." + (post.getId() != null ? post.getId() : "101"))
                .price(post.getPrice() != null ? post.getPrice() : BigDecimal.valueOf(3000000))
                .area(post.getRoomArea() != null ? post.getRoomArea() : BigDecimal.valueOf(20))
                .capacity(4)
                .currentOccupants(0)
                .status("AVAILABLE")
                .build();
        Room savedRoom = roomRepository.save(room);

        post.setRoomId(savedRoom.getId());
        forumPostRepository.save(post);
        return savedRoom;
    }

    /**
     * Chủ trọ tạo bài đăng cho thuê — hiển thị ngay, không cần admin duyệt
     */
    @Transactional
    public ForumPostResponse createPost(Long landlordId, CreateForumPostRequest req) {
        Property property = Property.builder()
                .landlordId(landlordId)
                .title(req.getTitle())
                .description(req.getDescription())
                .address(req.getAddress())
                .city(req.getCity())
                .district(req.getDistrict())
                .ward(req.getWard())
                .utilities(req.getUtilities())
                .build();
        Property savedProp = propertyRepository.save(property);

        Room room = Room.builder()
                .property(savedProp)
                .roomNumber("P.101")
                .price(req.getPrice())
                .area(req.getRoomArea() != null ? req.getRoomArea() : BigDecimal.valueOf(20))
                .capacity(4)
                .currentOccupants(0)
                .status("AVAILABLE")
                .build();
        Room savedRoom = roomRepository.save(room);

        ForumPost post = ForumPost.builder()
                .landlordId(landlordId)
                .landlordName(req.getLandlordName())
                .title(req.getTitle())
                .description(req.getDescription())
                .price(req.getPrice())
                .address(req.getAddress())
                .city(req.getCity())
                .district(req.getDistrict())
                .ward(req.getWard())
                .contactPhone(req.getContactPhone())
                .roomArea(req.getRoomArea())
                .roomType(req.getRoomType())
                .utilities(req.getUtilities())
                .roomId(savedRoom.getId())
                .status("ACTIVE")
                .build();

        ForumPost saved = forumPostRepository.save(post);

        // Lưu ảnh
        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            for (String url : req.getImageUrls()) {
                if (url != null && !url.isBlank()) {
                    ForumPostImage image = ForumPostImage.builder()
                            .forumPost(saved)
                            .imageUrl(url)
                            .build();
                    forumPostImageRepository.save(image);
                    saved.getImages().add(image);
                }
            }
        }

        return ForumPostResponse.fromEntity(saved);
    }

    /**
     * Lấy tất cả bài đăng đang ACTIVE — public, ai cũng xem được
     */
    public Page<ForumPostResponse> getAllActivePosts(Pageable pageable) {
        return forumPostRepository.findByStatusOrderByCreatedAtDesc("ACTIVE", pageable)
                .map(ForumPostResponse::fromEntity);
    }

    /**
     * Xem chi tiết 1 bài đăng
     */
    public ForumPostResponse getPostDetail(Long id) {
        ForumPost post = forumPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));
        return ForumPostResponse.fromEntity(post);
    }

    /**
     * Lấy danh sách bài đăng của chủ trọ
     */
    public List<ForumPostResponse> getMyPosts(Long landlordId) {
        return forumPostRepository.findByLandlordIdOrderByCreatedAtDesc(landlordId)
                .stream()
                .map(ForumPostResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Chủ trọ đóng bài đăng (không cho hiển thị nữa)
     */
    @Transactional
    public ForumPostResponse closePost(Long postId, Long landlordId) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));

        if (!post.getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không có quyền đóng bài đăng này");
        }

        post.setStatus("CLOSED");
        return ForumPostResponse.fromEntity(forumPostRepository.save(post));
    }

    /**
     * Cập nhật nhu cầu tìm người ở ghép (Cho phép Chủ trọ HOẶC Người đang thuê phòng đó)
     */
    @Transactional
    public ForumPostResponse updateRoommateStatus(Long postId, Long userId, Boolean roommateNeeded, Integer roommateCount, String roommateNote) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));

        boolean isLandlord = post.getLandlordId().equals(userId);
        boolean isTenant = false;

        if (post.getRoomId() != null) {
            isTenant = tenantRepository.existsByUserIdAndRoomIdAndIsStayingTrue(userId, post.getRoomId())
                    || contractRepository.findByRoomIdAndUserIdAndStatus(post.getRoomId(), userId, "ACTIVE").isPresent();
        }

        // Nếu bài đăng chưa gắn roomId, kiểm tra xem người này có hợp đồng thuê nào của chủ trọ đó không
        if (!isLandlord && !isTenant) {
            isTenant = contractRepository.findByUserId(userId).stream()
                    .anyMatch(c -> c.getLandlordId().equals(post.getLandlordId()) && "ACTIVE".equalsIgnoreCase(c.getStatus()));
        }

        if (!isLandlord && !isTenant) {
            throw new BadRequestException("Chỉ chủ trọ hoặc người đã được duyệt thuê phòng này mới có quyền đăng nhu cầu ở ghép!");
        }

        post.setRoommateNeeded(Boolean.TRUE.equals(roommateNeeded));
        if (roommateCount != null) {
            post.setRoommateCount(roommateCount);
        }
        if (roommateNote != null) {
            post.setRoommateNote(roommateNote);
        }

        return ForumPostResponse.fromEntity(forumPostRepository.save(post));
    }

    /**
     * Cập nhật trạng thái đã có người thuê
     */
    @Transactional
    public ForumPostResponse updateRentalStatus(Long postId, Long landlordId, Boolean isRented) {
        ForumPost post = forumPostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng"));

        if (!post.getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa bài đăng này");
        }

        post.setIsRented(Boolean.TRUE.equals(isRented));
        return ForumPostResponse.fromEntity(forumPostRepository.save(post));
    }
}
