package com.kanteelite.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id")
    private Coach coach;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String location;

    @Column(name = "age_group")
    private String ageGroup;

    @Column(name = "skill_level")
    private String skillLevel;

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private Integer capacity;

    @Column(name = "price_cents")
    private Integer priceCents;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @Builder.Default
    @Column(name = "featured", nullable = false)
    private Boolean featured = Boolean.FALSE;

    @Builder.Default
    @Column(name = "waitlist_enabled", nullable = false)
    private Boolean waitlistEnabled = Boolean.FALSE;

    @Builder.Default
    @Column(name = "published", nullable = false)
    private Boolean published = Boolean.TRUE;

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private String status = "ACTIVE";

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
