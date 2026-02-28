package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.TournamentRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TournamentRegistrationRepository extends JpaRepository<TournamentRegistration, Long> {
    Optional<TournamentRegistration> findByStripePaymentIntentId(String stripePaymentIntentId);
}
