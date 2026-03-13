package com.kanteelite.backend.service;

import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentHoldService {

    private static final String EXPIRED_STATUS = "EXPIRED";

    @Value("${payment.pending-expiration-minutes:30}")
    private long pendingExpirationMinutes;

    private final BookingRepository bookingRepository;
    private final TournamentRegistrationRepository registrationRepository;

    @Transactional
    public int expireStalePendingBookings() {
        return bookingRepository.expirePendingBefore(
                resolveCutoff(), EXPIRED_STATUS, EXPIRED_STATUS);
    }

    @Transactional
    public int expireStalePendingRegistrations() {
        return registrationRepository.expirePendingBefore(
                resolveCutoff(), EXPIRED_STATUS, EXPIRED_STATUS);
    }

    private LocalDateTime resolveCutoff() {
        long ttlMinutes = Math.max(1L, pendingExpirationMinutes);
        return LocalDateTime.now().minusMinutes(ttlMinutes);
    }
}
