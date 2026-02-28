package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByParentUserId(Long parentUserId);
    Optional<Booking> findByStripePaymentIntentId(String stripePaymentIntentId);
}
