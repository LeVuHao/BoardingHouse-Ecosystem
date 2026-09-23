package com.roomily.auth.repository;

import com.roomily.auth.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {
    Optional<VerificationCode> findTopByUserIdAndTypeOrderByIdDesc(Long userId, String type);
    void deleteByUserIdAndType(Long userId, String type);
}