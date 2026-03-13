package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.repository.BookingRepository;
import com.kanteelite.backend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    public record SessionCatalogResult(List<SessionResponse> items, int totalCount) {}

    private static final List<String> CAPACITY_CONSUMING_BOOKING_STATUSES = List.of("PENDING", "CONFIRMED");

    private final SessionRepository sessionRepository;
    private final BookingRepository bookingRepository;
    private final PaymentHoldService paymentHoldService;

    public SessionCatalogResult getPublicSessions(
            String type,
            String ageGroup,
            String skillLevel,
            String location,
            Integer minDurationMinutes,
            Integer maxDurationMinutes,
            Integer minPriceCents,
            Integer maxPriceCents,
            LocalDate dateFrom,
            LocalDate dateTo,
            boolean onlyOpenSpots,
            Integer page,
            Integer size,
            String sort
    ) {
        paymentHoldService.expireStalePendingBookings();

        List<SessionResponse> sessions = sessionRepository
                .findByStatusAndPublishedTrueOrderByStartTimeAsc("ACTIVE")
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        List<SessionResponse> filtered = sessions.stream()
                .filter(session -> matchesType(session, type))
                .filter(session -> matchesAgeGroup(session, ageGroup))
                .filter(session -> matchesSkillLevel(session, skillLevel))
                .filter(session -> matchesLocation(session, location))
                .filter(session -> matchesDuration(session, minDurationMinutes, maxDurationMinutes))
                .filter(session -> matchesPrice(session, minPriceCents, maxPriceCents))
                .filter(session -> matchesDateRange(session, dateFrom, dateTo))
                .filter(session -> !onlyOpenSpots || hasOpenSpots(session))
                .collect(Collectors.toCollection(ArrayList::new));

        applySort(filtered, sort);
        int totalCount = filtered.size();
        List<SessionResponse> paged = applyPagination(filtered, page, size);
        return new SessionCatalogResult(paged, totalCount);
    }

    public List<SessionResponse> getActiveSessions() {
        paymentHoldService.expireStalePendingBookings();

        return sessionRepository.findByStatusAndPublishedTrueOrderByStartTimeAsc("ACTIVE").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SessionResponse> getAllSessions() {
        paymentHoldService.expireStalePendingBookings();
        return sessionRepository.findAllByOrderByStartTimeAsc().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<SessionResponse> getSessionsByStatus(String status) {
        paymentHoldService.expireStalePendingBookings();
        return sessionRepository.findByStatusOrderByStartTimeAsc(status).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public SessionResponse getSessionById(Long sessionId) {
        paymentHoldService.expireStalePendingBookings();
        Session session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        return toResponse(session);
    }

    public SessionResponse getFeaturedSession() {
        paymentHoldService.expireStalePendingBookings();
        Session session = sessionRepository.findFirstByStatusAndPublishedTrueAndFeaturedTrueOrderByStartTimeAsc("ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("No featured session available"));
        return toResponse(session);
    }

    public SessionResponse toResponse(Session session) {
        String coachName = null;
        Long coachId = null;
        if (session.getCoach() != null) {
            coachId = session.getCoach().getId();
            if (session.getCoach().getUser() != null) {
                coachName = session.getCoach().getUser().getName();
            }
        }
        long currentParticipantsCount = session.getId() != null
                ? bookingRepository.countBySessionIdAndStatusIn(
                        session.getId(), CAPACITY_CONSUMING_BOOKING_STATUSES)
                : 0L;
        int currentParticipants = currentParticipantsCount > Integer.MAX_VALUE
                ? Integer.MAX_VALUE
                : (int) currentParticipantsCount;

        Integer capacity = session.getCapacity();
        Integer availableSpots = null;
        if (capacity != null) {
            availableSpots = Math.max(0, capacity - currentParticipants);
        }

        return SessionResponse.builder()
                .id(session.getId())
                .coachId(coachId)
                .coachName(coachName)
                .type(session.getType())
                .title(session.getTitle())
                .description(session.getDescription())
                .location(session.getLocation())
                .ageGroup(session.getAgeGroup())
                .skillLevel(session.getSkillLevel())
                .imageUrl(session.getImageUrl())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .capacity(capacity)
                .currentParticipants(currentParticipants)
                .priceCents(session.getPriceCents())
                .minAge(session.getMinAge())
                .maxAge(session.getMaxAge())
                .availableSpots(availableSpots)
                .featured(Boolean.TRUE.equals(session.getFeatured()))
                .waitlistEnabled(Boolean.TRUE.equals(session.getWaitlistEnabled()))
                .published(Boolean.TRUE.equals(session.getPublished()))
                .createdAt(session.getCreatedAt())
                .status(session.getStatus())
                .build();
    }

    private boolean matchesType(SessionResponse session, String type) {
        if (type == null || type.isBlank()) {
            return true;
        }
        return equalsIgnoreCase(session.getType(), type);
    }

    private boolean matchesAgeGroup(SessionResponse session, String ageGroup) {
        if (ageGroup == null || ageGroup.isBlank()) {
            return true;
        }
        if (session.getAgeGroup() == null || session.getAgeGroup().isBlank()) {
            return false;
        }
        String normalizedTarget = ageGroup.trim().toUpperCase(Locale.US);
        String normalizedSession = session.getAgeGroup().trim().toUpperCase(Locale.US);
        return normalizedSession.contains(normalizedTarget);
    }

    private boolean matchesSkillLevel(SessionResponse session, String skillLevel) {
        if (skillLevel == null || skillLevel.isBlank()) {
            return true;
        }
        if (session.getSkillLevel() == null || session.getSkillLevel().isBlank()) {
            return false;
        }
        return equalsIgnoreCase(session.getSkillLevel(), skillLevel);
    }

    private boolean matchesLocation(SessionResponse session, String location) {
        if (location == null || location.isBlank()) {
            return true;
        }
        if (session.getLocation() == null || session.getLocation().isBlank()) {
            return false;
        }
        return session.getLocation().toLowerCase(Locale.US).contains(location.trim().toLowerCase(Locale.US));
    }

    private boolean matchesDuration(SessionResponse session, Integer minDurationMinutes, Integer maxDurationMinutes) {
        if (session.getStartTime() == null || session.getEndTime() == null) {
            return minDurationMinutes == null && maxDurationMinutes == null;
        }
        long duration = java.time.Duration.between(session.getStartTime(), session.getEndTime()).toMinutes();
        if (duration < 0) {
            duration = 0;
        }
        if (minDurationMinutes != null && duration < minDurationMinutes) {
            return false;
        }
        if (maxDurationMinutes != null && duration > maxDurationMinutes) {
            return false;
        }
        return true;
    }

    private boolean matchesPrice(SessionResponse session, Integer minPriceCents, Integer maxPriceCents) {
        int price = session.getPriceCents() == null ? 0 : session.getPriceCents();
        if (minPriceCents != null && price < minPriceCents) {
            return false;
        }
        if (maxPriceCents != null && price > maxPriceCents) {
            return false;
        }
        return true;
    }

    private boolean matchesDateRange(SessionResponse session, LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom == null && dateTo == null) {
            return true;
        }
        if (session.getStartTime() == null) {
            return false;
        }
        LocalDate date = session.getStartTime().toLocalDate();
        if (dateFrom != null && date.isBefore(dateFrom)) {
            return false;
        }
        if (dateTo != null && date.isAfter(dateTo)) {
            return false;
        }
        return true;
    }

    private boolean hasOpenSpots(SessionResponse session) {
        Integer capacity = session.getCapacity();
        Integer current = session.getCurrentParticipants();
        if (capacity == null || capacity <= 0) {
            return true;
        }
        if (current == null) {
            return true;
        }
        return current < capacity;
    }

    private void applySort(List<SessionResponse> sessions, String sort) {
        String normalized = sort == null ? "date" : sort.trim().toLowerCase(Locale.US);
        Comparator<SessionResponse> comparator;

        switch (normalized) {
            case "priceasc":
                comparator = Comparator.comparing(session -> session.getPriceCents() == null ? 0 : session.getPriceCents());
                break;
            case "pricedesc":
                comparator = Comparator.<SessionResponse>comparingInt(
                                session -> session.getPriceCents() == null ? 0 : session.getPriceCents())
                        .reversed();
                break;
            case "spots":
                comparator = Comparator.<SessionResponse>comparingInt(session -> {
                            Integer available = session.getAvailableSpots();
                            return available == null ? Integer.MAX_VALUE : available;
                        })
                        .reversed();
                break;
            case "date":
            default:
                comparator = Comparator.comparing(
                        session -> session.getStartTime() == null ? java.time.LocalDateTime.MIN : session.getStartTime());
                break;
        }
        sessions.sort(comparator);
    }

    private List<SessionResponse> applyPagination(List<SessionResponse> sessions, Integer page, Integer size) {
        if (page == null || size == null) {
            return sessions;
        }
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        int fromIndex = safePage * safeSize;
        if (fromIndex >= sessions.size()) {
            return List.of();
        }
        int toIndex = Math.min(sessions.size(), fromIndex + safeSize);
        return sessions.subList(fromIndex, toIndex);
    }

    private boolean equalsIgnoreCase(String left, String right) {
        if (left == null || right == null) {
            return false;
        }
        return left.trim().equalsIgnoreCase(right.trim());
    }
}
