package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.request.CreateSessionBookingRequest;
import com.kanteelite.backend.dto.request.CreateWaitlistEntryRequest;
import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.dto.response.WaitlistEntryResponse;
import com.kanteelite.backend.service.BookingService;
import com.kanteelite.backend.service.SessionService;
import com.kanteelite.backend.service.WaitlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions")
public class SessionController {

    private final SessionService sessionService;
    private final BookingService bookingService;
    private final WaitlistService waitlistService;

    @GetMapping
    @Operation(summary = "List all active sessions (public)")
    public ResponseEntity<List<SessionResponse>> getActiveSessions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String ageGroup,
            @RequestParam(required = false) String skillLevel,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minDurationMinutes,
            @RequestParam(required = false) Integer maxDurationMinutes,
            @RequestParam(required = false) Integer minPriceCents,
            @RequestParam(required = false) Integer maxPriceCents,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "false") boolean onlyOpenSpots,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "date") String sort
    ) {
        SessionService.SessionCatalogResult result = sessionService.getPublicSessions(
                type,
                ageGroup,
                skillLevel,
                location,
                minDurationMinutes,
                maxDurationMinutes,
                minPriceCents,
                maxPriceCents,
                dateFrom,
                dateTo,
                onlyOpenSpots,
                page,
                size,
                sort
        );
        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(result.totalCount()))
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "X-Total-Count")
                .body(result.items());
    }

    @GetMapping("/featured")
    @Operation(summary = "Get featured session (public)")
    public ResponseEntity<SessionResponse> getFeaturedSession() {
        return ResponseEntity.ok(sessionService.getFeaturedSession());
    }

    @PostMapping("/{id}/bookings")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "Create a booking for a session")
    public ResponseEntity<BookingResponse> createSessionBooking(
            @PathVariable Long id,
            @Valid @RequestBody CreateSessionBookingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(bookingService.createSessionBooking(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/waitlist")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "Join session waitlist")
    public ResponseEntity<WaitlistEntryResponse> joinWaitlist(
            @PathVariable Long id,
            @Valid @RequestBody CreateWaitlistEntryRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(waitlistService.joinWaitlist(id, request, authentication.getName()));
    }
}
