package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateSessionRequest;
import com.kanteelite.backend.dto.request.CreateTournamentRequest;
import com.kanteelite.backend.dto.request.UpdateSessionRequest;
import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.entity.Coach;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.entity.Tournament;
import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.CoachRepository;
import com.kanteelite.backend.repository.SessionRepository;
import com.kanteelite.backend.repository.TeamRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import com.kanteelite.backend.repository.TournamentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private CoachRepository coachRepository;

    @Mock
    private TournamentRepository tournamentRepository;

    @Mock
    private TournamentRegistrationRepository registrationRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private SessionService sessionService;

    @Mock
    private TournamentService tournamentService;

    @InjectMocks
    private AdminService adminService;

    @Test
    void getAllRegistrations_normalizesFilterValuesToUppercase() {
        adminService.getAllRegistrations("  expired ", " paid_after_expiry ");

        verify(registrationRepository).findAllAdminRegistrationResponses(
                eq("EXPIRED"),
                eq("PAID_AFTER_EXPIRY")
        );
    }

    @Test
    void getAllRegistrations_blankFiltersBecomeNull() {
        adminService.getAllRegistrations("   ", null);

        verify(registrationRepository).findAllAdminRegistrationResponses(
                isNull(),
                isNull()
        );
    }

    @Test
    void createSession_whenEndTimeBeforeStartTime_throwsIllegalArgumentException() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setType("GROUP");
        request.setTitle("Evening Group");
        request.setStartTime(LocalDateTime.of(2026, 6, 1, 18, 0));
        request.setEndTime(LocalDateTime.of(2026, 6, 1, 17, 30));
        request.setCapacity(12);
        request.setPriceCents(4500);

        when(coachRepository.findAll()).thenReturn(List.of(Coach.builder().id(1L).build()));

        assertThatThrownBy(() -> adminService.createSession(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("end time must be after start time");

        verify(sessionRepository, never()).save(any(Session.class));
    }

    @Test
    void createSession_success_normalizesFieldsAndDefaultsStatus() {
        CreateSessionRequest request = new CreateSessionRequest();
        request.setType(" group ");
        request.setTitle("  Evening Group  ");
        request.setLocation("  Field A  ");
        request.setStartTime(LocalDateTime.of(2026, 6, 1, 18, 0));
        request.setEndTime(LocalDateTime.of(2026, 6, 1, 19, 0));
        request.setCapacity(12);
        request.setPriceCents(4500);
        request.setStatus(null);

        Coach coach = Coach.builder().id(3L).build();
        when(coachRepository.findAll()).thenReturn(List.of(coach));
        when(sessionRepository.save(any(Session.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(sessionService.toResponse(any(Session.class))).thenAnswer(invocation -> {
            Session session = invocation.getArgument(0);
            return SessionResponse.builder()
                    .id(10L)
                    .title(session.getTitle())
                    .type(session.getType())
                    .status(session.getStatus())
                    .build();
        });

        SessionResponse response = adminService.createSession(request);

        ArgumentCaptor<Session> sessionCaptor = ArgumentCaptor.forClass(Session.class);
        verify(sessionRepository).save(sessionCaptor.capture());
        Session persisted = sessionCaptor.getValue();

        assertThat(persisted.getType()).isEqualTo("GROUP");
        assertThat(persisted.getTitle()).isEqualTo("Evening Group");
        assertThat(persisted.getLocation()).isEqualTo("Field A");
        assertThat(persisted.getStatus()).isEqualTo("ACTIVE");

        assertThat(response.getType()).isEqualTo("GROUP");
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void updateSession_whenTimeRangeBecomesInvalid_throwsIllegalArgumentException() {
        Session existing = Session.builder()
                .id(22L)
                .type("GROUP")
                .title("Evening Group")
                .startTime(LocalDateTime.of(2026, 6, 1, 18, 0))
                .endTime(LocalDateTime.of(2026, 6, 1, 19, 0))
                .capacity(12)
                .priceCents(4500)
                .status("ACTIVE")
                .build();
        when(sessionRepository.findById(22L)).thenReturn(Optional.of(existing));

        UpdateSessionRequest request = new UpdateSessionRequest();
        request.setEndTime(LocalDateTime.of(2026, 6, 1, 17, 30));

        assertThatThrownBy(() -> adminService.updateSession(22L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("end time must be after start time");
    }

    @Test
    void createTournament_whenDateRangeInvalid_throwsIllegalArgumentException() {
        CreateTournamentRequest request = new CreateTournamentRequest();
        request.setName("Summer Cup");
        request.setStartDate(LocalDate.of(2026, 8, 10));
        request.setEndDate(LocalDate.of(2026, 8, 8));
        request.setRegistrationFeeCents(12000);
        request.setAgeGroups("U12,U14");
        request.setMaxTeams(12);

        assertThatThrownBy(() -> adminService.createTournament(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("end date must be on or after start date");
    }

    @Test
    void createTournament_whenAgeGroupUnsupported_throwsIllegalArgumentException() {
        CreateTournamentRequest request = new CreateTournamentRequest();
        request.setName("Summer Cup");
        request.setStartDate(LocalDate.of(2026, 8, 8));
        request.setEndDate(LocalDate.of(2026, 8, 10));
        request.setRegistrationFeeCents(12000);
        request.setAgeGroups("U12,U20");
        request.setMaxTeams(12);

        assertThatThrownBy(() -> adminService.createTournament(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid age group: U20");
    }

    @Test
    void createTournament_success_normalizesAgeGroupsAndStatus() {
        CreateTournamentRequest request = new CreateTournamentRequest();
        request.setName("  Summer Cup  ");
        request.setLocation("  Dallas  ");
        request.setStartDate(LocalDate.of(2026, 8, 8));
        request.setEndDate(LocalDate.of(2026, 8, 10));
        request.setRegistrationFeeCents(12000);
        request.setAgeGroups(" u12 | U14 / u12 ");
        request.setMaxTeams(12);
        request.setStatus(" active ");

        when(tournamentRepository.save(any(Tournament.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tournamentService.toResponse(any(Tournament.class))).thenAnswer(invocation -> {
            Tournament tournament = invocation.getArgument(0);
            return com.kanteelite.backend.dto.response.TournamentResponse.builder()
                    .id(1L)
                    .name(tournament.getName())
                    .location(tournament.getLocation())
                    .ageGroups(tournament.getAgeGroups())
                    .status(tournament.getStatus())
                    .build();
        });

        var response = adminService.createTournament(request);

        ArgumentCaptor<Tournament> tournamentCaptor = ArgumentCaptor.forClass(Tournament.class);
        verify(tournamentRepository).save(tournamentCaptor.capture());
        Tournament persisted = tournamentCaptor.getValue();

        assertThat(persisted.getName()).isEqualTo("Summer Cup");
        assertThat(persisted.getLocation()).isEqualTo("Dallas");
        assertThat(persisted.getAgeGroups()).isEqualTo("U12,U14");
        assertThat(persisted.getStatus()).isEqualTo("ACTIVE");

        assertThat(response.getName()).isEqualTo("Summer Cup");
        assertThat(response.getStatus()).isEqualTo("ACTIVE");
        assertThat(response.getAgeGroups()).isEqualTo("U12,U14");
    }
}
