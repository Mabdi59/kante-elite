package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateTournamentRequest {
    @Size(min = 3, max = 120)
    private String name;

    private String location;

    private LocalDate startDate;

    private LocalDate endDate;

    @Min(0)
    private Integer registrationFeeCents;

    private String ageGroups;

    @Min(2)
    @Max(128)
    private Integer maxTeams;

    @Pattern(regexp = "UPCOMING|ACTIVE|COMPLETED")
    private String status;
}
