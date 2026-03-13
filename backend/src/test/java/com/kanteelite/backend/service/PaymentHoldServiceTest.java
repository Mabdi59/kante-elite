package com.kanteelite.backend.service;

import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentHoldServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TournamentRegistrationRepository registrationRepository;

    @InjectMocks
    private PaymentHoldService paymentHoldService;

    @Test
    void expireStalePendingBookings_updatesRowsAndReturnsCount() {
        when(bookingRepository.expirePendingBefore(any(LocalDateTime.class), eq("EXPIRED"), eq("EXPIRED")))
                .thenReturn(2);

        int expired = paymentHoldService.expireStalePendingBookings();

        assertThat(expired).isEqualTo(2);
        verify(bookingRepository).expirePendingBefore(any(LocalDateTime.class), eq("EXPIRED"), eq("EXPIRED"));
    }

    @Test
    void expireStalePendingRegistrations_updatesRowsAndReturnsCount() {
        when(registrationRepository.expirePendingBefore(any(LocalDateTime.class), eq("EXPIRED"), eq("EXPIRED")))
                .thenReturn(3);

        int expired = paymentHoldService.expireStalePendingRegistrations();

        assertThat(expired).isEqualTo(3);
        verify(registrationRepository).expirePendingBefore(any(LocalDateTime.class), eq("EXPIRED"), eq("EXPIRED"));
    }
}
