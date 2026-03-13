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
public class WaitlistEntryResponse {
    private Long id;
    private Long sessionId;
    private Long userId;
    private String userName;
    private String userEmail;
    private String playerName;
    private String playerNickname;
    private Integer playerAge;
    private String notes;
    private String status;
    private LocalDateTime createdAt;
}
