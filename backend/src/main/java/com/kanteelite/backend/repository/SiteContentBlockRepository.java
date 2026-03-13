package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.SiteContentBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SiteContentBlockRepository extends JpaRepository<SiteContentBlock, Long> {
    Optional<SiteContentBlock> findByContentKey(String contentKey);
    List<SiteContentBlock> findAllByOrderByContentKeyAsc();
}
