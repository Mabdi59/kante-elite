package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Coach;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoachRepository extends JpaRepository<Coach, Long> {
}
