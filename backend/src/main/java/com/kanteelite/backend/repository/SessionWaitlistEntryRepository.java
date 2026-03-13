package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.SessionWaitlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SessionWaitlistEntryRepository extends JpaRepository<SessionWaitlistEntry, Long> {
    List<SessionWaitlistEntry> findBySessionIdOrderByCreatedAtAsc(Long sessionId);
    boolean existsBySessionIdAndParentUserIdAndStatusIgnoreCaseAndPlayerNameIgnoreCase(
            Long sessionId, Long parentUserId, String status, String playerName);
}
