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
public class SiteContentBlockResponse {
    private String key;
    private String title;
    private String subtitle;
    private String body;
    private String ctaLabel;
    private String ctaUrl;
    private String metadataJson;
    private LocalDateTime updatedAt;
}
