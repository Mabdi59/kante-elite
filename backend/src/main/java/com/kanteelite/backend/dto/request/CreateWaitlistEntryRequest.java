package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateWaitlistEntryRequest {
    @NotBlank
    private String playerName;

    @Size(max = 120)
    private String playerNickname;

    @Min(5)
    @Max(18)
    private Integer playerAge;

    @Size(max = 1000)
    private String notes;
}
