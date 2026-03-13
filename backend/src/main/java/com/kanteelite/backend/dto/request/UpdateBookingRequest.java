package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateBookingRequest {

    @Pattern(regexp = "PENDING|CONFIRMED|CANCELLED|FAILED|EXPIRED")
    private String status;

    @Pattern(regexp = "PENDING|PAID|FAILED|EXPIRED|PAID_AFTER_EXPIRY")
    private String paymentStatus;
}
