package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.request.CreateRoommatePostRequest;
import com.roomily.property.dto.response.RoommatePostResponse;
import com.roomily.property.entity.RoommatePost;
import com.roomily.property.repository.RoomRepository;
import com.roomily.property.repository.RoommatePostRepository;
import com.roomily.property.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoommatePostService {

    private final RoommatePostRepository roommatePostRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;

    @Transactional
    public RoommatePostResponse createPost(Long creatorId, CreateRoommatePostRequest req) {
        roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phòng"));

        // Xác nhận người tạo bài phải là tenant đang ở tại phòng
        boolean isTenant = tenantRepository.existsByUserIdAndRoomIdAndIsStayingTrue(creatorId, req.getRoomId());
        if (!isTenant) {
            throw new BadRequestException("Bạn phải là người đang thuê phòng này mới được đăng bài tìm ở ghép");
        }

        RoommatePost post = RoommatePost.builder()
                .roomId(req.getRoomId())
                .creatorId(creatorId)
                .title(req.getTitle())
                .description(req.getDescription())
                .priceShare(req.getPriceShare())
                .status("OPEN")
                .build();

        RoommatePost saved = roommatePostRepository.save(post);
        return RoommatePostResponse.fromEntity(saved);
    }

    public Page<RoommatePostResponse> searchPosts(String city, String status, Pageable pageable) {
        return roommatePostRepository.searchPosts(city, status, pageable)
                .map(RoommatePostResponse::fromEntity);
    }

    public RoommatePostResponse getPostDetail(Long id) {
        RoommatePost post = roommatePostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng ở ghép"));
        return RoommatePostResponse.fromEntity(post);
    }
}
