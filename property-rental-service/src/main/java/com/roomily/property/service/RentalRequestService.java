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
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RentalRequestService {

    private final RentalRequestRepository rentalRequestRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final ContractRepository contractRepository;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public RentalRequestResponse createRentalRequest(Long userId, CreateRentalRequestDto req) {
        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng"));

        if (!"AVAILABLE".equalsIgnoreCase(room.getStatus()) || room.getCurrentOccupants() >= room.getCapacity()) {
            throw new BadRequestException("Phòng đã đầy hoặc không còn khả dụng để thuê");
        }

        if (tenantRepository.existsByUserIdAndRoomIdAndIsStayingTrue(userId, req.getRoomId())) {
            throw new BadRequestException("Bạn đã là cư dân trong phòng này rồi");
        }

        RentalRequest request = RentalRequest.builder()
                .userId(userId)
                .roomId(req.getRoomId())
                .note(req.getNote())
                .status("PENDING")
                .build();

        RentalRequest saved = rentalRequestRepository.save(request);
        return RentalRequestResponse.fromEntity(saved);
    }

    public List<RentalRequestResponse> getMyRequests(Long userId) {
        return rentalRequestRepository.findByUserId(userId).stream()
                .map(RentalRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<RentalRequestResponse> getRequestsByRoom(Long roomId) {
        return rentalRequestRepository.findByRoomId(roomId).stream()
                .map(RentalRequestResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> approveRentalRequest(Long requestId, Long landlordUserId) {
        RentalRequest req = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu thuê"));

        Room room = roomRepository.findById(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phòng"));

        if (!room.getProperty().getLandlordId().equals(landlordUserId)) {
            throw new BadRequestException("Bạn không có quyền duyệt yêu cầu của phòng này");
        }

        if (room.getCurrentOccupants() >= room.getCapacity()) {
            req.setStatus("REJECTED");
            rentalRequestRepository.save(req);
            throw new BadRequestException("Phòng đã hết chỗ trống");
        }

        // Cập nhật trạng thái yêu cầu
        req.setStatus("APPROVED");
        rentalRequestRepository.save(req);

        // Tăng số lượng người đang ở
        room.setCurrentOccupants(room.getCurrentOccupants() + 1);
        if (room.getCurrentOccupants() >= room.getCapacity()) {
            room.setStatus("FULL");
        }
        roomRepository.save(room);

        // Thêm Tenant
        Tenant tenant = Tenant.builder()
                .userId(req.getUserId())
                .roomId(room.getId())
                .isStaying(true)
                .build();
        tenantRepository.save(tenant);

        // Tạo Contract
        Contract contract = Contract.builder()
                .roomId(room.getId())
                .userId(req.getUserId())
                .landlordId(landlordUserId)
                .startDate(LocalDate.now())
                .rentalPrice(room.getPrice())
                .status("ACTIVE")
                .build();
        Contract savedContract = contractRepository.save(contract);

        // Gửi Notification qua RabbitMQ
        Map<String, Object> event = new HashMap<>();
        event.put("userId", req.getUserId());
        event.put("title", "Yêu cầu thuê phòng đã được duyệt");
        event.put("content", "Chúc mừng! Chủ trọ đã duyệt yêu cầu thuê phòng " + room.getRoomNumber() + " của bạn.");
        event.put("type", "RENTAL_APPROVED");
        event.put("referenceId", savedContract.getId());
        try {
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, "rental.approved", event);
        } catch (Exception ignored) {
            // Không làm gián đoạn transaction nếu message broker offline tạm thời
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

        if (!room.getProperty().getLandlordId().equals(landlordUserId)) {
            throw new BadRequestException("Bạn không có quyền từ chối yêu cầu của phòng này");
        }

        req.setStatus("REJECTED");
        RentalRequest saved = rentalRequestRepository.save(req);
        return RentalRequestResponse.fromEntity(saved);
    }
}
