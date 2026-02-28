package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.request.RegisterTeamRequest;
import com.kanteelite.backend.dto.response.TournamentRegistrationResponse;
import com.kanteelite.backend.dto.response.TournamentResponse;
import com.kanteelite.backend.service.TournamentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@Tag(name = "Tournaments")
public class TournamentController {

    private final TournamentService tournamentService;

    @GetMapping
    @Operation(summary = "List all upcoming/active tournaments (public)")
    public ResponseEntity<List<TournamentResponse>> getTournaments() {
        return ResponseEntity.ok(tournamentService.getPublicTournaments());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tournament details (public)")
    public ResponseEntity<TournamentResponse> getTournament(@PathVariable Long id) {
        return ResponseEntity.ok(tournamentService.getTournamentById(id));
    }

    @PostMapping("/{id}/register")
    @Operation(summary = "Register a team for a tournament")
    public ResponseEntity<TournamentRegistrationResponse> registerTeam(
            @PathVariable Long id,
            @Valid @RequestBody RegisterTeamRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(tournamentService.registerTeam(id, request));
    }
}
