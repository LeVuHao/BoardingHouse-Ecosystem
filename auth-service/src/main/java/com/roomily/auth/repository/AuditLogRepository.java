package com.roomily.auth.repository;

import com.roomily.auth.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    @Query("SELECT DISTINCT a.action FROM AuditLog a WHERE a.action IS NOT NULL ORDER BY a.action")
    List<String> findDistinctActions();
}
