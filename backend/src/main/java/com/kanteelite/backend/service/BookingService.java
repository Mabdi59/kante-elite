package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateSessionBookingRequest;
import com.kanteelite.backend.dto.request.UpdateBookingRequest;
import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.entity.*;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.exception.UnauthorizedException;
import com.kanteelite.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final List<String> CAPACITY_CONSUMING_BOOKING_STATUSES = List.of("PENDING", "CONFIRMED");
    private static final Set<String> SUPPORTED_BOOKING_STATUSES =
            Set.of("PENDING", "CONFIRMED", "CANCELLED", "FAILED", "EXPIRED");
    private static final Set<String> SUPPORTED_PAYMENT_STATUSES =
            Set.of("PENDING", "PAID", "FAILED", "EXPIRED", "PAID_AFTER_EXPIRY");

    private final BookingRepository bookingRepository;
    private final SessionRepository sessionRepository;
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final StripeService stripeService;
    private final PaymentHoldService paymentHoldService;

    @Transactional
    public BookingResponse createSessionBooking(Long sessionId, CreateSessionBookingRequest request, String parentEmail) {
        paymentHoldService.expireStalePendingBookings();

        User parentUser = userRepository.findByEmail(parentEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Session session = sessionRepository.findByIdForUpdate(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        ensureSessionHasAvailability(session);
        validatePlayerAgeForSession(request.getPlayerAge(), session);

        String trimmedName = request.getPlayerName() == null ? "" : request.getPlayerName().trim();
        String trimmedNickname = request.getPlayerNickname() == null ? null : request.getPlayerNickname().trim();
        String trimmedNotes = request.getNotes() == null ? null : request.getNotes().trim();

        Player player = Player.builder()
                .parentUser(parentUser)
                .name(trimmedName)
                .nickname((trimmedNickname == null || trimmedNickname.isEmpty()) ? null : trimmedNickname)
                .age(request.getPlayerAge())
                .notes((trimmedNotes == null || trimmedNotes.isEmpty()) ? null : trimmedNotes)
                .build();

        player = playerRepository.save(player);

        return createBookingForEntities(session, player, parentUser);
    }

    private BookingResponse createBookingForEntities(Session session, Player player, User parentUser) {
        long amountCents = session.getPriceCents() != null ? session.getPriceCents() : 0L;
        String clientSecret = stripeService.createPaymentIntent(
                amountCents, "usd", "Booking for session: " + session.getTitle());

        Booking booking = Booking.builder()
                .session(session)
                .player(player)
                .parentUser(parentUser)
                .status("PENDING")
                .paymentStatus("PENDING")
                .stripePaymentIntentId(extractIntentId(clientSecret))
                .build();

        booking = bookingRepository.save(booking);

        return toResponse(booking, clientSecret);
    }

    private void ensureSessionHasAvailability(Session session) {
        if (session == null || session.getId() == null) {
            return;
        }
        Integer capacity = session.getCapacity();
        if (capacity == null || capacity <= 0) {
            return;
        }

        long currentParticipants = bookingRepository.countBySessionIdAndStatusIn(
                session.getId(), CAPACITY_CONSUMING_BOOKING_STATUSES);
        if (currentParticipants >= capacity) {
            throw new IllegalArgumentException("Session is full");
        }
    }

    public List<BookingResponse> getMyBookings(String parentEmail) {
        paymentHoldService.expireStalePendingBookings();

        User parentUser = userRepository.findByEmail(parentEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return bookingRepository.findByParentUserId(parentUser.getId()).stream()
                .map(b -> toResponse(b, null))
                .collect(Collectors.toList());
    }

    public BookingResponse getMyBookingById(Long bookingId, String parentEmail) {
        paymentHoldService.expireStalePendingBookings();

        User parentUser = userRepository.findByEmail(parentEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Booking booking = bookingRepository.findByIdAndParentUserId(bookingId, parentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        return toResponse(booking, null);
    }

    public List<BookingResponse> getAllBookings(String status, String paymentStatus) {
        paymentHoldService.expireStalePendingBookings();

        String normalizedStatus = normalizeFilter(status);
        if (normalizedStatus != null && !SUPPORTED_BOOKING_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid booking status filter");
        }

        String normalizedPaymentStatus = normalizeFilter(paymentStatus);
        if (normalizedPaymentStatus != null && !SUPPORTED_PAYMENT_STATUSES.contains(normalizedPaymentStatus)) {
            throw new IllegalArgumentException("Invalid payment status filter");
        }

        return bookingRepository.findAllForAdmin(normalizedStatus, normalizedPaymentStatus).stream()
                .map(b -> toResponse(b, null))
                .collect(Collectors.toList());
    }

    public BookingResponse getBookingByIdForAdmin(Long bookingId) {
        paymentHoldService.expireStalePendingBookings();

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        return toResponse(booking, null);
    }

    @Transactional
    public BookingResponse updateBooking(Long bookingId, UpdateBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        String normalizedStatus = normalizeOptionalEnumValue(
                request.getStatus(),
                SUPPORTED_BOOKING_STATUSES,
                "Invalid booking status"
        );
        if (normalizedStatus != null) {
            ensureSessionHasAvailabilityForStatusChange(booking, normalizedStatus);
            booking.setStatus(normalizedStatus);
        }

        String normalizedPaymentStatus = normalizeOptionalEnumValue(
                request.getPaymentStatus(),
                SUPPORTED_PAYMENT_STATUSES,
                "Invalid payment status"
        );
        if (normalizedPaymentStatus != null) {
            booking.setPaymentStatus(normalizedPaymentStatus);
        }

        bookingRepository.save(booking);
        return toResponse(booking, null);
    }

    @Transactional
    public void deleteBookingAsAdmin(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        bookingRepository.delete(booking);
    }

    @Transactional
    public void deleteMyBooking(Long bookingId, String parentEmail) {
        User parentUser = userRepository.findByEmail(parentEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        Booking booking = bookingRepository.findByIdAndParentUserId(bookingId, parentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
        bookingRepository.delete(booking);
    }

    private BookingResponse toResponse(Booking booking, String clientSecret) {
        return BookingResponse.builder()
                .id(booking.getId())
                .sessionId(booking.getSession() != null ? booking.getSession().getId() : null)
                .sessionTitle(booking.getSession() != null ? booking.getSession().getTitle() : null)
                .sessionType(booking.getSession() != null ? booking.getSession().getType() : null)
                .sessionStartTime(booking.getSession() != null ? booking.getSession().getStartTime() : null)
                .sessionPriceCents(booking.getSession() != null ? booking.getSession().getPriceCents() : null)
                .playerId(booking.getPlayer() != null ? booking.getPlayer().getId() : null)
                .playerName(booking.getPlayer() != null ? booking.getPlayer().getName() : null)
                .playerNickname(booking.getPlayer() != null ? booking.getPlayer().getNickname() : null)
                .playerAge(booking.getPlayer() != null ? booking.getPlayer().getAge() : null)
                .playerNotes(booking.getPlayer() != null ? booking.getPlayer().getNotes() : null)
                .userId(booking.getParentUser() != null ? booking.getParentUser().getId() : null)
                .userName(booking.getParentUser() != null ? booking.getParentUser().getName() : null)
                .userEmail(booking.getParentUser() != null ? booking.getParentUser().getEmail() : null)
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .createdAt(booking.getCreatedAt())
                .clientSecret(clientSecret)
                .build();
    }

    private void validatePlayerAgeForSession(Integer playerAge, Session session) {
        if (playerAge == null || session == null) {
            return;
        }
        Integer minAge = session.getMinAge();
        Integer maxAge = session.getMaxAge();
        if (minAge != null && playerAge < minAge) {
            throw new IllegalArgumentException("Player age is below the allowed range for this session");
        }
        if (maxAge != null && playerAge > maxAge) {
            throw new IllegalArgumentException("Player age is above the allowed range for this session");
        }
    }

    /** Extract intent id from client_secret (format: pi_xxx_secret_yyy) */
    private String extractIntentId(String clientSecret) {
        if (clientSecret == null || !clientSecret.contains("_secret_")) {
            return clientSecret;
        }
        return clientSecret.substring(0, clientSecret.indexOf("_secret_"));
    }

    private void ensureSessionHasAvailabilityForStatusChange(Booking booking, String targetStatus) {
        if (booking == null || booking.getSession() == null || booking.getSession().getId() == null) {
            return;
        }

        String currentStatus = normalizeFilter(booking.getStatus());
        boolean currentConsumesCapacity =
                currentStatus != null && CAPACITY_CONSUMING_BOOKING_STATUSES.contains(currentStatus);
        boolean targetConsumesCapacity = CAPACITY_CONSUMING_BOOKING_STATUSES.contains(targetStatus);
        if (currentConsumesCapacity || !targetConsumesCapacity) {
            return;
        }

        Session lockedSession = sessionRepository.findByIdForUpdate(booking.getSession().getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Session not found: " + booking.getSession().getId()));
        Integer capacity = lockedSession.getCapacity();
        if (capacity == null || capacity <= 0) {
            return;
        }

        long currentParticipants = bookingRepository.countBySessionIdAndStatusIn(
                lockedSession.getId(), CAPACITY_CONSUMING_BOOKING_STATUSES);
        if (currentParticipants >= capacity) {
            throw new IllegalArgumentException("Session is full");
        }
    }

    private String normalizeFilter(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.US);
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeOptionalEnumValue(String value, Set<String> allowedValues, String invalidMessage) {
        String normalized = normalizeFilter(value);
        if (normalized == null) {
            return null;
        }
        if (!allowedValues.contains(normalized)) {
            throw new IllegalArgumentException(invalidMessage);
        }
        return normalized;
    }
}
