package com.kanteelite.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long sessionId;
    private String sessionTitle;
    private String sessionType;
    private LocalDateTime sessionStartTime;
    private Integer sessionPriceCents;
    private Long playerId;
    private String playerName;
    private String playerNickname;
    private Integer playerAge;
    private String playerNotes;
    private Long userId;
    private String userName;
    private String userEmail;
    private String status;
    private String paymentStatus;
    private LocalDateTime createdAt;
    private String clientSecret;
}
