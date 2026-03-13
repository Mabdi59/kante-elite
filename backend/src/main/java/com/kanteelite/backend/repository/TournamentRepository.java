package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Tournament;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByStatusIn(List<String> statuses);
    List<Tournament> findByStatusOrderByStartDateAsc(String status);
    List<Tournament> findAllByOrderByStartDateAsc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tournament t where t.id = :id")
    Optional<Tournament> findByIdForUpdate(@Param("id") Long id);
}
