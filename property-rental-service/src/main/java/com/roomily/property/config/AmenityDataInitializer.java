package com.roomily.property.config;

import com.roomily.property.entity.Amenity;
import com.roomily.property.repository.AmenityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Nạp danh mục tiện ích mặc định (chính là danh sách trước đây hardcode ở frontend)
 * khi bảng amenities còn trống, để hệ thống chạy được ngay sau khi nâng cấp.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AmenityDataInitializer implements CommandLineRunner {

    private final AmenityRepository amenityRepository;

    @Override
    public void run(String... args) {
        if (amenityRepository.count() > 0) return;

        String[][] defaults = {
                {"Wifi", "Wifi"},
                {"Máy lạnh", "AirVent"},
                {"Máy giặt", "WashingMachine"},
                {"Chỗ để xe", "Car"},
                {"Camera an ninh", "Camera"},
                {"Gác lửng", "Layers"},
                {"Tủ lạnh", "Refrigerator"},
                {"Giờ giấc tự do", "Clock"},
        };
        int order = 0;
        for (String[] d : defaults) {
            amenityRepository.save(Amenity.builder()
                    .name(d[0]).icon(d[1]).active(true).sortOrder(order++).build());
        }
        log.info("Đã nạp {} tiện ích mặc định", defaults.length);
    }
}
