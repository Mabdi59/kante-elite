import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ProgramDetailClient from './ProgramDetailClient'

const TITLE_MAP = {
  private: 'Private Training',
  group: 'Group Sessions',
  speed: 'Speed & Agility',
} as const

type Slug = keyof typeof TITLE_MAP

function isSlug(value: string): value is Slug {
  return value === 'private' || value === 'group' || value === 'speed'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (!isSlug(slug)) {
    return { title: 'Program Details' }
  }
  return {
    title: `${TITLE_MAP[slug]} Program`,
    description: `Learn more about ${TITLE_MAP[slug]} at Kante Elite Training in Columbus, Ohio.`,
  }
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!isSlug(slug)) {
    notFound()
  }

  return <ProgramDetailClient slug={slug} />
}
