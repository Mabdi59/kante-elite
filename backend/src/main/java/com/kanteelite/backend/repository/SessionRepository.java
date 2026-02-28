package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByStatus(String status);
}
