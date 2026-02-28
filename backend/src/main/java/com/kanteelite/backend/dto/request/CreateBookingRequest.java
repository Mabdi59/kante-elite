package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateBookingRequest {
    @NotNull
    private Long sessionId;

    @NotNull
    private Long playerId;
}
