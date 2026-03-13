package com.kanteelite.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanteelite.backend.dto.request.CreateMediaAssetRequest;
import com.kanteelite.backend.dto.request.UpdateMediaAssetRequest;
import com.kanteelite.backend.dto.request.UpsertSiteContentBlockRequest;
import com.kanteelite.backend.dto.response.MediaAssetResponse;
import com.kanteelite.backend.dto.response.SiteContentBlockResponse;
import com.kanteelite.backend.entity.MediaAsset;
import com.kanteelite.backend.entity.SiteContentBlock;
import com.kanteelite.backend.exception.ResourceNotFoundException;
import com.kanteelite.backend.repository.MediaAssetRepository;
import com.kanteelite.backend.repository.SiteContentBlockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContentService {

    private static final String DEFAULT_METADATA_JSON = "{}";

    private final SiteContentBlockRepository siteContentBlockRepository;
    private final MediaAssetRepository mediaAssetRepository;
    private final ObjectMapper objectMapper;

    public List<SiteContentBlockResponse> getPublicContentBlocks() {
        return siteContentBlockRepository.findAllByOrderByContentKeyAsc().stream()
                .map(this::toSiteContentResponse)
                .collect(Collectors.toList());
    }

    public SiteContentBlockResponse getPublicContentBlockByKey(String key) {
        SiteContentBlock block = siteContentBlockRepository.findByContentKey(normalizeRequiredKey(key))
                .orElseThrow(() -> new ResourceNotFoundException("Content block not found: " + key));
        return toSiteContentResponse(block);
    }

    public List<MediaAssetResponse> getPublicMediaAssets(String sectionKey) {
        String normalizedSectionKey = normalizeOptionalSectionKey(sectionKey);
        List<MediaAsset> assets = normalizedSectionKey == null
                ? mediaAssetRepository.findByActiveTrueOrderBySectionKeyAscDisplayOrderAscIdAsc()
                : mediaAssetRepository.findBySectionKeyAndActiveTrueOrderByDisplayOrderAscIdAsc(normalizedSectionKey);
        return assets.stream()
                .map(this::toMediaAssetResponse)
                .collect(Collectors.toList());
    }

    public List<SiteContentBlockResponse> getAllContentBlocksForAdmin() {
        return getPublicContentBlocks();
    }

    public SiteContentBlockResponse getContentBlockForAdmin(String key) {
        return getPublicContentBlockByKey(key);
    }

    @Transactional
    public SiteContentBlockResponse upsertContentBlock(String key, UpsertSiteContentBlockRequest request) {
        String normalizedKey = normalizeRequiredKey(key);

        SiteContentBlock block = siteContentBlockRepository.findByContentKey(normalizedKey)
                .orElseGet(() -> SiteContentBlock.builder().contentKey(normalizedKey).build());

        block.setTitle(normalizeOptionalValue(request.getTitle()));
        block.setSubtitle(normalizeOptionalValue(request.getSubtitle()));
        block.setBody(normalizeOptionalValue(request.getBody()));
        block.setCtaLabel(normalizeOptionalValue(request.getCtaLabel()));
        block.setCtaUrl(normalizeOptionalValue(request.getCtaUrl()));
        block.setMetadataJson(normalizeMetadataJson(request.getMetadataJson()));

        siteContentBlockRepository.save(block);
        return toSiteContentResponse(block);
    }

    @Transactional
    public void deleteContentBlock(String key) {
        SiteContentBlock block = siteContentBlockRepository.findByContentKey(normalizeRequiredKey(key))
                .orElseThrow(() -> new ResourceNotFoundException("Content block not found: " + key));
        siteContentBlockRepository.delete(block);
    }

    public List<MediaAssetResponse> getAllMediaAssetsForAdmin(String sectionKey, boolean includeInactive) {
        String normalizedSectionKey = normalizeOptionalSectionKey(sectionKey);
        List<MediaAsset> assets;
        if (normalizedSectionKey == null) {
            assets = includeInactive
                    ? mediaAssetRepository.findAllByOrderBySectionKeyAscDisplayOrderAscIdAsc()
                    : mediaAssetRepository.findByActiveTrueOrderBySectionKeyAscDisplayOrderAscIdAsc();
        } else {
            assets = includeInactive
                    ? mediaAssetRepository.findBySectionKeyOrderByDisplayOrderAscIdAsc(normalizedSectionKey)
                    : mediaAssetRepository.findBySectionKeyAndActiveTrueOrderByDisplayOrderAscIdAsc(normalizedSectionKey);
        }

        return assets.stream()
                .map(this::toMediaAssetResponse)
                .collect(Collectors.toList());
    }

    public MediaAssetResponse getMediaAssetForAdmin(Long mediaId) {
        MediaAsset asset = mediaAssetRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found: " + mediaId));
        return toMediaAssetResponse(asset);
    }

    @Transactional
    public MediaAssetResponse createMediaAsset(CreateMediaAssetRequest request) {
        MediaAsset asset = MediaAsset.builder()
                .sectionKey(normalizeRequiredSectionKey(request.getSectionKey()))
                .mediaType(normalizeMediaType(request.getMediaType()))
                .title(normalizeOptionalValue(request.getTitle()))
                .description(normalizeOptionalValue(request.getDescription()))
                .url(normalizeRequiredValue(request.getUrl(), "Media URL is required"))
                .thumbnailUrl(normalizeOptionalValue(request.getThumbnailUrl()))
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .active(request.getActive() != null ? request.getActive() : Boolean.TRUE)
                .build();

        mediaAssetRepository.save(asset);
        return toMediaAssetResponse(asset);
    }

    @Transactional
    public MediaAssetResponse updateMediaAsset(Long mediaId, UpdateMediaAssetRequest request) {
        MediaAsset asset = mediaAssetRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found: " + mediaId));

        if (request.getSectionKey() != null) {
            asset.setSectionKey(normalizeRequiredSectionKey(request.getSectionKey()));
        }
        if (request.getMediaType() != null) {
            asset.setMediaType(normalizeMediaType(request.getMediaType()));
        }
        if (request.getTitle() != null) {
            asset.setTitle(normalizeOptionalValue(request.getTitle()));
        }
        if (request.getDescription() != null) {
            asset.setDescription(normalizeOptionalValue(request.getDescription()));
        }
        if (request.getUrl() != null) {
            asset.setUrl(normalizeRequiredValue(request.getUrl(), "Media URL is required"));
        }
        if (request.getThumbnailUrl() != null) {
            asset.setThumbnailUrl(normalizeOptionalValue(request.getThumbnailUrl()));
        }
        if (request.getDisplayOrder() != null) {
            asset.setDisplayOrder(request.getDisplayOrder());
        }
        if (request.getActive() != null) {
            asset.setActive(request.getActive());
        }

        mediaAssetRepository.save(asset);
        return toMediaAssetResponse(asset);
    }

    @Transactional
    public void deleteMediaAsset(Long mediaId) {
        MediaAsset asset = mediaAssetRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media asset not found: " + mediaId));
        mediaAssetRepository.delete(asset);
    }

    private SiteContentBlockResponse toSiteContentResponse(SiteContentBlock block) {
        return SiteContentBlockResponse.builder()
                .key(block.getContentKey())
                .title(block.getTitle())
                .subtitle(block.getSubtitle())
                .body(block.getBody())
                .ctaLabel(block.getCtaLabel())
                .ctaUrl(block.getCtaUrl())
                .metadataJson(block.getMetadataJson())
                .updatedAt(block.getUpdatedAt())
                .build();
    }

    private MediaAssetResponse toMediaAssetResponse(MediaAsset asset) {
        return MediaAssetResponse.builder()
                .id(asset.getId())
                .sectionKey(asset.getSectionKey())
                .mediaType(asset.getMediaType())
                .title(asset.getTitle())
                .description(asset.getDescription())
                .url(asset.getUrl())
                .thumbnailUrl(asset.getThumbnailUrl())
                .displayOrder(asset.getDisplayOrder())
                .active(asset.getActive())
                .updatedAt(asset.getUpdatedAt())
                .build();
    }

    private String normalizeRequiredKey(String value) {
        return normalizeRequiredValue(value, "Content key is required").toLowerCase(Locale.US);
    }

    private String normalizeRequiredSectionKey(String value) {
        return normalizeRequiredValue(value, "Section key is required").toUpperCase(Locale.US);
    }

    private String normalizeOptionalSectionKey(String value) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            return null;
        }
        return normalized.toUpperCase(Locale.US);
    }

    private String normalizeMediaType(String value) {
        String normalized = normalizeRequiredValue(value, "Media type is required").toUpperCase(Locale.US);
        if (!"PHOTO".equals(normalized) && !"VIDEO".equals(normalized)) {
            throw new IllegalArgumentException("Invalid media type");
        }
        return normalized;
    }

    private String normalizeMetadataJson(String raw) {
        String normalized = normalizeOptionalValue(raw);
        if (normalized == null) {
            return DEFAULT_METADATA_JSON;
        }
        try {
            JsonNode node = objectMapper.readTree(normalized);
            return objectMapper.writeValueAsString(node);
        } catch (Exception ex) {
            throw new IllegalArgumentException("metadataJson must be valid JSON");
        }
    }

    private String normalizeRequiredValue(String value, String message) {
        String normalized = normalizeOptionalValue(value);
        if (normalized == null) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String normalizeOptionalValue(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
