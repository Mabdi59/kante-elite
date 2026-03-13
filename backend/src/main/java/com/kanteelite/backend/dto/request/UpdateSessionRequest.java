package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateSessionRequest {
    private Long coachId;

    @Pattern(regexp = "PRIVATE|GROUP|SPEED|SPEED_AND_AGILITY")
    private String type;

    @Size(min = 3, max = 120)
    private String title;

    private String description;

    private String location;
    private String ageGroup;

    @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED|ALL_LEVELS")
    private String skillLevel;

    @Size(max = 1024)
    private String imageUrl;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Min(1)
    @Max(200)
    private Integer capacity;

    @Min(0)
    private Integer priceCents;

    @Min(5)
    @Max(18)
    private Integer minAge;

    @Min(5)
    @Max(18)
    private Integer maxAge;

    private Boolean featured;
    private Boolean waitlistEnabled;
    private Boolean published;

    @Pattern(regexp = "ACTIVE|CANCELLED|COMPLETED")
    private String status;
}
