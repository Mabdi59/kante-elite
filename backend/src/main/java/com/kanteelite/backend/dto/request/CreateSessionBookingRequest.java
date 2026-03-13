package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSessionBookingRequest {
    @NotBlank
    private String playerName;

    private String playerNickname;

    @NotNull
    @Min(5)
    @Max(18)
    private Integer playerAge;

    private String notes;
}
