package com.kanteelite.backend.service;

import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StripeService {

    @Value("${stripe.secret:}")
    private String stripeSecretKey;

    /**
     * Creates a Stripe PaymentIntent for the given amount (in cents).
     * If STRIPE_SECRET_KEY is blank (dev/test), returns a mock client secret.
     */
    public String createPaymentIntent(long amountCents, String currency, String description) {
        if (stripeSecretKey == null || stripeSecretKey.isBlank()) {
            return "mock_client_secret_" + System.currentTimeMillis();
        }

        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountCents)
                    .setCurrency(currency)
                    .setDescription(description)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build()
                    )
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            return intent.getClientSecret();
        } catch (StripeException e) {
            throw new RuntimeException("Stripe error: " + e.getMessage(), e);
        }
    }

    public boolean isConfigured() {
        return stripeSecretKey != null && !stripeSecretKey.isBlank();
    }
}
