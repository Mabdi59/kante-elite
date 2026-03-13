package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterTeamRequest {
    @NotBlank
    private String teamName;

    @NotBlank
    private String coachName;

    @NotBlank
    @Email
    private String contactEmail;

    @NotBlank
    private String ageGroup;
}
