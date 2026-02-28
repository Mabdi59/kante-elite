package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByParentUserId(Long parentUserId);
}
