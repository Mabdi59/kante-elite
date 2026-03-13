package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateWaitlistEntryRequest;
import com.kanteelite.backend.dto.response.WaitlistEntryResponse;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.entity.SessionWaitlistEntry;
import com.kanteelite.backend.entity.User;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.exception.UnauthorizedException;
import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.SessionRepository;
import com.kanteelite.backend.repository.SessionWaitlistEntryRepository;
import com.kanteelite.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaitlistService {

    private static final List<String> CAPACITY_CONSUMING_BOOKING_STATUSES = List.of("PENDING", "CONFIRMED");

    private final SessionRepository sessionRepository;
    private final SessionWaitlistEntryRepository waitlistEntryRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentHoldService paymentHoldService;

    @Transactional
    public WaitlistEntryResponse joinWaitlist(Long sessionId, CreateWaitlistEntryRequest request, String parentEmail) {
        paymentHoldService.expireStalePendingBookings();

        User parentUser = userRepository.findByEmail(parentEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        Session session = sessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        if (!"ACTIVE".equalsIgnoreCase(session.getStatus()) || !Boolean.TRUE.equals(session.getPublished())) {
            throw new IllegalArgumentException("Waitlist is not available for this session");
        }
        if (!Boolean.TRUE.equals(session.getWaitlistEnabled())) {
            throw new IllegalArgumentException("Waitlist is disabled for this session");
        }

        ensureSessionIsFull(session);
        validateAgeRange(request.getPlayerAge(), session.getMinAge(), session.getMaxAge());
        String normalizedPlayerName = normalizeRequired(request.getPlayerName(), "Player name is required");

        boolean alreadyOnWaitlist = waitlistEntryRepository
                .existsBySessionIdAndParentUserIdAndStatusIgnoreCaseAndPlayerNameIgnoreCase(
                        session.getId(), parentUser.getId(), "ACTIVE", normalizedPlayerName);
        if (alreadyOnWaitlist) {
            throw new IllegalArgumentException("Player is already on the waitlist for this session");
        }

        SessionWaitlistEntry entry = SessionWaitlistEntry.builder()
                .session(session)
                .parentUser(parentUser)
                .playerName(normalizedPlayerName)
                .playerNickname(normalizeOptional(request.getPlayerNickname()))
                .playerAge(request.getPlayerAge())
                .notes(normalizeOptional(request.getNotes()))
                .status("ACTIVE")
                .build();

        waitlistEntryRepository.save(entry);
        return toResponse(entry);
    }

    public List<WaitlistEntryResponse> getWaitlistForSession(Long sessionId) {
        sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        return waitlistEntryRepository.findBySessionIdOrderByCreatedAtAsc(sessionId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private void ensureSessionIsFull(Session session) {
        Integer capacity = session.getCapacity();
        if (capacity == null || capacity <= 0) {
            throw new IllegalArgumentException("Session capacity is not configured");
        }
        long currentParticipants = bookingRepository.countBySessionIdAndStatusIn(
                session.getId(), CAPACITY_CONSUMING_BOOKING_STATUSES);
        if (currentParticipants < capacity) {
            throw new IllegalArgumentException("Session still has open spots");
        }
    }

    private void validateAgeRange(Integer playerAge, Integer minAge, Integer maxAge) {
        if (playerAge == null) {
            return;
        }
        if (minAge != null && playerAge < minAge) {
            throw new IllegalArgumentException("Player age is below the allowed range for this session");
        }
        if (maxAge != null && playerAge > maxAge) {
            throw new IllegalArgumentException("Player age is above the allowed range for this session");
        }
    }

    private WaitlistEntryResponse toResponse(SessionWaitlistEntry entry) {
        return WaitlistEntryResponse.builder()
                .id(entry.getId())
                .sessionId(entry.getSession() != null ? entry.getSession().getId() : null)
                .userId(entry.getParentUser() != null ? entry.getParentUser().getId() : null)
                .userName(entry.getParentUser() != null ? entry.getParentUser().getName() : null)
                .userEmail(entry.getParentUser() != null ? entry.getParentUser().getEmail() : null)
                .playerName(entry.getPlayerName())
                .playerNickname(entry.getPlayerNickname())
                .playerAge(entry.getPlayerAge())
                .notes(entry.getNotes())
                .status(entry.getStatus())
                .createdAt(entry.getCreatedAt())
                .build();
    }

    private String normalizeRequired(String value, String message) {
        String normalized = normalizeOptional(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
