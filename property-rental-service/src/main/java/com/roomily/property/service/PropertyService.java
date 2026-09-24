package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.request.CreatePropertyRequest;
import com.roomily.property.dto.request.CreateRoomRequest;
import com.roomily.property.dto.response.PropertyResponse;
import com.roomily.property.dto.response.RoomResponse;
import com.roomily.property.entity.Property;
import com.roomily.property.entity.Room;
import com.roomily.property.entity.RoomImage;
import com.roomily.property.repository.PropertyRepository;
import com.roomily.property.repository.RoomImageRepository;
import com.roomily.property.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;

    @Transactional
    public PropertyResponse createProperty(Long landlordId, CreatePropertyRequest req) {
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

        Property saved = propertyRepository.save(property);
        return PropertyResponse.fromEntity(saved);
    }

    public List<PropertyResponse> getMyProperties(Long landlordId) {
        return propertyRepository.findByLandlordId(landlordId).stream()
                .map(PropertyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public PropertyResponse getPropertyDetail(Long id) {
        Property p = propertyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin khu trọ"));
        return PropertyResponse.fromEntity(p);
    }

    /**
     * [HUY] Cập nhật thông tin khu trọ (partial update - chỉ cập nhật field nào có giá trị)
     */
    @Transactional
    public PropertyResponse updateProperty(Long landlordId, Long propertyId, com.roomily.property.dto.request.UpdatePropertyRequest req) {
        Property p = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khu trọ"));
        if (!p.getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa khu trọ này");
        }
        if (req.getTitle() != null && !req.getTitle().isBlank()) p.setTitle(req.getTitle());
        if (req.getDescription() != null) p.setDescription(req.getDescription());
        if (req.getAddress() != null && !req.getAddress().isBlank()) p.setAddress(req.getAddress());
        if (req.getCity() != null && !req.getCity().isBlank()) p.setCity(req.getCity());
        if (req.getDistrict() != null && !req.getDistrict().isBlank()) p.setDistrict(req.getDistrict());
        if (req.getWard() != null && !req.getWard().isBlank()) p.setWard(req.getWard());
        if (req.getUtilities() != null) p.setUtilities(req.getUtilities());
        return PropertyResponse.fromEntity(propertyRepository.save(p));
    }

    @Transactional
    public RoomResponse createRoom(Long landlordId, CreateRoomRequest req) {
        Property property = propertyRepository.findById(req.getPropertyId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khu trọ"));

        if (!property.getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không có quyền thêm phòng vào khu trọ này");
        }

        Room room = Room.builder()
                .property(property)
                .roomNumber(req.getRoomNumber())
                .price(req.getPrice())
                .area(req.getArea())
                .capacity(req.getCapacity())
                .currentOccupants(0)
                .status("AVAILABLE")
                .build();

        Room savedRoom = roomRepository.save(room);

        if (req.getImageUrls() != null && !req.getImageUrls().isEmpty()) {
            boolean first = true;
            for (String url : req.getImageUrls()) {
                RoomImage image = RoomImage.builder()
                        .room(savedRoom)
                        .imageUrl(url)
                        .isPrimary(first)
                        .build();
                first = false;
                roomImageRepository.save(image);
                savedRoom.getImages().add(image);
            }
        }

        return RoomResponse.fromEntity(savedRoom);
    }

    /**
     * [HUY] Cập nhật thông tin phòng (partial update)
     */
    @Transactional
    public RoomResponse updateRoom(Long landlordId, Long roomId, com.roomily.property.dto.request.UpdateRoomRequest req) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng trọ"));
        if (!room.getProperty().getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa phòng này");
        }
        if (req.getRoomNumber() != null && !req.getRoomNumber().isBlank()) room.setRoomNumber(req.getRoomNumber());
        if (req.getPrice() != null) room.setPrice(req.getPrice());
        if (req.getArea() != null) room.setArea(req.getArea());
        if (req.getCapacity() != null) room.setCapacity(req.getCapacity());
        if (req.getStatus() != null && (req.getStatus().equals("AVAILABLE") || req.getStatus().equals("MAINTENANCE"))) {
            room.setStatus(req.getStatus());
        }
        return RoomResponse.fromEntity(roomRepository.save(room));
    }

    /**
     * [HUY] Thêm ảnh vào phòng trọ (append - không xóa ảnh cũ)
     */
    @Transactional
    public List<String> addRoomImages(Long landlordId, Long roomId, List<String> imageUrls) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng trọ"));
        if (!room.getProperty().getLandlordId().equals(landlordId)) {
            throw new BadRequestException("Bạn không có quyền thêm ảnh cho phòng này");
        }
        boolean noPrimary = room.getImages().isEmpty();
        for (String url : imageUrls) {
            RoomImage image = RoomImage.builder()
                    .room(room)
                    .imageUrl(url)
                    .isPrimary(noPrimary)
                    .build();
            noPrimary = false;
            roomImageRepository.save(image);
            room.getImages().add(image);
        }
        return room.getImages().stream().map(RoomImage::getImageUrl).collect(Collectors.toList());
    }

    public Page<RoomResponse> searchRooms(
            String city,
            String district,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            BigDecimal minArea,
            String status,
            Pageable pageable) {
        return roomRepository.searchRooms(city, district, minPrice, maxPrice, minArea, status, pageable)
                .map(RoomResponse::fromEntity);
    }

    public RoomResponse getRoomDetail(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin phòng trọ"));
        return RoomResponse.fromEntity(room);
    }

    public List<RoomResponse> getRoomsByProperty(Long propertyId) {
        return roomRepository.findByPropertyId(propertyId).stream()
                .map(RoomResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
