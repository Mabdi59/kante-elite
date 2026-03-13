package com.kanteelite.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaAssetResponse {
    private Long id;
    private String sectionKey;
    private String mediaType;
    private String title;
    private String description;
    private String url;
    private String thumbnailUrl;
    private Integer displayOrder;
    private Boolean active;
    private LocalDateTime updatedAt;
}
