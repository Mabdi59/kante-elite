package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Coach;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CoachRepository extends JpaRepository<Coach, Long> {
    Optional<Coach> findByUserId(Long userId);
}
