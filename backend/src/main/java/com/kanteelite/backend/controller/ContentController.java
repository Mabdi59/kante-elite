package com.kanteelite.backend.controller;

import com.kanteelite.backend.dto.response.MediaAssetResponse;
import com.kanteelite.backend.dto.response.SiteContentBlockResponse;
import com.kanteelite.backend.service.ContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
@Tag(name = "Content")
public class ContentController {

    private final ContentService contentService;

    @GetMapping("/blocks")
    @Operation(summary = "Get all site content blocks (public)")
    public ResponseEntity<List<SiteContentBlockResponse>> getContentBlocks() {
        return ResponseEntity.ok(contentService.getPublicContentBlocks());
    }

    @GetMapping("/blocks/{key}")
    @Operation(summary = "Get one site content block by key (public)")
    public ResponseEntity<SiteContentBlockResponse> getContentBlockByKey(@PathVariable String key) {
        return ResponseEntity.ok(contentService.getPublicContentBlockByKey(key));
    }

    @GetMapping("/media")
    @Operation(summary = "Get media assets (public)")
    public ResponseEntity<List<MediaAssetResponse>> getMediaAssets(
            @RequestParam(required = false) String sectionKey) {
        return ResponseEntity.ok(contentService.getPublicMediaAssets(sectionKey));
    }
}
