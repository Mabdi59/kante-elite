package com.kanteelite.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentHoldCleanupSchedulerTest {

    @Mock
    private PaymentHoldService paymentHoldService;

    @InjectMocks
    private PaymentHoldCleanupScheduler scheduler;

    @Test
    void expireStalePendingPaymentHolds_invokesBothCleanupPaths() {
        when(paymentHoldService.expireStalePendingBookings()).thenReturn(1);
        when(paymentHoldService.expireStalePendingRegistrations()).thenReturn(0);

        scheduler.expireStalePendingPaymentHolds();

        verify(paymentHoldService).expireStalePendingBookings();
        verify(paymentHoldService).expireStalePendingRegistrations();
    }
}
