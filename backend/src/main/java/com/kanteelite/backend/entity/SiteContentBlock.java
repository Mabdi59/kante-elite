package com.kanteelite.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_content_blocks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteContentBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "content_key", nullable = false, unique = true, length = 120)
    private String contentKey;

    @Column(length = 255)
    private String title;

    @Column(length = 512)
    private String subtitle;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "cta_label", length = 120)
    private String ctaLabel;

    @Column(name = "cta_url", length = 512)
    private String ctaUrl;

    @Builder.Default
    @Column(name = "metadata_json", columnDefinition = "TEXT", nullable = false)
    private String metadataJson = "{}";

    @Builder.Default
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (metadataJson == null || metadataJson.isBlank()) {
            metadataJson = "{}";
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (metadataJson == null || metadataJson.isBlank()) {
            metadataJson = "{}";
        }
    }
}
