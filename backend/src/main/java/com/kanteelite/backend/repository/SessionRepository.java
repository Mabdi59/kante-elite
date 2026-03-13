package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Session;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findByStatusOrderByStartTimeAsc(String status);
    List<Session> findByStatusAndPublishedTrueOrderByStartTimeAsc(String status);
    List<Session> findAllByOrderByStartTimeAsc();
    Optional<Session> findFirstByStatusAndPublishedTrueAndFeaturedTrueOrderByStartTimeAsc(String status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Session s where s.id = :id")
    Optional<Session> findByIdForUpdate(@Param("id") Long id);

    @Modifying
    @Query("update Session s set s.featured = false where s.featured = true")
    int clearFeaturedFlag();
}
