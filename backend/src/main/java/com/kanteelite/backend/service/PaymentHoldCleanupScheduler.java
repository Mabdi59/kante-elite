package com.kanteelite.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentHoldCleanupScheduler {

    private final PaymentHoldService paymentHoldService;

    @Scheduled(fixedDelayString = "${payment.pending-cleanup-interval-ms:300000}")
    public void expireStalePendingPaymentHolds() {
        int expiredBookings = paymentHoldService.expireStalePendingBookings();
        int expiredRegistrations = paymentHoldService.expireStalePendingRegistrations();

        if (expiredBookings > 0 || expiredRegistrations > 0) {
            log.info(
                    "Expired stale pending holds: bookings={}, registrations={}",
                    expiredBookings,
                    expiredRegistrations
            );
        }
    }
}
