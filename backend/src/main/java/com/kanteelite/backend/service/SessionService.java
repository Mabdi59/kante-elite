package com.kanteelite.backend.service;

import com.kanteelite.backend.dto.response.SessionResponse;
import com.kanteelite.backend.entity.Session;
import com.kanteelite.backend.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;

    public List<SessionResponse> getActiveSessions() {
        return sessionRepository.findByStatus("ACTIVE").stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
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

        return SessionResponse.builder()
                .id(session.getId())
                .coachId(coachId)
                .coachName(coachName)
                .type(session.getType())
                .title(session.getTitle())
                .location(session.getLocation())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .capacity(session.getCapacity())
                .priceCents(session.getPriceCents())
                .status(session.getStatus())
                .build();
    }
}
