package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.request.CreateBookingRequest;
import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.entity.*;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.exception.UnauthorizedException;
import com.kanteelite.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final SessionRepository sessionRepository;
    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final StripeService stripeService;

    @Transactional
    public BookingResponse createBooking(CreateBookingRequest request, String parentEmail) {
        User parentUser = userRepository.findByEmail(parentEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + request.getSessionId()));

        Player player = playerRepository.findById(request.getPlayerId())
                .orElseThrow(() -> new ResourceNotFoundException("Player not found: " + request.getPlayerId()));

        if (!player.getParentUser().getId().equals(parentUser.getId())) {
            throw new UnauthorizedException("Player does not belong to this parent");
        }

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

        bookingRepository.save(booking);

        return toResponse(booking, clientSecret);
    }

    public List<BookingResponse> getMyBookings(String parentEmail) {
        User parentUser = userRepository.findByEmail(parentEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return bookingRepository.findByParentUserId(parentUser.getId()).stream()
                .map(b -> toResponse(b, null))
                .collect(Collectors.toList());
    }

    private BookingResponse toResponse(Booking booking, String clientSecret) {
        return BookingResponse.builder()
                .id(booking.getId())
                .sessionId(booking.getSession() != null ? booking.getSession().getId() : null)
                .sessionTitle(booking.getSession() != null ? booking.getSession().getTitle() : null)
                .playerId(booking.getPlayer() != null ? booking.getPlayer().getId() : null)
                .playerName(booking.getPlayer() != null ? booking.getPlayer().getName() : null)
                .status(booking.getStatus())
                .paymentStatus(booking.getPaymentStatus())
                .clientSecret(clientSecret)
                .build();
    }

    /** Extract intent id from client_secret (format: pi_xxx_secret_yyy) */
    private String extractIntentId(String clientSecret) {
        if (clientSecret == null || !clientSecret.contains("_secret_")) {
            return clientSecret;
        }
        return clientSecret.substring(0, clientSecret.indexOf("_secret_"));
    }
}
