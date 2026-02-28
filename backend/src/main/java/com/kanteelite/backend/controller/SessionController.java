package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions")
public class SessionController {

    private final SessionService sessionService;

    @GetMapping
    @Operation(summary = "List all active sessions (public)")
    public ResponseEntity<List<SessionResponse>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }
}
