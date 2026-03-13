package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateSessionRequest;
import com.kanteelite.backend.dto.request.CreateTournamentRequest;
import com.kanteelite.backend.dto.request.UpdateSessionRequest;
import com.kanteelite.backend.dto.request.UpdateTournamentRegistrationRequest;
import com.kanteelite.backend.dto.request.UpdateTournamentRequest;
import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.dto.response.TournamentResponse;
import com.kanteelite.backend.entity.Coach;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.entity.Team;
import com.kanteelite.backend.entity.Tournament;
import com.kanteelite.backend.entity.TournamentRegistration;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.CoachRepository;
import com.kanteelite.backend.repository.SessionRepository;
import com.kanteelite.backend.repository.TeamRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import com.kanteelite.backend.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private static final Set<String> SUPPORTED_SESSION_TYPES =
            Set.of("PRIVATE", "GROUP", "SPEED", "SPEED_AND_AGILITY");
    private static final Set<String> SUPPORTED_SESSION_STATUSES = Set.of("ACTIVE", "CANCELLED", "COMPLETED");
    private static final Set<String> SUPPORTED_SKILL_LEVELS =
            Set.of("BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS");
    private static final Set<String> SUPPORTED_TOURNAMENT_STATUSES = Set.of("UPCOMING", "ACTIVE", "COMPLETED");
    private static final Set<String> SUPPORTED_AGE_GROUPS = Set.of("U8", "U10", "U12", "U14", "U16", "U18");
    private static final Set<String> SUPPORTED_REGISTRATION_STATUSES =
            Set.of("PENDING", "CONFIRMED", "CANCELLED", "FAILED", "EXPIRED");
    private static final Set<String> SUPPORTED_PAYMENT_STATUSES =
            Set.of("PENDING", "PAID", "FAILED", "EXPIRED", "PAID_AFTER_EXPIRY");

    private final SessionRepository sessionRepository;
    private final CoachRepository coachRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentRegistrationRepository registrationRepository;
    private final BookingRepository bookingRepository;
    private final TeamRepository teamRepository;
    private final SessionService sessionService;
    private final TournamentService tournamentService;

    public List<SessionResponse> getAllSessions(String status) {
        String normalizedStatus = normalizeFilter(status);
        if (normalizedStatus != null && !SUPPORTED_SESSION_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid session status filter");
        }

        if (normalizedStatus == null) {
            return sessionService.getAllSessions();
        }
        return sessionService.getSessionsByStatus(normalizedStatus);
    }

    public SessionResponse getSessionById(Long id) {
        return sessionService.getSessionById(id);
    }

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        Coach coach = resolveCoach(request.getCoachId());

        String normalizedType = normalizeEnumValue(
                request.getType(),
                "Session type is required",
                SUPPORTED_SESSION_TYPES,
                "Invalid session type"
        );
        String normalizedTitle = normalizeRequiredValue(request.getTitle(), "Title is required");
        String normalizedDescription = normalizeOptionalValue(request.getDescription());
        String normalizedLocation = normalizeOptionalValue(request.getLocation());
        String normalizedAgeGroup = normalizeOptionalValue(request.getAgeGroup());
        String normalizedSkillLevel = normalizeOptionalEnumValue(
                request.getSkillLevel(),
                SUPPORTED_SKILL_LEVELS,
                "Invalid session skill level"
        );
        String normalizedImageUrl = normalizeOptionalValue(request.getImageUrl());

        LocalDateTime startTime = requireNonNull(request.getStartTime(), "Session start time is required");
        LocalDateTime endTime = requireNonNull(request.getEndTime(), "Session end time is required");
        validateSessionTimeRange(startTime, endTime);

        Integer capacity = requireAtLeast(request.getCapacity(), 1, "Capacity must be at least 1");
        Integer priceCents = requireAtLeast(request.getPriceCents(), 0, "Price must be non-negative");
        Integer minAge = request.getMinAge();
        Integer maxAge = request.getMaxAge();
        validateSessionAgeRange(minAge, maxAge);

        String normalizedStatus = normalizeOptionalEnumValue(
                request.getStatus(),
                SUPPORTED_SESSION_STATUSES,
                "Invalid session status"
        );
        boolean waitlistEnabled = Boolean.TRUE.equals(request.getWaitlistEnabled());
        boolean published = request.getPublished() == null || Boolean.TRUE.equals(request.getPublished());
        boolean featured = Boolean.TRUE.equals(request.getFeatured());
        int repeatWeeklyCount = request.getRepeatWeeklyCount() == null ? 1 : request.getRepeatWeeklyCount();
        if (repeatWeeklyCount < 1) {
            throw new IllegalArgumentException("repeatWeeklyCount must be at least 1");
        }
        if (repeatWeeklyCount > 52) {
            throw new IllegalArgumentException("repeatWeeklyCount must be 52 or less");
        }

        if (featured) {
            sessionRepository.clearFeaturedFlag();
        }

        Session firstSession = null;
        for (int weekIndex = 0; weekIndex < repeatWeeklyCount; weekIndex++) {
            Session session = Session.builder()
                    .coach(coach)
                    .type(normalizedType)
                    .title(normalizedTitle)
                    .description(normalizedDescription)
                    .location(normalizedLocation)
                    .ageGroup(normalizedAgeGroup)
                    .skillLevel(normalizedSkillLevel)
                    .imageUrl(normalizedImageUrl)
                    .startTime(startTime.plusWeeks(weekIndex))
                    .endTime(endTime.plusWeeks(weekIndex))
                    .capacity(capacity)
                    .priceCents(priceCents)
                    .minAge(minAge)
                    .maxAge(maxAge)
                    .featured(featured && weekIndex == 0)
                    .waitlistEnabled(waitlistEnabled)
                    .published(published)
                    .status(normalizedStatus != null ? normalizedStatus : "ACTIVE")
                    .build();
            sessionRepository.save(session);
            if (firstSession == null) {
                firstSession = session;
            }
        }

        return sessionService.toResponse(firstSession);
    }

    @Transactional
    public SessionResponse updateSession(Long id, UpdateSessionRequest request) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));

        if (request.getCoachId() != null) {
            session.setCoach(resolveCoach(request.getCoachId()));
        }
        if (request.getType() != null) {
            session.setType(normalizeEnumValue(
                    request.getType(),
                    "Session type is required",
                    SUPPORTED_SESSION_TYPES,
                    "Invalid session type"
            ));
        }
        if (request.getTitle() != null) {
            session.setTitle(normalizeRequiredValue(request.getTitle(), "Title is required"));
        }
        if (request.getDescription() != null) {
            session.setDescription(normalizeOptionalValue(request.getDescription()));
        }
        if (request.getLocation() != null) {
            session.setLocation(normalizeOptionalValue(request.getLocation()));
        }
        if (request.getAgeGroup() != null) {
            session.setAgeGroup(normalizeOptionalValue(request.getAgeGroup()));
        }
        if (request.getSkillLevel() != null) {
            session.setSkillLevel(normalizeEnumValue(
                    request.getSkillLevel(),
                    "Skill level is required",
                    SUPPORTED_SKILL_LEVELS,
                    "Invalid session skill level"
            ));
        }
        if (request.getImageUrl() != null) {
            session.setImageUrl(normalizeOptionalValue(request.getImageUrl()));
        }
        if (request.getStartTime() != null) {
            session.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) {
            session.setEndTime(request.getEndTime());
        }
        if (request.getCapacity() != null) {
            session.setCapacity(requireAtLeast(request.getCapacity(), 1, "Capacity must be at least 1"));
        }
        if (request.getPriceCents() != null) {
            session.setPriceCents(requireAtLeast(request.getPriceCents(), 0, "Price must be non-negative"));
        }
        if (request.getMinAge() != null) {
            session.setMinAge(request.getMinAge());
        }
        if (request.getMaxAge() != null) {
            session.setMaxAge(request.getMaxAge());
        }
        if (request.getWaitlistEnabled() != null) {
            session.setWaitlistEnabled(request.getWaitlistEnabled());
        }
        if (request.getPublished() != null) {
            session.setPublished(request.getPublished());
        }
        if (request.getFeatured() != null) {
            if (Boolean.TRUE.equals(request.getFeatured())) {
                sessionRepository.clearFeaturedFlag();
                session.setFeatured(true);
            } else {
                session.setFeatured(false);
            }
        }
        if (request.getStatus() != null) {
            session.setStatus(normalizeEnumValue(
                    request.getStatus(),
                    "Session status is required",
                    SUPPORTED_SESSION_STATUSES,
                    "Invalid session status"
            ));
        }

        validateSessionTimeRange(session.getStartTime(), session.getEndTime());
        validateSessionAgeRange(session.getMinAge(), session.getMaxAge());

        sessionRepository.save(session);
        return sessionService.toResponse(session);
    }

    @Transactional
    public void deleteSession(Long id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));
        bookingRepository.deleteBySessionId(id);
        sessionRepository.delete(session);
    }

    @Transactional
    public SessionResponse duplicateSession(Long id, Integer copies) {
        Session source = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));

        int safeCopies = copies == null ? 1 : copies;
        if (safeCopies < 1) {
            throw new IllegalArgumentException("copies must be at least 1");
        }
        if (safeCopies > 20) {
            throw new IllegalArgumentException("copies must be 20 or less");
        }

        Session latest = null;
        for (int copyIndex = 1; copyIndex <= safeCopies; copyIndex++) {
            Session duplicate = Session.builder()
                    .coach(source.getCoach())
                    .type(source.getType())
                    .title(source.getTitle() + " (Copy)")
                    .description(source.getDescription())
                    .location(source.getLocation())
                    .ageGroup(source.getAgeGroup())
                    .skillLevel(source.getSkillLevel())
                    .imageUrl(source.getImageUrl())
                    .startTime(source.getStartTime() != null ? source.getStartTime().plusWeeks(copyIndex) : null)
                    .endTime(source.getEndTime() != null ? source.getEndTime().plusWeeks(copyIndex) : null)
                    .capacity(source.getCapacity())
                    .priceCents(source.getPriceCents())
                    .minAge(source.getMinAge())
                    .maxAge(source.getMaxAge())
                    .featured(false)
                    .waitlistEnabled(Boolean.TRUE.equals(source.getWaitlistEnabled()))
                    .published(Boolean.TRUE.equals(source.getPublished()))
                    .status(source.getStatus())
                    .build();
            sessionRepository.save(duplicate);
            latest = duplicate;
        }

        return sessionService.toResponse(latest);
    }

    public List<TournamentResponse> getAllTournaments(String status) {
        String normalizedStatus = normalizeFilter(status);
        if (normalizedStatus != null && !SUPPORTED_TOURNAMENT_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid tournament status filter");
        }

        List<Tournament> tournaments = normalizedStatus == null
                ? tournamentRepository.findAllByOrderByStartDateAsc()
                : tournamentRepository.findByStatusOrderByStartDateAsc(normalizedStatus);

        return tournaments.stream()
                .map(tournamentService::toResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournamentById(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found: " + id));
        return tournamentService.toResponse(tournament);
    }

    public TournamentResponse createTournament(CreateTournamentRequest request) {
        Tournament tournament = buildTournamentForCreate(request);
        tournamentRepository.save(tournament);
        return tournamentService.toResponse(tournament);
    }

    public TournamentResponse updateTournament(Long id, UpdateTournamentRequest request) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found: " + id));

        if (request.getName() != null) {
            tournament.setName(normalizeRequiredValue(request.getName(), "Tournament name is required"));
        }
        if (request.getLocation() != null) {
            tournament.setLocation(normalizeOptionalValue(request.getLocation()));
        }
        if (request.getStartDate() != null) {
            tournament.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            tournament.setEndDate(request.getEndDate());
        }
        if (request.getRegistrationFeeCents() != null) {
            tournament.setRegistrationFeeCents(requireAtLeast(
                    request.getRegistrationFeeCents(),
                    0,
                    "Registration fee must be non-negative"
            ));
        }
        if (request.getAgeGroups() != null) {
            tournament.setAgeGroups(normalizeAgeGroups(request.getAgeGroups()));
        }
        if (request.getMaxTeams() != null) {
            tournament.setMaxTeams(requireAtLeast(request.getMaxTeams(), 2, "Max teams must be at least 2"));
        }
        if (request.getStatus() != null) {
            tournament.setStatus(normalizeEnumValue(
                    request.getStatus(),
                    "Tournament status is required",
                    SUPPORTED_TOURNAMENT_STATUSES,
                    "Invalid tournament status"
            ));
        }

        if (tournament.getStartDate() != null && tournament.getEndDate() != null) {
            validateTournamentDateRange(tournament.getStartDate(), tournament.getEndDate());
        }

        tournamentRepository.save(tournament);
        return tournamentService.toResponse(tournament);
    }

    @Transactional
    public void deleteTournament(Long id) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tournament not found: " + id));
        registrationRepository.deleteByTournamentId(id);
        teamRepository.deleteByTournamentId(id);
        tournamentRepository.delete(tournament);
    }

    public List<TournamentRegistrationResponse> getAllRegistrations(String status, String paymentStatus) {
        String normalizedStatus = normalizeFilter(status);
        if (normalizedStatus != null && !SUPPORTED_REGISTRATION_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid registration status filter");
        }

        String normalizedPaymentStatus = normalizeFilter(paymentStatus);
        if (normalizedPaymentStatus != null && !SUPPORTED_PAYMENT_STATUSES.contains(normalizedPaymentStatus)) {
            throw new IllegalArgumentException("Invalid registration payment status filter");
        }

        return registrationRepository.findAllAdminRegistrationResponses(normalizedStatus, normalizedPaymentStatus);
    }

    public TournamentRegistrationResponse getRegistrationById(Long id) {
        TournamentRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + id));
        return tournamentService.toRegistrationResponse(registration, null);
    }

    @Transactional
    public TournamentRegistrationResponse updateRegistration(Long id, UpdateTournamentRegistrationRequest request) {
        TournamentRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + id));

        Team team = registration.getTeam();
        if (team != null) {
            if (request.getTeamName() != null) {
                String normalizedTeamName = normalizeRequiredValue(request.getTeamName(), "Team name is required");
                Long tournamentId = registration.getTournament() != null ? registration.getTournament().getId() : null;
                if (tournamentId != null && teamRepository.existsByTournamentIdAndNameIgnoreCaseAndIdNot(
                        tournamentId, normalizedTeamName, team.getId())) {
                    throw new IllegalArgumentException("Team name is already registered for this tournament");
                }
                team.setName(normalizedTeamName);
            }
            if (request.getCoachName() != null) {
                team.setCoachName(normalizeOptionalValue(request.getCoachName()));
            }
            if (request.getContactEmail() != null) {
                team.setContactEmail(normalizeOptionalValue(request.getContactEmail()));
            }
            if (request.getAgeGroup() != null) {
                String normalizedAgeGroup = normalizeEnumValue(
                        request.getAgeGroup(),
                        "Age group is required",
                        SUPPORTED_AGE_GROUPS,
                        "Invalid age group"
                );
                validateAgeGroupForTournament(registration, normalizedAgeGroup);
                team.setAgeGroup(normalizedAgeGroup);
            }
            teamRepository.save(team);
        }

        String normalizedStatus = normalizeOptionalEnumValue(
                request.getStatus(),
                SUPPORTED_REGISTRATION_STATUSES,
                "Invalid registration status"
        );
        if (normalizedStatus != null) {
            registration.setStatus(normalizedStatus);
        }

        String normalizedPaymentStatus = normalizeOptionalEnumValue(
                request.getPaymentStatus(),
                SUPPORTED_PAYMENT_STATUSES,
                "Invalid registration payment status"
        );
        if (normalizedPaymentStatus != null) {
            registration.setPaymentStatus(normalizedPaymentStatus);
        }

        registrationRepository.save(registration);
        return tournamentService.toRegistrationResponse(registration, null);
    }

    @Transactional
    public void deleteRegistration(Long id) {
        TournamentRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found: " + id));

        Long teamId = registration.getTeam() != null ? registration.getTeam().getId() : null;
        registrationRepository.delete(registration);
        if (teamId != null && registrationRepository.countByTeamId(teamId) == 0) {
            teamRepository.deleteById(teamId);
        }
    }

    private Tournament buildTournamentForCreate(CreateTournamentRequest request) {
        String normalizedName = normalizeRequiredValue(request.getName(), "Tournament name is required");
        String normalizedLocation = normalizeOptionalValue(request.getLocation());

        LocalDate startDate = requireNonNull(request.getStartDate(), "Tournament start date is required");
        LocalDate endDate = requireNonNull(request.getEndDate(), "Tournament end date is required");
        validateTournamentDateRange(startDate, endDate);

        Integer registrationFeeCents = requireAtLeast(
                request.getRegistrationFeeCents(),
                0,
                "Registration fee must be non-negative"
        );
        Integer maxTeams = requireAtLeast(request.getMaxTeams(), 2, "Max teams must be at least 2");

        String normalizedAgeGroups = normalizeAgeGroups(request.getAgeGroups());

        String normalizedStatus = normalizeOptionalEnumValue(
                request.getStatus(),
                SUPPORTED_TOURNAMENT_STATUSES,
                "Invalid tournament status"
        );

        return Tournament.builder()
                .name(normalizedName)
                .location(normalizedLocation)
                .startDate(startDate)
                .endDate(endDate)
                .registrationFeeCents(registrationFeeCents)
                .ageGroups(normalizedAgeGroups)
                .maxTeams(maxTeams)
                .status(normalizedStatus != null ? normalizedStatus : "UPCOMING")
                .build();
    }

    private void validateSessionTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            return;
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Session end time must be after start time");
        }
    }

    private void validateSessionAgeRange(Integer minAge, Integer maxAge) {
        if (minAge == null || maxAge == null) {
            return;
        }
        if (maxAge < minAge) {
            throw new IllegalArgumentException("Session max age must be greater than or equal to min age");
        }
    }

    private void validateTournamentDateRange(LocalDate startDate, LocalDate endDate) {
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Tournament end date must be on or after start date");
        }
    }

    private void validateAgeGroupForTournament(TournamentRegistration registration, String selectedAgeGroup) {
        if (registration == null || registration.getTournament() == null) {
            return;
        }
        String ageGroupsRaw = registration.getTournament().getAgeGroups();
        Set<String> allowedAgeGroups = parseAgeGroups(ageGroupsRaw);
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

    private String normalizeFilter(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.US);
        return normalized.isEmpty() ? null : normalized;
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

    private String normalizeEnumValue(
            String value,
            String requiredMessage,
            Set<String> allowedValues,
            String invalidMessage
    ) {
        String normalized = normalizeRequiredValue(value, requiredMessage).toUpperCase(Locale.US);
        if (!allowedValues.contains(normalized)) {
            throw new IllegalArgumentException(invalidMessage);
        }
        return normalized;
    }

    private String normalizeOptionalEnumValue(String value, Set<String> allowedValues, String invalidMessage) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            return null;
        }
        String upper = normalized.toUpperCase(Locale.US);
        if (!allowedValues.contains(upper)) {
            throw new IllegalArgumentException(invalidMessage);
        }
        return upper;
    }

    private Integer requireAtLeast(Integer value, int min, String message) {
        if (value == null || value < min) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }

    private <T> T requireNonNull(T value, String message) {
        if (value == null) {
            throw new IllegalArgumentException(message);
        }
        return value;
    }

    private String normalizeAgeGroups(String ageGroupsRaw) {
        String normalizedRaw = normalizeRequiredValue(ageGroupsRaw, "At least one age group is required");
        LinkedHashSet<String> normalizedGroups = Arrays.stream(normalizedRaw.split("[,|/]"))
                .map(value -> value == null ? null : value.trim())
                .filter(value -> value != null && !value.isEmpty())
                .map(value -> value.toUpperCase(Locale.US))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (normalizedGroups.isEmpty()) {
            throw new IllegalArgumentException("At least one age group is required");
        }

        for (String group : normalizedGroups) {
            if (!SUPPORTED_AGE_GROUPS.contains(group)) {
                throw new IllegalArgumentException("Invalid age group: " + group);
            }
        }

        return String.join(",", normalizedGroups);
    }

    private Coach resolveCoach(Long coachId) {
        if (coachId != null) {
            return coachRepository.findById(coachId)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found: " + coachId));
        }
        return coachRepository.findAll().stream()
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No coaches available to assign"));
    }
}
