package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateTournamentRequest {
    @NotBlank
    private String name;

    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer registrationFeeCents;
    private String ageGroups;
    private Integer maxTeams;
    private String status;
}
