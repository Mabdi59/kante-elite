package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.request.CreateMediaAssetRequest;
import com.kanteelite.backend.dto.request.UpdateMediaAssetRequest;
import com.kanteelite.backend.dto.request.UpsertSiteContentBlockRequest;
import com.kanteelite.backend.dto.response.MediaAssetResponse;
import com.kanteelite.backend.dto.response.SiteContentBlockResponse;
import com.kanteelite.backend.service.ContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/content")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Content")
public class AdminContentController {

    private final ContentService contentService;

    @GetMapping("/blocks")
    @Operation(summary = "List all site content blocks (admin)")
    public ResponseEntity<List<SiteContentBlockResponse>> getAllContentBlocks() {
        return ResponseEntity.ok(contentService.getAllContentBlocksForAdmin());
    }

    @GetMapping("/blocks/{key}")
    @Operation(summary = "Get one site content block by key (admin)")
    public ResponseEntity<SiteContentBlockResponse> getContentBlock(@PathVariable String key) {
        return ResponseEntity.ok(contentService.getContentBlockForAdmin(key));
    }

    @PutMapping("/blocks/{key}")
    @Operation(summary = "Create or update one site content block (admin)")
    public ResponseEntity<SiteContentBlockResponse> upsertContentBlock(
            @PathVariable String key,
            @Valid @RequestBody UpsertSiteContentBlockRequest request) {
        return ResponseEntity.ok(contentService.upsertContentBlock(key, request));
    }

    @DeleteMapping("/blocks/{key}")
    @Operation(summary = "Delete a site content block (admin)")
    public ResponseEntity<Void> deleteContentBlock(@PathVariable String key) {
        contentService.deleteContentBlock(key);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/media")
    @Operation(summary = "List media assets (admin)")
    public ResponseEntity<List<MediaAssetResponse>> getAllMediaAssets(
            @RequestParam(required = false) String sectionKey,
            @RequestParam(defaultValue = "true") boolean includeInactive) {
        return ResponseEntity.ok(contentService.getAllMediaAssetsForAdmin(sectionKey, includeInactive));
    }

    @GetMapping("/media/{id}")
    @Operation(summary = "Get one media asset (admin)")
    public ResponseEntity<MediaAssetResponse> getMediaAsset(@PathVariable Long id) {
        return ResponseEntity.ok(contentService.getMediaAssetForAdmin(id));
    }

    @PostMapping("/media")
    @Operation(summary = "Create a media asset (admin)")
    public ResponseEntity<MediaAssetResponse> createMediaAsset(
            @Valid @RequestBody CreateMediaAssetRequest request) {
        return ResponseEntity.ok(contentService.createMediaAsset(request));
    }

    @PatchMapping("/media/{id}")
    @Operation(summary = "Update a media asset (admin)")
    public ResponseEntity<MediaAssetResponse> updateMediaAsset(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMediaAssetRequest request) {
        return ResponseEntity.ok(contentService.updateMediaAsset(id, request));
    }

    @DeleteMapping("/media/{id}")
    @Operation(summary = "Delete a media asset (admin)")
    public ResponseEntity<Void> deleteMediaAsset(@PathVariable Long id) {
        contentService.deleteMediaAsset(id);
        return ResponseEntity.noContent().build();
    }
}
