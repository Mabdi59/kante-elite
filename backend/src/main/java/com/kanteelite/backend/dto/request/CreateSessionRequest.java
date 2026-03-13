package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateSessionRequest {
    private Long coachId;

    @NotBlank
    @Pattern(regexp = "PRIVATE|GROUP|SPEED|SPEED_AND_AGILITY")
    private String type;

    @NotBlank
    @Size(min = 3, max = 120)
    private String title;

    private String description;

    private String location;

    private String ageGroup;

    @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED|ALL_LEVELS")
    private String skillLevel;

    @Size(max = 1024)
    private String imageUrl;

    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;

    @NotNull
    @Min(1)
    @Max(200)
    private Integer capacity;

    @NotNull
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

    @Min(1)
    @Max(52)
    private Integer repeatWeeklyCount;

    @Pattern(regexp = "ACTIVE|CANCELLED|COMPLETED")
    private String status;
}
