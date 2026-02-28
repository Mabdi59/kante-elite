package com.kanteelite.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private Long sessionId;
    private String sessionTitle;
    private Long playerId;
    private String playerName;
    private String status;
    private String paymentStatus;
    private String clientSecret;
}
