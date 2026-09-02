package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.config.RabbitMQConfig;
import com.roomily.property.dto.request.JoinRequestCreateRequest;
import com.roomily.property.dto.response.JoinRequestResponse;
import com.roomily.property.entity.JoinRequest;
import com.roomily.property.entity.Room;
import com.roomily.property.entity.RoommatePost;
import com.roomily.property.entity.Tenant;
import com.roomily.property.repository.JoinRequestRepository;
import com.roomily.property.repository.RoomRepository;
import com.roomily.property.repository.RoommatePostRepository;
import com.roomily.property.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final RoommatePostRepository roommatePostRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final RedissonClient redissonClient;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public JoinRequestResponse sendJoinRequest(Long postId, Long userId, JoinRequestCreateRequest req) {
        RoommatePost post = roommatePostRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài đăng ở ghép"));

        if (!"OPEN".equalsIgnoreCase(post.getStatus())) {
            throw new BadRequestException("Bài đăng này không còn nhận yêu cầu ở ghép");
        }

        if (post.getCreatorId().equals(userId)) {
            throw new BadRequestException("Bạn không thể tự xin ở ghép vào bài đăng của chính mình");
        }

        if (joinRequestRepository.existsByPostIdAndUserId(postId, userId)) {
            throw new BadRequestException("Bạn đã gửi yêu cầu cho bài đăng này rồi");
        }

        JoinRequest joinRequest = JoinRequest.builder()
                .post(post)
                .userId(userId)
                .introduction(req != null ? req.getIntroduction() : "")
                .status("PENDING")
                .build();

        JoinRequest saved = joinRequestRepository.save(joinRequest);
        return JoinRequestResponse.fromEntity(saved);
    }

    public List<JoinRequestResponse> getRequestsByPost(Long postId) {
        return joinRequestRepository.findByPostId(postId).stream()
                .map(JoinRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * PHÊ DUYỆT YÊU CẦU Ở GHÉP - REDIS DISTRIBUTED LOCK (REDISSON)
     * Đảm bảo tính nhất quán và chống Race Condition khi nhiều request duyệt đồng thời.
     */
    public Map<String, Object> approveJoinRequestWithLock(Long requestId, Long landlordUserId) {
        JoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu ở ghép"));

        RoommatePost post = joinRequest.getPost();
        Long roomId = post.getRoomId();
        String lockKey = "lock:room:" + roomId;
        RLock lock = redissonClient.getLock(lockKey);

        boolean isLocked = false;
        try {
            // Thử lấy lock trong vòng 5 giây, giữ lock tối đa 10 giây
            isLocked = lock.tryLock(5, 10, TimeUnit.SECONDS);
            if (!isLocked) {
                throw new BadRequestException("Hệ thống đang bận xử lý yêu cầu khác cho phòng này. Vui lòng thử lại sau.");
            }

            // Xử lý nghiệp vụ an toàn sau khi đã có lock
            return executeApprovalUnderLock(joinRequest, landlordUserId);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Quá trình xử lý bị gián đoạn");
        } finally {
            if (isLocked && lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.info("Released lock for key: {}", lockKey);
            }
        }
    }

    @Transactional
    protected Map<String, Object> executeApprovalUnderLock(JoinRequest joinRequest, Long landlordUserId) {
        RoommatePost post = joinRequest.getPost();
        Room room = roomRepository.findById(post.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phòng"));

        // Xác thực quyền chủ trọ
        if (!room.getProperty().getLandlordId().equals(landlordUserId)) {
            throw new BadRequestException("Bạn không có quyền duyệt yêu cầu cho phòng này");
        }

        // Kiểm tra sức chứa
        if (room.getCurrentOccupants() >= room.getCapacity()) {
            joinRequest.setStatus("REJECTED");
            joinRequestRepository.save(joinRequest);
            post.setStatus("FULL");
            roommatePostRepository.save(post);
            
            Map<String, Object> rejectRes = new HashMap<>();
            rejectRes.put("approved", false);
            rejectRes.put("message", "Phòng đã đủ sức chứa. Yêu cầu tự động bị từ chối.");
            return rejectRes;
        }

        // Cập nhật trạng thái
        joinRequest.setStatus("APPROVED");
        joinRequestRepository.save(joinRequest);

        // Tăng số người ở
        room.setCurrentOccupants(room.getCurrentOccupants() + 1);
        if (room.getCurrentOccupants() >= room.getCapacity()) {
            room.setStatus("FULL");
            post.setStatus("FULL");
            roommatePostRepository.save(post);
        }
        roomRepository.save(room);

        // Thêm Tenant
        Tenant tenant = Tenant.builder()
                .userId(joinRequest.getUserId())
                .roomId(room.getId())
                .isStaying(true)
                .build();
        tenantRepository.save(tenant);

        // Bắn Notification Event qua RabbitMQ
        Map<String, Object> event = new HashMap<>();
        event.put("userId", joinRequest.getUserId());
        event.put("title", "Yêu cầu ở ghép đã được chấp thuận");
        event.put("content", "Bạn đã được duyệt vào ở ghép tại phòng " + room.getRoomNumber() + " (" + room.getProperty().getTitle() + ").");
        event.put("type", "JOIN_APPROVED");
        event.put("referenceId", joinRequest.getId());
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "join.approved", event);
        } catch (Exception ex) {
            log.error("Failed to publish join notification event: {}", ex.getMessage());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("approved", true);
        response.put("message", "Đã duyệt yêu cầu ở ghép thành công");
        response.put("tenantId", tenant.getId());
        response.put("currentOccupants", room.getCurrentOccupants());
        response.put("capacity", room.getCapacity());
        return response;
    }
}
