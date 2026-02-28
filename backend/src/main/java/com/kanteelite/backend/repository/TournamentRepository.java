package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Tournament;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByStatusIn(List<String> statuses);
}
