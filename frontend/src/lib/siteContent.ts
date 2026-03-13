'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPublicMediaAssets, getPublicSiteContentBlocks } from './api'
import type { MediaAsset, SiteContentBlock } from './types'

export type SiteContentFallback<TMetadata extends Record<string, unknown>> = {
  key: string
  title?: string
  subtitle?: string
  body?: string
  ctaLabel?: string
  ctaUrl?: string
  metadata: TMetadata
}

export function useSiteContentBlock<TMetadata extends Record<string, unknown>>(
  key: string,
  fallback: SiteContentFallback<TMetadata>
) {
  const query = useQuery({
    queryKey: ['site-content-blocks'],
    queryFn: getPublicSiteContentBlocks,
    staleTime: 60_000,
  })

  const block = useMemo(() => {
    const blocks = query.data ?? []
    const found = blocks.find((item) => item.key === key)
    const mergedMetadata =
      found && found.metadata && typeof found.metadata === 'object'
        ? ({ ...fallback.metadata, ...(found.metadata as Record<string, unknown>) } as TMetadata)
        : fallback.metadata

    return {
      key,
      title: found?.title ?? fallback.title,
      subtitle: found?.subtitle ?? fallback.subtitle,
      body: found?.body ?? fallback.body,
      ctaLabel: found?.ctaLabel ?? fallback.ctaLabel,
      ctaUrl: found?.ctaUrl ?? fallback.ctaUrl,
      metadata: mergedMetadata,
      raw: found ?? null,
    }
  }, [query.data, fallback, key])

  return {
    ...block,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}

export function useSectionMedia(sectionKey: string) {
  const query = useQuery({
    queryKey: ['site-media', sectionKey],
    queryFn: () => getPublicMediaAssets(sectionKey),
    staleTime: 60_000,
  })

  const items = useMemo<MediaAsset[]>(() => {
    const media = query.data ?? []
    return media
      .filter((item) => item.active && item.sectionKey.toUpperCase() === sectionKey.toUpperCase())
      .sort((a, b) => a.displayOrder - b.displayOrder)
  }, [query.data, sectionKey])

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  }
}

export function findContentBlock(
  blocks: SiteContentBlock[],
  key: string
): SiteContentBlock | undefined {
  return blocks.find((block) => block.key === key)
}
