package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.config.RabbitMQConfig;
import com.roomily.property.dto.request.CreateRentalRequestDto;
import com.roomily.property.dto.response.RentalRequestResponse;
import com.roomily.property.entity.Contract;
import com.roomily.property.entity.RentalRequest;
import com.roomily.property.entity.Room;
import com.roomily.property.entity.Tenant;
import com.roomily.property.repository.ContractRepository;
import com.roomily.property.repository.RentalRequestRepository;
import com.roomily.property.repository.RoomRepository;
import com.roomily.property.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RentalRequestService {

    private final RentalRequestRepository rentalRequestRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final ContractRepository contractRepository;
    private final RabbitTemplate rabbitTemplate;
    private final RedissonClient redissonClient;
    private final com.roomily.property.repository.ForumPostRepository forumPostRepository;
    private final ForumPostService forumPostService;

    @Transactional
    public RentalRequestResponse createRentalRequest(Long userId, CreateRentalRequestDto req) {
        Room room = null;
        com.roomily.property.entity.ForumPost post = null;

        if (req.getPostId() != null) {
            post = forumPostRepository.findById(req.getPostId()).orElse(null);
            if (post != null) {
                if (post.getRoomId() == null || !roomRepository.existsById(post.getRoomId())) {
                    room = forumPostService.ensureRoomForPost(post);
                } else {
                    room = roomRepository.findById(post.getRoomId()).orElse(null);
                }
            }
        }

        if (room == null && req.getRoomId() != null) {
            room = roomRepository.findById(req.getRoomId()).orElse(null);
        }

        if (room == null) {
            throw new ResourceNotFoundException("Không tìm thấy thông tin phòng hoặc bài đăng để gửi yêu cầu thuê");
        }

        if (!"AVAILABLE".equalsIgnoreCase(room.getStatus()) || room.getCurrentOccupants() >= room.getCapacity()) {
            throw new BadRequestException("Phòng đã đầy hoặc không còn khả dụng để thuê");
        }

        if (tenantRepository.existsByUserIdAndRoomIdAndIsStayingTrue(userId, room.getId())) {
            throw new BadRequestException("Bạn đã là cư dân trong phòng này rồi");
        }

        Long landlordId = room.getProperty() != null ? room.getProperty().getLandlordId() : (post != null ? post.getLandlordId() : null);

        RentalRequest request = RentalRequest.builder()
                .userId(userId)
                .landlordId(landlordId)
                .roomId(room.getId())
                .postId(post != null ? post.getId() : req.getPostId())
                .senderName(req.getSenderName())
                .senderPhone(req.getSenderPhone())
                .note(req.getNote())
                .status("PENDING")
                .build();

        RentalRequest saved = rentalRequestRepository.save(request);

        // Bắn thông báo qua RabbitMQ cho chủ trọ
        try {
            if (landlordId != null) {
                Map<String, Object> event = new HashMap<>();
                event.put("userId", landlordId);
                event.put("title", "Yêu cầu thuê phòng mới");
                String propTitle = room.getProperty() != null && room.getProperty().getTitle() != null
                        ? room.getProperty().getTitle()
                        : (post != null ? post.getTitle() : "");
                String customerName = req.getSenderName() != null && !req.getSenderName().isBlank()
                        ? req.getSenderName()
                        : ("Khách hàng #" + userId);
                event.put("content", customerName + " vừa gửi yêu cầu thuê " + (propTitle.isEmpty() ? "phòng" : propTitle) + ". Hãy kiểm tra và duyệt yêu cầu!");
                event.put("type", "RENTAL_REQUEST");
                event.put("referenceId", saved.getId());
                rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "rental.request", event);
                log.info("Sent new rental request notification to landlord: {}", landlordId);
            }
        } catch (Exception ex) {
            log.warn("Không thể gửi notification cho yêu cầu thuê: {}", ex.getMessage());
        }

        RentalRequestResponse resp = RentalRequestResponse.fromEntity(saved);
        enrichResponse(resp, room, post);
        return resp;
    }

    public List<RentalRequestResponse> getMyRequests(Long userId) {
        return rentalRequestRepository.findByUserId(userId).stream()
                .map(r -> {
                    RentalRequestResponse resp = RentalRequestResponse.fromEntity(r);
                    Room room = roomRepository.findById(r.getRoomId()).orElse(null);
                    com.roomily.property.entity.ForumPost post = r.getPostId() != null
                            ? forumPostRepository.findById(r.getPostId()).orElse(null) : null;
                    enrichResponse(resp, room, post);
                    return resp;
                })
                .collect(Collectors.toList());
    }

    public List<RentalRequestResponse> getRequestsByRoom(Long roomId) {
        return rentalRequestRepository.findByRoomId(roomId).stream()
                .map(r -> {
                    RentalRequestResponse resp = RentalRequestResponse.fromEntity(r);
                    Room room = roomRepository.findById(r.getRoomId()).orElse(null);
                    enrichResponse(resp, room, null);
                    return resp;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> approveRentalRequest(Long requestId, Long landlordUserId) {
        RentalRequest req = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu thuê"));

        Long roomId = req.getRoomId();
        String lockKey = "lock:room:" + roomId;
        RLock lock = redissonClient.getLock(lockKey);

        boolean isLocked = false;
        try {
            isLocked = lock.tryLock(5, 10, TimeUnit.SECONDS);
            if (!isLocked) {
                throw new BadRequestException("Hệ thống đang bận xử lý yêu cầu khác cho phòng này. Vui lòng thử lại sau.");
            }
            return executeRentalApprovalUnderLock(requestId, landlordUserId);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Quá trình xử lý bị gián đoạn");
        } finally {
            if (isLocked && lock.isHeldByCurrentThread()) {
                lock.unlock();
                log.info("Released rental approval lock for key: {}", lockKey);
            }
        }
    }

    @Transactional
    protected Map<String, Object> executeRentalApprovalUnderLock(Long requestId, Long landlordUserId) {
        RentalRequest req = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu thuê"));

        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phòng"));

        boolean isAuthorized = (room.getProperty() != null && room.getProperty().getLandlordId().equals(landlordUserId))
                || (req.getLandlordId() != null && req.getLandlordId().equals(landlordUserId));
        if (!isAuthorized) {
            throw new BadRequestException("Bạn không có quyền duyệt yêu cầu của phòng này");
        }

        if (room.getCurrentOccupants() >= room.getCapacity()) {
            req.setStatus("REJECTED");
            rentalRequestRepository.save(req);
            throw new BadRequestException("Phòng đã hết chỗ trống");
        }

        req.setStatus("APPROVED");
        rentalRequestRepository.save(req);

        room.setCurrentOccupants(room.getCurrentOccupants() + 1);
        if (room.getCurrentOccupants() >= room.getCapacity()) {
            room.setStatus("FULL");
        }
        roomRepository.save(room);

        Tenant tenant = tenantRepository.findByUserIdAndRoomIdAndIsStayingTrue(req.getUserId(), room.getId())
                .orElse(Tenant.builder()
                        .userId(req.getUserId())
                        .roomId(room.getId())
                        .isStaying(true)
                        .build());
        tenant.setIsStaying(true);
        tenantRepository.save(tenant);

        Contract contract = Contract.builder()
                .roomId(room.getId())
                .userId(req.getUserId())
                .tenantId(req.getUserId())
                .landlordId(landlordUserId)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusMonths(12))
                .rentalPrice(room.getPrice())
                .deposit(room.getPrice())
                .depositAmount(room.getPrice())
                .status("ACTIVE")
                .build();
        Contract savedContract = contractRepository.save(contract);

        // Đánh dấu bài đăng diễn đàn tương ứng là đã có người thuê
        try {
            if (req.getPostId() != null) {
                forumPostRepository.findById(req.getPostId()).ifPresent(p -> {
                    p.setIsRented(true);
                    forumPostRepository.save(p);
                    log.info("Auto-marked forum post {} as rented by postId", p.getId());
                });
            }
            forumPostRepository.findByLandlordIdOrderByCreatedAtDesc(landlordUserId).stream()
                    .filter(p -> (p.getRoomId() != null && p.getRoomId().equals(room.getId()))
                            || (p.getTitle() != null && p.getTitle().toLowerCase().contains(room.getRoomNumber().toLowerCase())))
                    .forEach(p -> {
                        p.setIsRented(true);
                        forumPostRepository.save(p);
                        log.info("Auto-marked forum post {} as rented for room {}", p.getId(), room.getId());
                    });
        } catch (Exception ex) {
            log.warn("Không thể cập nhật forum post status khi duyệt thuê: {}", ex.getMessage());
        }

        Map<String, Object> event = new HashMap<>();
        event.put("userId", req.getUserId());
        event.put("title", "Yêu cầu thuê phòng đã được duyệt");
        event.put("content", "Chúc mừng! Chủ trọ đã duyệt yêu cầu thuê phòng " + room.getRoomNumber() + " của bạn.");
        event.put("type", "RENTAL_APPROVED");
        event.put("referenceId", savedContract.getId());
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "rental.approved", event);
        } catch (Exception ignored) {
        }

        Map<String, Object> response = new HashMap<>();
        response.put("requestId", req.getId());
        response.put("status", "APPROVED");
        response.put("contractId", savedContract.getId());
        response.put("tenantId", tenant.getId());
        response.put("message", "Đã duyệt thành công yêu cầu thuê phòng và kích hoạt hợp đồng");
        return response;
    }

    @Transactional
    public RentalRequestResponse rejectRentalRequest(Long requestId, Long landlordUserId) {
        RentalRequest req = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu thuê"));

        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phòng"));

        boolean isAuthorized = (room.getProperty() != null && room.getProperty().getLandlordId().equals(landlordUserId))
                || (req.getLandlordId() != null && req.getLandlordId().equals(landlordUserId));
        if (!isAuthorized) {
            throw new BadRequestException("Bạn không có quyền từ chối yêu cầu của phòng này");
        }

        req.setStatus("REJECTED");
        RentalRequest saved = rentalRequestRepository.save(req);
        RentalRequestResponse resp = RentalRequestResponse.fromEntity(saved);
        enrichResponse(resp, room, null);
        return resp;
    }

    public Page<RentalRequestResponse> listForLandlord(Long landlordUserId, String status, Pageable pageable) {
        Page<RentalRequest> page;
        if (status != null && !status.isBlank()) {
            page = rentalRequestRepository.findByLandlordIdAndStatus(landlordUserId, status, pageable);
        } else {
            page = rentalRequestRepository.findByLandlordId(landlordUserId, pageable);
        }

        if (page == null || page.isEmpty()) {
            List<Long> landlordRoomIds = roomRepository.findByProperty_LandlordId(landlordUserId)
                    .stream()
                    .map(Room::getId)
                    .toList();

            if (!landlordRoomIds.isEmpty()) {
                if (status != null && !status.isBlank()) {
                    page = rentalRequestRepository.findByRoomIdInAndStatus(landlordRoomIds, status, pageable);
                } else {
                    page = rentalRequestRepository.findByRoomIdIn(landlordRoomIds, pageable);
                }
            }
        }

        if (page == null) {
            return Page.empty(pageable);
        }

        return page.map(r -> {
            RentalRequestResponse resp = RentalRequestResponse.fromEntity(r);
            Room room = roomRepository.findById(r.getRoomId()).orElse(null);
            com.roomily.property.entity.ForumPost post = r.getPostId() != null
                    ? forumPostRepository.findById(r.getPostId()).orElse(null) : null;
            enrichResponse(resp, room, post);
            return resp;
        });
    }

    private void enrichResponse(RentalRequestResponse resp, Room room, com.roomily.property.entity.ForumPost post) {
        if (room != null) {
            resp.setRoomNumber(room.getRoomNumber());
            if (room.getProperty() != null) {
                resp.setPropertyTitle(room.getProperty().getTitle());
            }
        }
        if (post != null) {
            resp.setPostTitle(post.getTitle());
            if (resp.getPropertyTitle() == null) {
                resp.setPropertyTitle(post.getTitle());
            }
        }
    }
}
