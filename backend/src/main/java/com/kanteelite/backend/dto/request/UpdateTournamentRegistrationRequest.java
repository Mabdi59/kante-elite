package com.kanteelite.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateTournamentRegistrationRequest {

    private String teamName;

    private String coachName;

    @Email
    private String contactEmail;

    @Pattern(regexp = "U8|U10|U12|U14|U16|U18")
    private String ageGroup;

    @Pattern(regexp = "PENDING|CONFIRMED|CANCELLED|FAILED|EXPIRED")
    private String status;

    @Pattern(regexp = "PENDING|PAID|FAILED|EXPIRED|PAID_AFTER_EXPIRY")
    private String paymentStatus;
}
