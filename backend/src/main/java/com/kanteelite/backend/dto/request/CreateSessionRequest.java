package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateSessionRequest {
    @NotNull
    private Long coachId;

    @NotBlank
    private String type;

    @NotBlank
    private String title;

    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer capacity;
    private Integer priceCents;
    private String status;
}
