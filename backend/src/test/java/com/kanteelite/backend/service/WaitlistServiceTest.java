package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateWaitlistEntryRequest;
import com.kanteelite.backend.dto.response.WaitlistEntryResponse;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.entity.SessionWaitlistEntry;
import com.kanteelite.backend.entity.User;
import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.SessionRepository;
import com.kanteelite.backend.repository.SessionWaitlistEntryRepository;
import com.kanteelite.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WaitlistServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private SessionWaitlistEntryRepository waitlistEntryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private PaymentHoldService paymentHoldService;

    @InjectMocks
    private WaitlistService waitlistService;

    private User parentUser;
    private Session session;

    @BeforeEach
    void setUp() {
        parentUser = User.builder()
                .id(1L)
                .name("Parent User")
                .email("parent@example.com")
                .passwordHash("hash")
                .role("PARENT")
                .build();

        session = Session.builder()
                .id(10L)
                .status("ACTIVE")
                .published(true)
                .waitlistEnabled(true)
                .capacity(12)
                .minAge(8)
                .maxAge(15)
                .build();
    }

    @Test
    void joinWaitlist_whenDuplicateActiveEntry_throwsIllegalArgumentException() {
        CreateWaitlistEntryRequest request = new CreateWaitlistEntryRequest();
        request.setPlayerName("  Kid Player  ");
        request.setPlayerAge(12);

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(10L), anyList())).thenReturn(12L);
        when(waitlistEntryRepository.existsBySessionIdAndParentUserIdAndStatusIgnoreCaseAndPlayerNameIgnoreCase(
                10L, 1L, "ACTIVE", "Kid Player")).thenReturn(true);

        assertThatThrownBy(() -> waitlistService.joinWaitlist(10L, request, "parent@example.com"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already on the waitlist");

        verify(waitlistEntryRepository, never()).save(any(SessionWaitlistEntry.class));
        verify(paymentHoldService).expireStalePendingBookings();
    }

    @Test
    void joinWaitlist_success_trimsOptionalFieldsAndPersistsEntry() {
        CreateWaitlistEntryRequest request = new CreateWaitlistEntryRequest();
        request.setPlayerName("  Kid Player  ");
        request.setPlayerNickname("  Ace  ");
        request.setPlayerAge(12);
        request.setNotes("   ");

        when(userRepository.findByEmail("parent@example.com")).thenReturn(Optional.of(parentUser));
        when(sessionRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(session));
        when(bookingRepository.countBySessionIdAndStatusIn(eq(10L), anyList())).thenReturn(12L);
        when(waitlistEntryRepository.existsBySessionIdAndParentUserIdAndStatusIgnoreCaseAndPlayerNameIgnoreCase(
                10L, 1L, "ACTIVE", "Kid Player")).thenReturn(false);
        when(waitlistEntryRepository.save(any(SessionWaitlistEntry.class))).thenAnswer(invocation -> {
            SessionWaitlistEntry entry = invocation.getArgument(0);
            entry.setId(99L);
            return entry;
        });

        WaitlistEntryResponse response = waitlistService.joinWaitlist(10L, request, "parent@example.com");

        ArgumentCaptor<SessionWaitlistEntry> entryCaptor = ArgumentCaptor.forClass(SessionWaitlistEntry.class);
        verify(waitlistEntryRepository).save(entryCaptor.capture());
        SessionWaitlistEntry savedEntry = entryCaptor.getValue();

        assertThat(savedEntry.getPlayerName()).isEqualTo("Kid Player");
        assertThat(savedEntry.getPlayerNickname()).isEqualTo("Ace");
        assertThat(savedEntry.getNotes()).isNull();

        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getSessionId()).isEqualTo(10L);
        assertThat(response.getUserId()).isEqualTo(1L);
        assertThat(response.getPlayerName()).isEqualTo("Kid Player");
        assertThat(response.getPlayerNickname()).isEqualTo("Ace");
        assertThat(response.getNotes()).isNull();
    }
}
