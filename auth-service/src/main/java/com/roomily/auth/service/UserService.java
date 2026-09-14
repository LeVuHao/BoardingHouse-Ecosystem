package com.roomily.auth.service;

import com.roomily.auth.entity.User;
import com.roomily.auth.repository.UserRepository;
import com.roomily.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public User activate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với id: " + userId));

        log.info("Activating landlord account for user: {} (current status: {})", user.getEmail(), user.getStatus());

        if (!"PENDING_PAYMENT".equalsIgnoreCase(user.getStatus()) && !"SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            log.warn("User {} is not in PENDING_PAYMENT or SUSPENDED state, skipping activation", user.getEmail());
        }

        user.setStatus("ACTIVE");
        return userRepository.save(user);
    }

    @Transactional
    public User setStatus(Long userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với id: " + userId));
        user.setStatus(status);
        return userRepository.save(user);
    }
}
