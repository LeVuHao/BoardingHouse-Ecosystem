package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.response.ContractResponse;
import com.roomily.property.entity.Contract;
import com.roomily.property.entity.ForumPostImage;
import com.roomily.property.entity.RoomImage;
import com.roomily.property.repository.ContractRepository;
import com.roomily.property.repository.ForumPostRepository;
import com.roomily.property.repository.RoomRepository;
import com.roomily.property.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final ForumPostRepository forumPostRepository;

    /**
     * [HUY] User xem hợp đồng / trọ của mình
     */
    public List<ContractResponse> getMyContracts(Long userId) {
        return contractRepository.findByTenantId(userId).stream()
                .map(this::enrichContractResponse)
                .collect(Collectors.toList());
    }

    /**
     * [HUY] Landlord xem hợp đồng thuộc khu trọ của mình
     */
    public List<ContractResponse> getLandlordContracts(Long landlordId) {
        return contractRepository.findByLandlordId(landlordId).stream()
                .map(this::enrichContractResponse)
                .collect(Collectors.toList());
    }

    /**
     * Xem chi tiết một hợp đồng
     */
    public ContractResponse getContractDetail(Long contractId) {
        return contractRepository.findById(contractId)
                .map(this::enrichContractResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng"));
    }

    /**
     * Làm giàu dữ liệu hợp đồng với thông tin phòng, ảnh, địa chỉ, chủ trọ và bạn cùng phòng
     */
    private ContractResponse enrichContractResponse(Contract c) {
        ContractResponse res = ContractResponse.fromEntity(c);
        if (c == null) return res;

        // 1. Thông tin từ Room
        if (c.getRoomId() != null) {
            roomRepository.findById(c.getRoomId()).ifPresent(room -> {
                res.setRoomNumber(room.getRoomNumber());
                res.setRoomArea(room.getArea());
                res.setCapacity(room.getCapacity());
                res.setCurrentOccupants(room.getCurrentOccupants());
                if (room.getProperty() != null) {
                    res.setPropertyTitle(room.getProperty().getTitle());
                    res.setAddress(room.getProperty().getAddress());
                    res.setCity(room.getProperty().getCity());
                    res.setDistrict(room.getProperty().getDistrict());
                    res.setWard(room.getProperty().getWard());
                }
                if (room.getImages() != null && !room.getImages().isEmpty()) {
                    res.setImages(room.getImages().stream().map(RoomImage::getImageUrl).collect(Collectors.toList()));
                }
            });

            // Danh sách bạn cùng phòng
            List<String> roommates = tenantRepository.findByRoomIdAndIsStayingTrue(c.getRoomId()).stream()
                    .filter(t -> !t.getUserId().equals(c.getUserId()))
                    .map(t -> t.getFullName() != null ? t.getFullName() : ("Bạn cùng phòng #" + t.getUserId()))
                    .collect(Collectors.toList());
            res.setRoommates(roommates);
        }

        // 2. Tìm bài đăng Forum liên quan để lấy ảnh đẹp, hotline chủ trọ, tiện ích
        forumPostRepository.findByLandlordIdOrderByCreatedAtDesc(c.getLandlordId()).stream()
                .filter(p -> (p.getRoomId() != null && p.getRoomId().equals(c.getRoomId())) ||
                        (res.getRoomNumber() != null && p.getTitle() != null && p.getTitle().toLowerCase().contains(res.getRoomNumber().toLowerCase())))
                .findFirst()
                .ifPresent(post -> {
                    res.setPostId(post.getId());
                    if (res.getLandlordName() == null) res.setLandlordName(post.getLandlordName());
                    if (res.getLandlordPhone() == null) res.setLandlordPhone(post.getContactPhone());
                    if (res.getUtilities() == null) res.setUtilities(post.getUtilities());
                    if (res.getPropertyTitle() == null) res.setPropertyTitle(post.getTitle());
                    if (res.getAddress() == null) res.setAddress(post.getAddress());
                    if (res.getCity() == null) res.setCity(post.getCity());
                    if (res.getDistrict() == null) res.setDistrict(post.getDistrict());
                    if (res.getWard() == null) res.setWard(post.getWard());
                    if (res.getImages() == null || res.getImages().isEmpty()) {
                        if (post.getImages() != null && !post.getImages().isEmpty()) {
                            res.setImages(post.getImages().stream().map(ForumPostImage::getImageUrl).collect(Collectors.toList()));
                        }
                    }
                });

        // 3. Nếu vẫn chưa có ảnh, tìm bài đăng bất kỳ của chủ trọ đó để lấy ảnh mẫu
        if (res.getImages() == null || res.getImages().isEmpty()) {
            forumPostRepository.findByLandlordIdOrderByCreatedAtDesc(c.getLandlordId()).stream()
                    .filter(p -> p.getImages() != null && !p.getImages().isEmpty())
                    .findFirst()
                    .ifPresent(p -> {
                        if (res.getPostId() == null) res.setPostId(p.getId());
                        if (res.getLandlordName() == null) res.setLandlordName(p.getLandlordName());
                        if (res.getLandlordPhone() == null) res.setLandlordPhone(p.getContactPhone());
                        if (res.getUtilities() == null) res.setUtilities(p.getUtilities());
                        res.setImages(p.getImages().stream().map(ForumPostImage::getImageUrl).collect(Collectors.toList()));
                    });
        }

        return res;
    }

    /**
     * Thanh lý / Chấm dứt hợp đồng khi khách dọn đi (trả phòng)
     */
    @Transactional
    public ContractResponse terminateContract(Long contractId, Long requesterId, String userRole) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng"));

        boolean isLandlord = contract.getLandlordId().equals(requesterId);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);
        boolean isTenant = contract.getUserId().equals(requesterId);

        if (!isLandlord && !isAdmin && !isTenant) {
            throw new BadRequestException("Bạn không có quyền thao tác trên hợp đồng này");
        }

        if ("TERMINATED".equalsIgnoreCase(contract.getStatus()) || "EXPIRED".equalsIgnoreCase(contract.getStatus())) {
            throw new BadRequestException("Hợp đồng này đã được thanh lý hoặc kết thúc trước đó");
        }

        contract.setStatus("TERMINATED");
        Contract saved = contractRepository.save(contract);

        // 1. Cập nhật phòng: Giảm số người ở và mở lại AVAILABLE nếu đang FULL
        if (contract.getRoomId() != null) {
            roomRepository.findById(contract.getRoomId()).ifPresent(room -> {
                int newOccupants = Math.max(0, room.getCurrentOccupants() - 1);
                room.setCurrentOccupants(newOccupants);
                if ("FULL".equalsIgnoreCase(room.getStatus()) && newOccupants < room.getCapacity()) {
                    room.setStatus("AVAILABLE");
                }
                roomRepository.save(room);
            });

            // 2. Cập nhật Tenant: Đánh dấu isStaying = false
            tenantRepository.findByUserIdAndRoomIdAndIsStayingTrue(contract.getUserId(), contract.getRoomId())
                    .ifPresent(tenant -> {
                        tenant.setIsStaying(false);
                        tenantRepository.save(tenant);
                    });
        }

        return enrichContractResponse(saved);
    }
}
