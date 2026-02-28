package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateSessionRequest;
import com.kanteelite.backend.dto.request.CreateTournamentRequest;
import com.kanteelite.backend.dto.request.UpdateSessionRequest;
import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.dto.response.TournamentResponse;
import com.kanteelite.backend.entity.Coach;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.entity.Tournament;
import com.kanteelite.backend.entity.TournamentRegistration;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.repository.CoachRepository;
import com.kanteelite.backend.repository.SessionRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import com.kanteelite.backend.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final SessionRepository sessionRepository;
    private final CoachRepository coachRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentRegistrationRepository registrationRepository;
    private final SessionService sessionService;

    public SessionResponse createSession(CreateSessionRequest request) {
        Coach coach = coachRepository.findById(request.getCoachId())
                .orElseThrow(() -> new ResourceNotFoundException("Coach not found: " + request.getCoachId()));

        Session session = Session.builder()
                .coach(coach)
                .type(request.getType())
                .title(request.getTitle())
                .location(request.getLocation())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .capacity(request.getCapacity())
                .priceCents(request.getPriceCents())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        sessionRepository.save(session);
        return sessionService.toResponse(session);
    }

    public SessionResponse updateSession(Long id, UpdateSessionRequest request) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));

        if (request.getType() != null) session.setType(request.getType());
        if (request.getTitle() != null) session.setTitle(request.getTitle());
        if (request.getLocation() != null) session.setLocation(request.getLocation());
        if (request.getStartTime() != null) session.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) session.setEndTime(request.getEndTime());
        if (request.getCapacity() != null) session.setCapacity(request.getCapacity());
        if (request.getPriceCents() != null) session.setPriceCents(request.getPriceCents());
        if (request.getStatus() != null) session.setStatus(request.getStatus());

        sessionRepository.save(session);
        return sessionService.toResponse(session);
    }

    public TournamentResponse createTournament(CreateTournamentRequest request) {
        Tournament tournament = Tournament.builder()
                .name(request.getName())
                .location(request.getLocation())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .registrationFeeCents(request.getRegistrationFeeCents())
                .ageGroups(request.getAgeGroups())
                .maxTeams(request.getMaxTeams())
                .status(request.getStatus() != null ? request.getStatus() : "UPCOMING")
                .build();

        tournamentRepository.save(tournament);

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

    public List<TournamentRegistrationResponse> getAllRegistrations() {
        return registrationRepository.findAll().stream()
                .map(this::toRegistrationResponse)
                .collect(Collectors.toList());
    }

    private TournamentRegistrationResponse toRegistrationResponse(TournamentRegistration reg) {
        return TournamentRegistrationResponse.builder()
                .id(reg.getId())
                .tournamentId(reg.getTournament() != null ? reg.getTournament().getId() : null)
                .tournamentName(reg.getTournament() != null ? reg.getTournament().getName() : null)
                .teamId(reg.getTeam() != null ? reg.getTeam().getId() : null)
                .teamName(reg.getTeam() != null ? reg.getTeam().getName() : null)
                .status(reg.getStatus())
                .paymentStatus(reg.getPaymentStatus())
                .build();
    }
}
