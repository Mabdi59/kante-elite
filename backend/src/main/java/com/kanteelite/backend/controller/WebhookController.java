package com.kanteelite.backend.controller;

import com.kanteelite.backend.entity.Booking;
import com.kanteelite.backend.entity.TournamentRegistration;
import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.TournamentRegistrationRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks")
public class WebhookController {

    private final BookingRepository bookingRepository;
    private final TournamentRegistrationRepository registrationRepository;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/stripe")
    @Operation(summary = "Handle Stripe webhook events")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {

        Event event;

        boolean signatureVerificationEnabled = webhookSecret != null && !webhookSecret.isBlank();
        if (signatureVerificationEnabled) {
            if (sigHeader == null || sigHeader.isBlank()) {
                return ResponseEntity.badRequest().body("Missing Stripe-Signature header");
            }
            try {
                event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
            } catch (SignatureVerificationException e) {
                return ResponseEntity.badRequest().body("Invalid signature");
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Invalid payload");
            }
        } else {
            // Dev mode: parse without verification
            try {
                event = Event.PRETTY_PRINT_GSON.fromJson(payload, Event.class);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Invalid payload");
            }
        }

        if (event == null || event.getType() == null) {
            return ResponseEntity.badRequest().body("Invalid event payload");
        }

        if (event.getDataObjectDeserializer() == null) {
            return ResponseEntity.ok("Ignored event: missing data object");
        }

        Optional<StripeObject> stripeObjectOptional = event.getDataObjectDeserializer().getObject();

        switch (event.getType()) {
            case "payment_intent.succeeded" -> {
                stripeObjectOptional
                        .filter(PaymentIntent.class::isInstance)
                        .map(PaymentIntent.class::cast)
                        .ifPresent(intent -> {
                            String intentId = intent.getId();
                            updateBookingPaymentStatus(intentId, "PAID", "CONFIRMED");
                            updateRegistrationPaymentStatus(intentId, "PAID", "CONFIRMED");
                        });
            }
            case "payment_intent.payment_failed" -> {
                stripeObjectOptional
                        .filter(PaymentIntent.class::isInstance)
                        .map(PaymentIntent.class::cast)
                        .ifPresent(intent -> {
                            String intentId = intent.getId();
                            updateBookingPaymentStatus(intentId, "FAILED", "FAILED");
                            updateRegistrationPaymentStatus(intentId, "FAILED", "FAILED");
                        });
            }
            default -> { /* Unhandled event type */ }
        }

        return ResponseEntity.ok("OK");
    }

    private void updateBookingPaymentStatus(String intentId, String paymentStatus, String status) {
        bookingRepository.findByStripePaymentIntentId(intentId).ifPresent(booking -> {
            if ("PAID".equals(paymentStatus) && "EXPIRED".equals(booking.getStatus())) {
                booking.setPaymentStatus("PAID_AFTER_EXPIRY");
                bookingRepository.save(booking);
                return;
            }
            booking.setPaymentStatus(paymentStatus);
            booking.setStatus(status);
            bookingRepository.save(booking);
        });
    }

    private void updateRegistrationPaymentStatus(String intentId, String paymentStatus, String status) {
        registrationRepository.findByStripePaymentIntentId(intentId).ifPresent(reg -> {
            if ("PAID".equals(paymentStatus) && "EXPIRED".equals(reg.getStatus())) {
                reg.setPaymentStatus("PAID_AFTER_EXPIRY");
                registrationRepository.save(reg);
                return;
            }
            reg.setPaymentStatus(paymentStatus);
            reg.setStatus(status);
            registrationRepository.save(reg);
        });
    }
}
