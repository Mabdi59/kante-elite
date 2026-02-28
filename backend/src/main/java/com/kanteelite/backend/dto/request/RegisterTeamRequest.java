package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterTeamRequest {
    @NotBlank
    private String teamName;

    private String coachName;
    private String contactEmail;
    private String ageGroup;
}
