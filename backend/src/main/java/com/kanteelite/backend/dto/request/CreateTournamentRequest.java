package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateTournamentRequest {
    @NotBlank
    @Size(min = 3, max = 120)
    private String name;

    private String location;

    @NotNull
    private LocalDate startDate;

    @NotNull
    private LocalDate endDate;

    @NotNull
    @Min(0)
    private Integer registrationFeeCents;

    @NotBlank
    private String ageGroups;

    @NotNull
    @Min(2)
    @Max(128)
    private Integer maxTeams;

    @Pattern(regexp = "UPCOMING|ACTIVE|COMPLETED")
    private String status;
}
