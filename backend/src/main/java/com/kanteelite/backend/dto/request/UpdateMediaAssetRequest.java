package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateMediaAssetRequest {
    @Size(max = 120)
    private String sectionKey;

    @Pattern(regexp = "PHOTO|VIDEO")
    private String mediaType;

    @Size(max = 255)
    private String title;

    private String description;

    @Size(max = 1024)
    private String url;

    @Size(max = 1024)
    private String thumbnailUrl;

    @Min(0)
    private Integer displayOrder;

    private Boolean active;
}
