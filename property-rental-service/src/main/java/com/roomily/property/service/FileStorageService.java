package com.roomily.property.service;

import com.roomily.common.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path rootUploadPath = Paths.get("uploads/rooms").toAbsolutePath().normalize();

    public FileStorageService() {
        try {
            Files.createDirectories(rootUploadPath);
        } catch (IOException e) {
            log.error("Could not initialize upload folder: {}", e.getMessage());
        }
    }

    public List<String> storeRoomImages(Long roomId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("Danh sách file tải lên không được rỗng");
        }

        List<String> fileUrls = new ArrayList<>();
        Path targetDir = rootUploadPath.resolve(String.valueOf(roomId));

        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            log.error("Could not create directory for room {}: {}", roomId, e.getMessage());
            throw new BadRequestException("Không thể tạo thư mục lưu trữ ảnh phòng");
        }

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "image.jpg");
            String extension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalFilename.substring(dotIndex).toLowerCase();
            } else {
                extension = ".jpg";
            }

            // Kiểm tra định dạng ảnh hợp lệ
            if (!extension.matches("\\.(jpg|jpeg|png|webp|gif)")) {
                throw new BadRequestException("Định dạng file không hỗ trợ: " + originalFilename + ". Chỉ chấp nhận JPG, PNG, WEBP, GIF.");
            }

            String newFilename = "room_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
            Path destinationFile = targetDir.resolve(newFilename).normalize();

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
                String relativeUrl = "/uploads/rooms/" + roomId + "/" + newFilename;
                fileUrls.add(relativeUrl);
                log.info("Saved room image to: {}", relativeUrl);
            } catch (IOException e) {
                log.error("Failed to store file {}: {}", originalFilename, e.getMessage());
                throw new BadRequestException("Lỗi lưu trữ file " + originalFilename);
            }
        }

        return fileUrls;
    }
}
