package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.request.CreateSessionRequest;
import com.kanteelite.backend.dto.request.CreateTournamentRequest;
import com.kanteelite.backend.dto.request.UpdateSessionRequest;
import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.dto.response.TournamentResponse;
import com.kanteelite.backend.service.AdminService;
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

    @PostMapping("/sessions")
    @Operation(summary = "Create a new session")
    public ResponseEntity<SessionResponse> createSession(@Valid @RequestBody CreateSessionRequest request) {
        return ResponseEntity.ok(adminService.createSession(request));
    }

    @PatchMapping("/sessions/{id}")
    @Operation(summary = "Update a session")
    public ResponseEntity<SessionResponse> updateSession(
            @PathVariable Long id,
            @RequestBody UpdateSessionRequest request) {
        return ResponseEntity.ok(adminService.updateSession(id, request));
    }

    @PostMapping("/tournaments")
    @Operation(summary = "Create a new tournament")
    public ResponseEntity<TournamentResponse> createTournament(@Valid @RequestBody CreateTournamentRequest request) {
        return ResponseEntity.ok(adminService.createTournament(request));
    }

    @GetMapping("/registrations")
    @Operation(summary = "List all tournament registrations")
    public ResponseEntity<List<TournamentRegistrationResponse>> getAllRegistrations() {
        return ResponseEntity.ok(adminService.getAllRegistrations());
    }
}
