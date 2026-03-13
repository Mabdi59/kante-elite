package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
    boolean existsByTournamentIdAndNameIgnoreCase(Long tournamentId, String name);
    boolean existsByTournamentIdAndNameIgnoreCaseAndIdNot(Long tournamentId, String name, Long id);
    long deleteByTournamentId(Long tournamentId);
}
