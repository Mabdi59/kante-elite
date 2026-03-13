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

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private static final List<String> CAPACITY_CONSUMING_REGISTRATION_STATUSES = List.of("PENDING", "CONFIRMED");
    private static final Set<String> SUPPORTED_AGE_GROUPS = Set.of("U8", "U10", "U12", "U14", "U16", "U18");

    private final TournamentRepository tournamentRepository;
    private final TeamRepository teamRepository;
    private final TournamentRegistrationRepository registrationRepository;
    private final StripeService stripeService;
    private final PaymentHoldService paymentHoldService;

    public List<TournamentResponse> getPublicTournaments() {
        paymentHoldService.expireStalePendingRegistrations();

        return tournamentRepository.findByStatusIn(List.of("UPCOMING", "ACTIVE")).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournamentById(Long id) {
        paymentHoldService.expireStalePendingRegistrations();

        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found: " + id));
        return toResponse(tournament);
    }

    @Transactional
    public TournamentRegistrationResponse registerTeam(Long tournamentId, RegisterTeamRequest request) {
        paymentHoldService.expireStalePendingRegistrations();

        Tournament tournament = tournamentRepository.findByIdForUpdate(tournamentId)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found: " + tournamentId));
        ensureTournamentHasAvailability(tournament);

        String normalizedTeamName = normalizeRequiredValue(request.getTeamName(), "Team name is required");
        String normalizedCoachName = normalizeOptionalValue(request.getCoachName());
        String normalizedContactEmail = normalizeOptionalValue(request.getContactEmail());
        String normalizedAgeGroup = normalizeRequiredValue(request.getAgeGroup(), "Age group is required")
                .toUpperCase(Locale.US);
        validateAgeGroupForTournament(normalizedAgeGroup, tournament.getAgeGroups());

        if (teamRepository.existsByTournamentIdAndNameIgnoreCase(tournament.getId(), normalizedTeamName)) {
            throw new IllegalArgumentException("Team name is already registered for this tournament");
        }

        Team team = Team.builder()
                .tournament(tournament)
                .name(normalizedTeamName)
                .coachName(normalizedCoachName)
                .contactEmail(normalizedContactEmail)
                .ageGroup(normalizedAgeGroup)
                .build();

        team = teamRepository.save(team);

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

        registration = registrationRepository.save(registration);

        return toRegistrationResponse(registration, clientSecret);
    }

    private void ensureTournamentHasAvailability(Tournament tournament) {
        if (tournament == null || tournament.getId() == null) {
            return;
        }
        Integer maxTeams = tournament.getMaxTeams();
        if (maxTeams == null || maxTeams <= 0) {
            return;
        }

        long currentTeams = registrationRepository.countByTournamentIdAndStatusIn(
                tournament.getId(), CAPACITY_CONSUMING_REGISTRATION_STATUSES);
        if (currentTeams >= maxTeams) {
            throw new IllegalArgumentException("Tournament registration is full");
        }
    }

    private String normalizeRequiredValue(String value, String message) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateAgeGroupForTournament(String selectedAgeGroup, String tournamentAgeGroupsRaw) {
        if (!SUPPORTED_AGE_GROUPS.contains(selectedAgeGroup)) {
            throw new IllegalArgumentException("Invalid age group");
        }

        Set<String> allowedAgeGroups = parseAgeGroups(tournamentAgeGroupsRaw);
        if (!allowedAgeGroups.isEmpty() && !allowedAgeGroups.contains(selectedAgeGroup)) {
            throw new IllegalArgumentException("Selected age group is not available for this tournament");
        }
    }

    private Set<String> parseAgeGroups(String ageGroupsRaw) {
        if (ageGroupsRaw == null || ageGroupsRaw.isBlank()) {
            return Set.of();
        }

        return Arrays.stream(ageGroupsRaw.split("[,|/]"))
                .map(value -> value == null ? null : value.trim())
                .filter(value -> value != null && !value.isEmpty())
                .map(value -> value.toUpperCase(Locale.US))
                .collect(Collectors.toSet());
    }

    public TournamentResponse toResponse(Tournament tournament) {
        int registeredTeams = 0;
        if (tournament != null && tournament.getId() != null) {
            long count = registrationRepository.countByTournamentIdAndStatusIn(
                    tournament.getId(), CAPACITY_CONSUMING_REGISTRATION_STATUSES);
            registeredTeams = count > Integer.MAX_VALUE ? Integer.MAX_VALUE : (int) count;
        }

        return TournamentResponse.builder()
                .id(tournament.getId())
                .name(tournament.getName())
                .location(tournament.getLocation())
                .startDate(tournament.getStartDate())
                .endDate(tournament.getEndDate())
                .registrationFeeCents(tournament.getRegistrationFeeCents())
                .ageGroups(tournament.getAgeGroups())
                .maxTeams(tournament.getMaxTeams())
                .registeredTeams(registeredTeams)
                .status(tournament.getStatus())
                .build();
    }

    public TournamentRegistrationResponse toRegistrationResponse(TournamentRegistration reg, String clientSecret) {
        return TournamentRegistrationResponse.builder()
                .id(reg.getId())
                .tournamentId(reg.getTournament() != null ? reg.getTournament().getId() : null)
                .tournamentName(reg.getTournament() != null ? reg.getTournament().getName() : null)
                .teamId(reg.getTeam() != null ? reg.getTeam().getId() : null)
                .teamName(reg.getTeam() != null ? reg.getTeam().getName() : null)
                .coachName(reg.getTeam() != null ? reg.getTeam().getCoachName() : null)
                .contactEmail(reg.getTeam() != null ? reg.getTeam().getContactEmail() : null)
                .ageGroup(reg.getTeam() != null ? reg.getTeam().getAgeGroup() : null)
                .status(reg.getStatus())
                .paymentStatus(reg.getPaymentStatus())
                .clientSecret(clientSecret)
                .createdAt(reg.getCreatedAt())
                .build();
    }

    private String extractIntentId(String clientSecret) {
        if (clientSecret == null || !clientSecret.contains("_secret_")) {
            return clientSecret;
        }
        return clientSecret.substring(0, clientSecret.indexOf("_secret_"));
    }
}
