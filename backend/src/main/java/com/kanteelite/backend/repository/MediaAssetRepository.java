package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {
    List<MediaAsset> findByActiveTrueOrderBySectionKeyAscDisplayOrderAscIdAsc();
    List<MediaAsset> findBySectionKeyAndActiveTrueOrderByDisplayOrderAscIdAsc(String sectionKey);
    List<MediaAsset> findAllByOrderBySectionKeyAscDisplayOrderAscIdAsc();
    List<MediaAsset> findBySectionKeyOrderByDisplayOrderAscIdAsc(String sectionKey);
}
