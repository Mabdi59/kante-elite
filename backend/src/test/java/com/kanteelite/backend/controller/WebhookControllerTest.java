package com.kanteelite.backend.controller;

import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class WebhookControllerTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TournamentRegistrationRepository registrationRepository;

    private WebhookController webhookController;

    @BeforeEach
    void setUp() {
        webhookController = new WebhookController(bookingRepository, registrationRepository);
        ReflectionTestUtils.setField(webhookController, "webhookSecret", "");
    }

    @Test
    void handleStripeWebhook_whenPaymentIntentEventCarriesNonPaymentIntentObject_returnsOkWithoutUpdates() {
        String payload = """
                {
                  "id": "evt_test_non_pi",
                  "object": "event",
                  "api_version": "2024-06-20",
                  "created": 1730000000,
                  "type": "payment_intent.succeeded",
                  "data": {
                    "object": {
                      "id": "ch_test_123",
                      "object": "charge"
                    }
                  }
                }
                """;

        ResponseEntity<String> response = webhookController.handleStripeWebhook(payload, null);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isEqualTo("OK");
        verifyNoInteractions(bookingRepository, registrationRepository);
    }
}
