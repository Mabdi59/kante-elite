package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.RegisterTeamRequest;
import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.dto.response.TournamentResponse;
import com.kanteelite.backend.entity.Team;
import com.kanteelite.backend.entity.Tournament;
import com.kanteelite.backend.entity.TournamentRegistration;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.repository.TeamRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import com.kanteelite.backend.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final TournamentRegistrationRepository registrationRepository;
    private final StripeService stripeService;

    public List<TournamentResponse> getPublicTournaments() {
        return tournamentRepository.findByStatusIn(List.of("UPCOMING", "ACTIVE")).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournamentById(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found: " + id));
        return toResponse(tournament);
    }

    @Transactional
    public TournamentRegistrationResponse registerTeam(Long tournamentId, RegisterTeamRequest request) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found: " + tournamentId));

        Team team = Team.builder()
                .tournament(tournament)
                .name(request.getTeamName())
                .coachName(request.getCoachName())
                .contactEmail(request.getContactEmail())
                .ageGroup(request.getAgeGroup())
                .build();

        teamRepository.save(team);

        long feeCents = tournament.getRegistrationFeeCents() != null ? tournament.getRegistrationFeeCents() : 0L;
        String clientSecret = stripeService.createPaymentIntent(
                feeCents, "usd", "Tournament registration: " + tournament.getName());

        TournamentRegistration registration = TournamentRegistration.builder()
                .tournament(tournament)
                .team(team)
                .status("PENDING")
                .paymentStatus("PENDING")
                .stripePaymentIntentId(extractIntentId(clientSecret))
                .build();

        registrationRepository.save(registration);

        return toRegistrationResponse(registration, clientSecret);
    }

    private TournamentResponse toResponse(Tournament tournament) {
        return TournamentResponse.builder()
                .id(tournament.getId())
                .name(tournament.getName())
                .location(tournament.getLocation())
                .startDate(tournament.getStartDate())
                .endDate(tournament.getEndDate())
                .registrationFeeCents(tournament.getRegistrationFeeCents())
                .ageGroups(tournament.getAgeGroups())
                .maxTeams(tournament.getMaxTeams())
                .status(tournament.getStatus())
                .build();
    }

    private TournamentRegistrationResponse toRegistrationResponse(TournamentRegistration reg, String clientSecret) {
        return TournamentRegistrationResponse.builder()
                .id(reg.getId())
                .tournamentId(reg.getTournament() != null ? reg.getTournament().getId() : null)
                .tournamentName(reg.getTournament() != null ? reg.getTournament().getName() : null)
                .teamId(reg.getTeam() != null ? reg.getTeam().getId() : null)
                .teamName(reg.getTeam() != null ? reg.getTeam().getName() : null)
                .status(reg.getStatus())
                .paymentStatus(reg.getPaymentStatus())
                .clientSecret(clientSecret)
                .build();
    }

    private String extractIntentId(String clientSecret) {
        if (clientSecret == null || !clientSecret.contains("_secret_")) {
            return clientSecret;
        }
        return clientSecret.substring(0, clientSecret.indexOf("_secret_"));
    }
}
