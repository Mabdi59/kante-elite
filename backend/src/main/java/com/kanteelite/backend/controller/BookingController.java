package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.request.UpdateBookingRequest;
import com.kanteelite.backend.dto.response.BookingResponse;
import com.kanteelite.backend.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings")
public class BookingController {

    private final BookingService bookingService;

    @GetMapping("/my")
    @PreAuthorize("hasRole('PARENT')")
    @Operation(summary = "List my bookings")
    public ResponseEntity<List<BookingResponse>> getMyBookings(Authentication authentication) {
        return ResponseEntity.ok(bookingService.getMyBookings(authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all bookings (admin)")
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, paymentStatus));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PARENT','ADMIN')")
    @Operation(summary = "Get a booking by id")
    public ResponseEntity<BookingResponse> getBookingById(
            @PathVariable Long id,
            Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            return ResponseEntity.ok(bookingService.getBookingByIdForAdmin(id));
        }
        return ResponseEntity.ok(bookingService.getMyBookingById(id, authentication.getName()));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a booking (admin)")
    public ResponseEntity<BookingResponse> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBookingRequest request) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PARENT','ADMIN')")
    @Operation(summary = "Delete a booking")
    public ResponseEntity<Void> deleteBooking(
            @PathVariable Long id,
            Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (isAdmin) {
            bookingService.deleteBookingAsAdmin(id);
        } else {
            bookingService.deleteMyBooking(id, authentication.getName());
        }
        return ResponseEntity.noContent().build();
    }
}
