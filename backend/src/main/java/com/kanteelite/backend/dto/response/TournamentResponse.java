package com.kanteelite.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentResponse {
    private Long id;
    private String name;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer registrationFeeCents;
    private String ageGroups;
    private Integer maxTeams;
    private Integer registeredTeams;
    private String status;
}
