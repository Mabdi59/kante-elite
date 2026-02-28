package com.kanteelite.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentRegistrationResponse {
    private Long id;
    private Long tournamentId;
    private String tournamentName;
    private Long teamId;
    private String teamName;
    private String status;
    private String paymentStatus;
    private String clientSecret;
}
