package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import com.roomily.common.exception.ResourceNotFoundException;
import com.roomily.property.dto.request.AmenityRequest;
import com.roomily.property.entity.Amenity;
import com.roomily.property.repository.AmenityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmenityService {

    private final AmenityRepository amenityRepository;

    public List<Amenity> listAll() {
        return amenityRepository.findAllByOrderBySortOrderAscNameAsc();
    }

    public List<Amenity> listActive() {
        return amenityRepository.findByActiveTrueOrderBySortOrderAscNameAsc();
    }

    public Amenity get(Long id) {
        return amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tiện ích"));
    }

    @Transactional
    public Amenity create(AmenityRequest req) {
        String name = req.getName().trim();
        if (amenityRepository.existsByNameIgnoreCase(name)) {
            throw new BadRequestException("Tiện ích \"" + name + "\" đã tồn tại");
        }
        Amenity a = Amenity.builder()
                .name(name)
                .icon(blankToNull(req.getIcon()))
                .active(req.getActive() == null || req.getActive())
                .sortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0)
                .build();
        return amenityRepository.save(a);
    }

    @Transactional
    public Amenity update(Long id, AmenityRequest req) {
        Amenity a = amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tiện ích"));
        String name = req.getName().trim();
        if (amenityRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new BadRequestException("Tiện ích \"" + name + "\" đã tồn tại");
        }
        a.setName(name);
        a.setIcon(blankToNull(req.getIcon()));
        if (req.getActive() != null) a.setActive(req.getActive());
        if (req.getSortOrder() != null) a.setSortOrder(req.getSortOrder());
        return amenityRepository.save(a);
    }

    @Transactional
    public String delete(Long id) {
        Amenity a = amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tiện ích"));
        amenityRepository.delete(a);
        return a.getName();
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
