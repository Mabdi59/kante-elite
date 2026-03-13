package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.request.CreateSessionRequest;
import com.kanteelite.backend.dto.request.CreateTournamentRequest;
import com.kanteelite.backend.dto.request.UpdateSessionRequest;
import com.kanteelite.backend.dto.request.UpdateTournamentRegistrationRequest;
import com.kanteelite.backend.dto.request.UpdateTournamentRequest;
import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.dto.response.TournamentResponse;
import com.kanteelite.backend.dto.response.WaitlistEntryResponse;
import com.kanteelite.backend.service.AdminService;
import com.kanteelite.backend.service.WaitlistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin")
public class AdminController {

    private final AdminService adminService;
    private final WaitlistService waitlistService;

    @GetMapping("/sessions")
    @Operation(summary = "List sessions (admin)")
    public ResponseEntity<List<SessionResponse>> getAllSessions(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.getAllSessions(status));
    }

    @GetMapping("/sessions/{id}")
    @Operation(summary = "Get a session by id (admin)")
    public ResponseEntity<SessionResponse> getSession(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getSessionById(id));
    }

    @PostMapping("/sessions")
    @Operation(summary = "Create a new session")
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        return ResponseEntity.ok(adminService.createSession(request));
    }

    @PatchMapping("/sessions/{id}")
    @Operation(summary = "Update a session")
    public ResponseEntity<SessionResponse> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSessionRequest request) {
        return ResponseEntity.ok(adminService.updateSession(id, request));
    }

    @DeleteMapping("/sessions/{id}")
    @Operation(summary = "Delete a session")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        adminService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions/{id}/duplicate")
    @Operation(summary = "Duplicate a session")
    public ResponseEntity<SessionResponse> duplicateSession(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") Integer copies) {
        return ResponseEntity.ok(adminService.duplicateSession(id, copies));
    }

    @GetMapping("/sessions/{id}/waitlist")
    @Operation(summary = "List waitlist entries for a session")
    public ResponseEntity<List<WaitlistEntryResponse>> getSessionWaitlist(@PathVariable Long id) {
        return ResponseEntity.ok(waitlistService.getWaitlistForSession(id));
    }

    @GetMapping("/tournaments")
    @Operation(summary = "List tournaments (admin)")
    public ResponseEntity<List<TournamentResponse>> getAllTournaments(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(adminService.getAllTournaments(status));
    }

    @GetMapping("/tournaments/{id}")
    @Operation(summary = "Get a tournament by id (admin)")
    public ResponseEntity<TournamentResponse> getTournament(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getTournamentById(id));
    }

    @PostMapping("/tournaments")
    @Operation(summary = "Create a new tournament")
    public ResponseEntity<TournamentResponse> createTournament(@Valid @RequestBody CreateTournamentRequest request) {
        return ResponseEntity.ok(adminService.createTournament(request));
    }

    @PatchMapping("/tournaments/{id}")
    @Operation(summary = "Update a tournament")
    public ResponseEntity<TournamentResponse> updateTournament(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTournamentRequest request) {
        return ResponseEntity.ok(adminService.updateTournament(id, request));
    }

    @DeleteMapping("/tournaments/{id}")
    @Operation(summary = "Delete a tournament")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        adminService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/registrations")
    @Operation(summary = "List all tournament registrations")
    public ResponseEntity<List<TournamentRegistrationResponse>> getAllRegistrations(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String paymentStatus) {
        return ResponseEntity.ok(adminService.getAllRegistrations(status, paymentStatus));
    }

    @GetMapping("/registrations/{id}")
    @Operation(summary = "Get a registration by id")
    public ResponseEntity<TournamentRegistrationResponse> getRegistration(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getRegistrationById(id));
    }

    @PatchMapping("/registrations/{id}")
    @Operation(summary = "Update a tournament registration")
    public ResponseEntity<TournamentRegistrationResponse> updateRegistration(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTournamentRegistrationRequest request) {
        return ResponseEntity.ok(adminService.updateRegistration(id, request));
    }

    @DeleteMapping("/registrations/{id}")
    @Operation(summary = "Delete a tournament registration")
    public ResponseEntity<Void> deleteRegistration(@PathVariable Long id) {
        adminService.deleteRegistration(id);
        return ResponseEntity.noContent().build();
    }
}
