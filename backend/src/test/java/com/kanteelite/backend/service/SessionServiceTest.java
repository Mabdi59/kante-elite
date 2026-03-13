package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.entity.Coach;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.entity.User;
import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.SessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentHoldService paymentHoldService;

    @InjectMocks
    private SessionService sessionService;

    @Test
    void getActiveSessions_mapsCurrentParticipantsAndCoachFields() {
        User coachUser = User.builder().id(7L).name("Coach One").build();
        Coach coach = Coach.builder().id(5L).user(coachUser).build();

        Session sessionWithCoach = Session.builder()
                .id(10L)
                .coach(coach)
                .type("GROUP")
                .title("Evening Group")
                .location("Field A")
                .startTime(LocalDateTime.of(2026, 2, 10, 18, 0))
                .endTime(LocalDateTime.of(2026, 2, 10, 19, 0))
                .capacity(16)
                .priceCents(4500)
                .status("ACTIVE")
                .build();

        Session sessionWithoutCoach = Session.builder()
                .id(11L)
                .type("PRIVATE")
                .title("1-on-1")
                .status("ACTIVE")
                .build();

        when(sessionRepository.findByStatusAndPublishedTrueOrderByStartTimeAsc("ACTIVE"))
                .thenReturn(List.of(sessionWithCoach, sessionWithoutCoach));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(10L), anyList())).thenReturn(6L);
        when(bookingRepository.countBySessionIdAndStatusIn(eq(11L), anyList())).thenReturn(0L);

        List<SessionResponse> responses = sessionService.getActiveSessions();

        assertThat(responses).hasSize(2);

        SessionResponse first = responses.get(0);
        assertThat(first.getId()).isEqualTo(10L);
        assertThat(first.getCoachId()).isEqualTo(5L);
        assertThat(first.getCoachName()).isEqualTo("Coach One");
        assertThat(first.getCurrentParticipants()).isEqualTo(6);

        SessionResponse second = responses.get(1);
        assertThat(second.getId()).isEqualTo(11L);
        assertThat(second.getCoachId()).isNull();
        assertThat(second.getCoachName()).isNull();
        assertThat(second.getCurrentParticipants()).isEqualTo(0);

        verify(paymentHoldService).expireStalePendingBookings();
        verify(bookingRepository).countBySessionIdAndStatusIn(eq(10L), anyList());
        verify(bookingRepository).countBySessionIdAndStatusIn(eq(11L), anyList());
    }

    @Test
    void toResponse_whenSessionIdIsNull_defaultsParticipantsToZeroWithoutRepositoryCall() {
        Session unsavedSession = Session.builder()
                .id(null)
                .title("Draft Session")
                .type("GROUP")
                .status("ACTIVE")
                .build();

        SessionResponse response = sessionService.toResponse(unsavedSession);

        assertThat(response.getCurrentParticipants()).isEqualTo(0);
        verifyNoInteractions(bookingRepository);
    }

    @Test
    void toResponse_capsParticipantsAtIntegerMaxValue() {
        Session session = Session.builder()
                .id(77L)
                .title("Packed Session")
                .type("GROUP")
                .status("ACTIVE")
                .build();

        when(bookingRepository.countBySessionIdAndStatusIn(eq(77L), anyList())).thenReturn((long) Integer.MAX_VALUE + 15L);

        SessionResponse response = sessionService.toResponse(session);

        assertThat(response.getCurrentParticipants()).isEqualTo(Integer.MAX_VALUE);
    }
}
