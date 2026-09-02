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
