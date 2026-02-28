package com.kanteelite.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tournament_registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Builder.Default
    private String status = "PENDING";

    @Builder.Default
    @Column(name = "payment_status")
    private String paymentStatus = "PENDING";

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;
}
