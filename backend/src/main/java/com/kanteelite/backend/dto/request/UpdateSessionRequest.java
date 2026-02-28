package com.kanteelite.backend.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UpdateSessionRequest {
    private String type;
    private String title;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer capacity;
    private Integer priceCents;
    private String status;
}
