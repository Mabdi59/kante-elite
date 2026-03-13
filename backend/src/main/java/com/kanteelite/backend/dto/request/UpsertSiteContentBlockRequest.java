package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpsertSiteContentBlockRequest {
    @Size(max = 255)
    private String title;

    @Size(max = 512)
    private String subtitle;

    private String body;

    @Size(max = 120)
    private String ctaLabel;

    @Size(max = 512)
    private String ctaUrl;

    private String metadataJson;
}
