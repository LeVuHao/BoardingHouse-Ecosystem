package com.roomily.auth.service;

import com.roomily.auth.dto.response.AuditLogResponse;
import com.roomily.auth.entity.AuditLog;
import com.roomily.auth.entity.User;
import com.roomily.auth.repository.AuditLogRepository;
import com.roomily.auth.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(String keyword, String action, LocalDate from, LocalDate to, Pageable pageable) {
        Specification<AuditLog> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (action != null && !action.isBlank()) {
                ps.add(cb.equal(root.get("action"), action.trim().toUpperCase()));
            }
            if (keyword != null && !keyword.isBlank()) {
                String like = "%" + keyword.trim().toLowerCase() + "%";
                ps.add(cb.or(
                        cb.like(cb.lower(root.<String>get("adminEmail")), like),
                        cb.like(cb.lower(root.<String>get("action")), like),
                        cb.like(cb.lower(root.<String>get("details")), like)));
            }
            if (from != null) {
                ps.add(cb.greaterThanOrEqualTo(root.<LocalDateTime>get("createdAt"), from.atStartOfDay()));
            }
            if (to != null) {
                // đến hết ngày "to"
                ps.add(cb.lessThan(root.<LocalDateTime>get("createdAt"), to.plusDays(1).atStartOfDay()));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };

        Page<AuditLog> page = auditLogRepository.findAll(spec, pageable);

        Set<String> emails = page.getContent().stream()
                .map(AuditLog::getAdminEmail).filter(e -> e != null && !e.isBlank())
                .collect(Collectors.toSet());
        Map<String, String> names = new HashMap<>();
        if (!emails.isEmpty()) {
            for (User u : userRepository.findByEmailIn(emails)) {
                names.put(u.getEmail(), u.getFullName());
            }
        }

        return page.map(l -> AuditLogResponse.builder()
                .id(l.getId())
                .adminEmail(l.getAdminEmail())
                .adminName(names.getOrDefault(l.getAdminEmail(), l.getAdminEmail()))
                .action(l.getAction())
                .details(l.getDetails())
                .ipAddress(l.getIpAddress())
                .createdAt(l.getCreatedAt())
                .build());
    }

    @Transactional(readOnly = true)
    public List<String> listActions() {
        return auditLogRepository.findDistinctActions();
    }

    @Transactional
    public void record(String adminEmail, String action, String details, String ipAddress) {
        auditLogRepository.save(AuditLog.builder()
                .adminEmail(blankTo(adminEmail, "SystemAdmin"))
                .action(blankTo(action, "UNKNOWN").toUpperCase())
                .details(truncate(details, 1000))
                .ipAddress(ipAddress)
                .build());
    }

    private static String blankTo(String s, String fallback) {
        return (s == null || s.isBlank()) ? fallback : s.trim();
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() > max ? s.substring(0, max - 1) + "…" : s;
    }
}
