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
public class SessionResponse {
    private Long id;
    private Long coachId;
    private String coachName;
    private String type;
    private String title;
    private String description;
    private String location;
    private String ageGroup;
    private String skillLevel;
    private String imageUrl;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer capacity;
    private Integer currentParticipants;
    private Integer priceCents;
    private Integer minAge;
    private Integer maxAge;
    private Integer availableSpots;
    private Boolean featured;
    private Boolean waitlistEnabled;
    private Boolean published;
    private LocalDateTime createdAt;
    private String status;
}
