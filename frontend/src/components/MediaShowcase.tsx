'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Play, X } from 'lucide-react'
import { useSectionMedia, useSiteContentBlock } from '@/lib/siteContent'

type MediaIntroMeta = {
  emptyMessage: string
  featuredVideoIndex?: number
}

const PHOTO_PLACEHOLDERS = [
  '/media/placeholders/photo-1.svg',
  '/media/placeholders/photo-2.svg',
  '/media/placeholders/photo-3.svg',
]

function getPhotoPlaceholder(index: number): string {
  return PHOTO_PLACEHOLDERS[index % PHOTO_PLACEHOLDERS.length]
}

function normalizePhotoUrl(url: string, index: number): string {
  if (!url || url.includes('via.placeholder.com')) {
    return getPhotoPlaceholder(index)
  }
  return url
}

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()

    if (host === 'youtu.be' || host === 'www.youtu.be') {
      const path = parsed.pathname.replace(/^\/+/, '')
      return path ? path.split('/')[0] : null
    }

    if (host.endsWith('youtube.com')) {
      if (parsed.pathname.startsWith('/watch')) return parsed.searchParams.get('v')
      if (parsed.pathname.startsWith('/embed/')) {
        const path = parsed.pathname.replace('/embed/', '')
        return path ? path.split('/')[0] : null
      }
    }
  } catch {
    return null
  }

  return null
}

function buildEmbedUrl(url: string, youtubeId: string | null): string {
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=0`
  }
  return url
}

export default function MediaShowcase() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [activeVideoId, setActiveVideoId] = useState<number | null>(null)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [touchEndX, setTouchEndX] = useState<number | null>(null)

  const photosBlock = useSiteContentBlock<MediaIntroMeta>('home.photos', {
    key: 'home.photos',
    title: 'Photo Gallery',
    body: 'Highlights from sessions, tournaments, and community events.',
    metadata: {
      emptyMessage: 'No photos added yet.',
    },
  })

  const videosBlock = useSiteContentBlock<MediaIntroMeta>('home.videos', {
    key: 'home.videos',
    title: 'Video Highlights',
    body: 'Training clips, showcases, and match moments.',
    metadata: {
      emptyMessage: 'No videos added yet.',
      featuredVideoIndex: 0,
    },
  })

  const { items: photos, isLoading: photosLoading } = useSectionMedia('HOME_PHOTOS')
  const { items: videos, isLoading: videosLoading } = useSectionMedia('HOME_VIDEOS')

  const displayPhotos = useMemo(() => {
    return photos.map((photo, index) => ({
      ...photo,
      displayUrl: normalizePhotoUrl(photo.url, index),
    }))
  }, [photos])

  const displayVideos = useMemo(() => {
    return videos.map((video) => {
      const youtubeVideoId = extractYouTubeVideoId(video.url)
      return {
        ...video,
        youtubeVideoId,
        embedUrl: buildEmbedUrl(video.url, youtubeVideoId),
        previewImage: youtubeVideoId
          ? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`
          : video.thumbnailUrl ?? '/media/placeholders/photo-1.svg',
      }
    })
  }, [videos])

  const featuredVideoIndex =
    typeof videosBlock.metadata.featuredVideoIndex === 'number' && videosBlock.metadata.featuredVideoIndex >= 0
      ? videosBlock.metadata.featuredVideoIndex
      : 0

  const sortedVideos = useMemo(() => {
    if (displayVideos.length === 0) {
      return []
    }
    const safeIndex = Math.min(featuredVideoIndex, displayVideos.length - 1)
    if (safeIndex <= 0) {
      return displayVideos
    }
    const featured = displayVideos[safeIndex]
    return [featured, ...displayVideos.filter((video) => video.id !== featured.id)]
  }, [displayVideos, featuredVideoIndex])

  const photosEmptyMessage =
    typeof photosBlock.metadata.emptyMessage === 'string' && photosBlock.metadata.emptyMessage.trim()
      ? photosBlock.metadata.emptyMessage
      : 'No photos added yet.'
  const videosEmptyMessage =
    typeof videosBlock.metadata.emptyMessage === 'string' && videosBlock.metadata.emptyMessage.trim()
      ? videosBlock.metadata.emptyMessage
      : 'No videos added yet.'

  const goToPreviousPhoto = useCallback(() => {
    if (lightboxIndex == null || displayPhotos.length === 0) return
    setLightboxIndex((lightboxIndex - 1 + displayPhotos.length) % displayPhotos.length)
  }, [displayPhotos.length, lightboxIndex])

  const goToNextPhoto = useCallback(() => {
    if (lightboxIndex == null || displayPhotos.length === 0) return
    setLightboxIndex((lightboxIndex + 1) % displayPhotos.length)
  }, [displayPhotos.length, lightboxIndex])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (lightboxIndex == null) {
        return
      }
      if (event.key === 'Escape') setLightboxIndex(null)
      if (event.key === 'ArrowLeft') goToPreviousPhoto()
      if (event.key === 'ArrowRight') goToNextPhoto()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goToNextPhoto, goToPreviousPhoto, lightboxIndex])

  const handleLightboxTouchEnd = () => {
    if (touchStartX == null || touchEndX == null) {
      setTouchStartX(null)
      setTouchEndX(null)
      return
    }
    const delta = touchStartX - touchEndX
    if (Math.abs(delta) >= 45) {
      if (delta > 0) goToNextPhoto()
      else goToPreviousPhoto()
    }
    setTouchStartX(null)
    setTouchEndX(null)
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              {photosBlock.title ?? 'Photo Gallery'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{photosBlock.body}</p>
          </div>

          {photosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-64 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : displayPhotos.length === 0 ? (
            <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded-2xl py-10">
              {photosEmptyMessage}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {displayPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="group elevate-card rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 text-left"
                >
                  <Image
                    src={photo.displayUrl}
                    alt={photo.title ?? 'Kante Elite photo'}
                    width={1200}
                    height={800}
                    className="w-full h-56 object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                  {(photo.title || photo.description) && (
                    <div className="p-4">
                      {photo.title && <div className="font-semibold text-gray-900">{photo.title}</div>}
                      {photo.description && <p className="text-sm text-gray-600 mt-1">{photo.description}</p>}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              {videosBlock.title ?? 'Video Highlights'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{videosBlock.body}</p>
          </div>

          {videosLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-72 rounded-2xl skeleton-shimmer" />
              ))}
            </div>
          ) : sortedVideos.length === 0 ? (
            <div className="text-center text-gray-500 border border-dashed border-gray-300 rounded-2xl py-10">
              {videosEmptyMessage}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedVideos.map((video, index) => {
                const isActive = activeVideoId === video.id
                return (
                  <div key={video.id} className="rounded-2xl overflow-hidden border border-gray-200 bg-black shadow-sm">
                    {isActive ? (
                      <iframe
                        src={video.embedUrl}
                        title={video.title ?? `Video ${video.id}`}
                        className="w-full h-64 md:h-72"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        loading="lazy"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveVideoId(video.id)}
                        className="relative w-full h-64 md:h-72 text-left"
                      >
                        <Image
                          src={video.previewImage}
                          alt={video.title ?? 'Video preview'}
                          fill
                          className="object-cover opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/50" />
                        {index === 0 && (
                          <span className="absolute left-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-green-900">
                            FEATURED
                          </span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-green-800 shadow-lg">
                            <Play className="h-7 w-7 ml-1" />
                          </span>
                        </span>
                      </button>
                    )}
                    {(video.title || video.description) && (
                      <div className="p-4 bg-white">
                        {video.title && <div className="font-semibold text-gray-900">{video.title}</div>}
                        {video.description && <p className="text-sm text-gray-600 mt-1">{video.description}</p>}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {lightboxIndex != null && displayPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm p-4 sm:p-8 flex flex-col"
          role="dialog"
          aria-modal="true"
          onTouchStart={(event) => setTouchStartX(event.changedTouches[0]?.clientX ?? null)}
          onTouchMove={(event) => setTouchEndX(event.changedTouches[0]?.clientX ?? null)}
          onTouchEnd={handleLightboxTouchEnd}
        >
          <div className="flex items-center justify-between mb-4 text-white">
            <div className="text-sm sm:text-base font-semibold">
              {displayPhotos[lightboxIndex].title ?? `Photo ${lightboxIndex + 1}`}
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="rounded-full border border-white/30 p-2 hover:bg-white/10"
              aria-label="Close photo lightbox"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 min-h-[260px]">
            <Image
              src={displayPhotos[lightboxIndex].displayUrl}
              alt={displayPhotos[lightboxIndex].title ?? 'Expanded gallery photo'}
              fill
              className="object-contain"
            />
          </div>

          {displayPhotos.length > 1 && (
            <div className="mt-4 flex items-center justify-between text-white">
              <button
                type="button"
                onClick={goToPreviousPhoto}
                className="rounded-lg border border-white/30 px-4 py-2 hover:bg-white/10"
              >
                Previous
              </button>
              <span className="text-sm text-white/80">
                {lightboxIndex + 1} / {displayPhotos.length}
              </span>
              <button
                type="button"
                onClick={goToNextPhoto}
                className="rounded-lg border border-white/30 px-4 py-2 hover:bg-white/10"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
