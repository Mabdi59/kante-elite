package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.RegisterTeamRequest;
import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.entity.Team;
import com.kanteelite.backend.entity.Tournament;
import com.kanteelite.backend.entity.TournamentRegistration;
import com.kanteelite.backend.repository.TeamRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import com.kanteelite.backend.repository.TournamentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TournamentServiceTest {

    @Mock
    private TournamentRepository tournamentRepository;

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TournamentRegistrationRepository registrationRepository;

    @Mock
    private StripeService stripeService;

    @Mock
    private PaymentHoldService paymentHoldService;

    @InjectMocks
    private TournamentService tournamentService;

    private Tournament tournament;

    @BeforeEach
    void setUp() {
        tournament = Tournament.builder()
                .id(5L)
                .name("Spring Cup")
                .location("Dallas")
                .startDate(LocalDate.of(2026, 4, 12))
                .endDate(LocalDate.of(2026, 4, 14))
                .registrationFeeCents(12000)
                .ageGroups("U12,U14")
                .maxTeams(8)
                .status("UPCOMING")
                .build();
    }

    @Test
    void registerTeam_whenTournamentIsFull_throwsIllegalArgumentException() {
        RegisterTeamRequest request = new RegisterTeamRequest();
        request.setTeamName("Rovers");

        when(tournamentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(tournament));
        when(registrationRepository.countByTournamentIdAndStatusIn(eq(5L), anyList())).thenReturn(8L);

        assertThatThrownBy(() -> tournamentService.registerTeam(5L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tournament registration is full");

        verify(paymentHoldService).expireStalePendingRegistrations();
        verify(teamRepository, never()).save(any(Team.class));
        verifyNoInteractions(stripeService);
    }

    @Test
    void registerTeam_success_trimsValuesAndExtractsIntentId() {
        RegisterTeamRequest request = new RegisterTeamRequest();
        request.setTeamName("  Rovers FC  ");
        request.setCoachName("  Coach Ada  ");
        request.setContactEmail("  rovers@example.com  ");
        request.setAgeGroup("  U12  ");

        when(tournamentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(tournament));
        when(registrationRepository.countByTournamentIdAndStatusIn(eq(5L), anyList())).thenReturn(3L);
        when(stripeService.createPaymentIntent(anyLong(), anyString(), anyString()))
                .thenReturn("pi_123_secret_abc");

        when(teamRepository.save(any(Team.class))).thenAnswer(invocation -> {
            Team team = invocation.getArgument(0);
            return Team.builder()
                    .id(101L)
                    .tournament(team.getTournament())
                    .name(team.getName())
                    .coachName(team.getCoachName())
                    .contactEmail(team.getContactEmail())
                    .ageGroup(team.getAgeGroup())
                    .build();
        });
        when(registrationRepository.save(any(TournamentRegistration.class))).thenAnswer(invocation -> {
            TournamentRegistration reg = invocation.getArgument(0);
            return TournamentRegistration.builder()
                    .id(201L)
                    .tournament(reg.getTournament())
                    .team(reg.getTeam())
                    .status(reg.getStatus())
                    .paymentStatus(reg.getPaymentStatus())
                    .stripePaymentIntentId(reg.getStripePaymentIntentId())
                    .build();
        });

        TournamentRegistrationResponse response = tournamentService.registerTeam(5L, request);

        ArgumentCaptor<Team> teamCaptor = ArgumentCaptor.forClass(Team.class);
        verify(teamRepository).save(teamCaptor.capture());
        Team savedTeam = teamCaptor.getValue();
        assertThat(savedTeam.getName()).isEqualTo("Rovers FC");
        assertThat(savedTeam.getCoachName()).isEqualTo("Coach Ada");
        assertThat(savedTeam.getContactEmail()).isEqualTo("rovers@example.com");
        assertThat(savedTeam.getAgeGroup()).isEqualTo("U12");

        ArgumentCaptor<TournamentRegistration> registrationCaptor = ArgumentCaptor.forClass(TournamentRegistration.class);
        verify(registrationRepository).save(registrationCaptor.capture());
        assertThat(registrationCaptor.getValue().getStripePaymentIntentId()).isEqualTo("pi_123");

        assertThat(response.getId()).isEqualTo(201L);
        assertThat(response.getTournamentId()).isEqualTo(5L);
        assertThat(response.getTeamId()).isEqualTo(101L);
        assertThat(response.getTeamName()).isEqualTo("Rovers FC");
        assertThat(response.getStatus()).isEqualTo("PENDING");
        assertThat(response.getPaymentStatus()).isEqualTo("PENDING");
        assertThat(response.getClientSecret()).isEqualTo("pi_123_secret_abc");
        verify(paymentHoldService).expireStalePendingRegistrations();
    }

    @Test
    void registerTeam_whenAgeGroupMissing_throwsIllegalArgumentException() {
        RegisterTeamRequest request = new RegisterTeamRequest();
        request.setTeamName("Rovers FC");
        request.setCoachName("Coach Ada");
        request.setContactEmail("coach@example.com");
        request.setAgeGroup("   ");

        when(tournamentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(tournament));
        when(registrationRepository.countByTournamentIdAndStatusIn(eq(5L), anyList())).thenReturn(3L);

        assertThatThrownBy(() -> tournamentService.registerTeam(5L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Age group is required");

        verify(teamRepository, never()).save(any(Team.class));
        verifyNoInteractions(stripeService);
    }

    @Test
    void registerTeam_whenAgeGroupNotInTournament_throwsIllegalArgumentException() {
        RegisterTeamRequest request = new RegisterTeamRequest();
        request.setTeamName("Rovers FC");
        request.setCoachName("Coach Ada");
        request.setContactEmail("coach@example.com");
        request.setAgeGroup("U16");

        when(tournamentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(tournament));
        when(registrationRepository.countByTournamentIdAndStatusIn(eq(5L), anyList())).thenReturn(3L);

        assertThatThrownBy(() -> tournamentService.registerTeam(5L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not available for this tournament");

        verify(teamRepository, never()).save(any(Team.class));
        verifyNoInteractions(stripeService);
    }

    @Test
    void registerTeam_whenTeamNameAlreadyExistsInTournament_throwsIllegalArgumentException() {
        RegisterTeamRequest request = new RegisterTeamRequest();
        request.setTeamName("Rovers FC");
        request.setCoachName("Coach Ada");
        request.setContactEmail("coach@example.com");
        request.setAgeGroup("U12");

        when(tournamentRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(tournament));
        when(registrationRepository.countByTournamentIdAndStatusIn(eq(5L), anyList())).thenReturn(3L);
        when(teamRepository.existsByTournamentIdAndNameIgnoreCase(5L, "Rovers FC")).thenReturn(true);

        assertThatThrownBy(() -> tournamentService.registerTeam(5L, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already registered");

        verify(teamRepository, never()).save(any(Team.class));
        verifyNoInteractions(stripeService);
    }
}
