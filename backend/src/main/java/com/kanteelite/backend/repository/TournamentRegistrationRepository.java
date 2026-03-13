package com.kanteelite.backend.repository;

import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.entity.TournamentRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TournamentRegistrationRepository extends JpaRepository<TournamentRegistration, Long> {
    Optional<TournamentRegistration> findByStripePaymentIntentId(String stripePaymentIntentId);
    long countByTournamentIdAndStatusIn(Long tournamentId, Collection<String> statuses);
    long countByTeamId(Long teamId);
    long deleteByTournamentId(Long tournamentId);

    @Modifying
    @Query("""
            update TournamentRegistration tr
            set tr.status = :expiredStatus, tr.paymentStatus = :expiredPaymentStatus
            where tr.status = 'PENDING' and tr.createdAt < :cutoff
            """)
    int expirePendingBefore(
            @Param("cutoff") LocalDateTime cutoff,
            @Param("expiredStatus") String expiredStatus,
            @Param("expiredPaymentStatus") String expiredPaymentStatus);

    @Query("""
            select new com.kanteelite.backend.dto.response.TournamentRegistrationResponse(
                tr.id,
                t.id,
                t.name,
                tm.id,
                tm.name,
                tm.coachName,
                tm.contactEmail,
                tm.ageGroup,
                tr.status,
                tr.paymentStatus,
                null,
                tr.createdAt
            )
            from TournamentRegistration tr
            left join tr.tournament t
            left join tr.team tm
            where (:status is null or upper(tr.status) = :status)
              and (:paymentStatus is null or upper(coalesce(tr.paymentStatus, '')) = :paymentStatus)
            """)
    List<TournamentRegistrationResponse> findAllAdminRegistrationResponses(
            @Param("status") String status,
            @Param("paymentStatus") String paymentStatus);
}
