package com.kanteelite.backend.repository;

import com.kanteelite.backend.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByParentUserId(Long parentUserId);
    Optional<Booking> findByIdAndParentUserId(Long id, Long parentUserId);
    Optional<Booking> findByStripePaymentIntentId(String stripePaymentIntentId);
    long countBySessionIdAndStatusIn(Long sessionId, Collection<String> statuses);
    long deleteBySessionId(Long sessionId);

    @Query("""
            select b
            from Booking b
            where (:status is null or upper(b.status) = :status)
              and (:paymentStatus is null or upper(b.paymentStatus) = :paymentStatus)
            order by b.createdAt desc
            """)
    List<Booking> findAllForAdmin(
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus);

    @Modifying
    @Query("""
            update Booking b
            set b.status = :expiredStatus, b.paymentStatus = :expiredPaymentStatus
            where b.status = 'PENDING' and b.createdAt < :cutoff
            """)
    int expirePendingBefore(
            @Param("cutoff") LocalDateTime cutoff,
            @Param("expiredStatus") String expiredStatus,
            @Param("expiredPaymentStatus") String expiredPaymentStatus);
}
