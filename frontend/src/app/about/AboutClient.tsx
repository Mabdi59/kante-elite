'use client'

import { Shield, Target, Trophy } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

type AboutValue = { icon: 'trophy' | 'shield' | 'target'; title: string; desc: string }
type CoachProfile = { name: string; title: string; bio: string; initials: string }
type AboutStat = { value: string; label: string }
type AboutMeta = {
  missionTitle: string
  missionBody: string
  valuesHeading: string
  coachesHeading: string
  statsHeading: string
  values: AboutValue[]
  coaches: CoachProfile[]
  stats: AboutStat[]
}

const DEFAULT_VALUES: AboutValue[] = [
  {
    icon: 'trophy',
    title: 'Excellence',
    desc: 'We hold ourselves and our athletes to the highest standards - on and off the pitch.',
  },
  {
    icon: 'shield',
    title: 'Respect',
    desc: 'We foster an inclusive environment where every player feels valued, heard, and supported.',
  },
  {
    icon: 'target',
    title: 'Dedication',
    desc: 'We believe champions are made through consistent hard work, not shortcuts.',
  },
]

const DEFAULT_COACHES: CoachProfile[] = [
  {
    name: 'Marcus Kante',
    title: 'Head Coach & Founder',
    bio: 'Former Division I collegiate player with 15+ years of youth coaching experience. UEFA B License holder.',
    initials: 'MK',
  },
  {
    name: 'Aisha Thompson',
    title: 'Speed & Agility Specialist',
    bio: 'Certified strength & conditioning specialist (CSCS) with a background in exercise science.',
    initials: 'AT',
  },
  {
    name: 'Carlos Rivera',
    title: 'Technical Coach',
    bio: 'Former professional player specializing in first touch and ball mastery.',
    initials: 'CR',
  },
  {
    name: 'Jennifer Park',
    title: 'Group Training Coach',
    bio: 'NSCAA certified coach focused on tactical awareness and team dynamics.',
    initials: 'JP',
  },
]

const DEFAULT_STATS: AboutStat[] = [
  { value: '500+', label: 'Athletes Trained' },
  { value: '10+', label: 'Years in Columbus' },
  { value: '4', label: 'Elite Coaches' },
  { value: '95%', label: 'Parent Satisfaction' },
]

const ICON_MAP = {
  trophy: Trophy,
  shield: Shield,
  target: Target,
} as const

export default function AboutClient() {
  const aboutBlock = useSiteContentBlock<AboutMeta>('about.page', {
    key: 'about.page',
    title: 'About Kante Elite Training',
    body: 'Founded in Columbus, Ohio, Kante Elite Training is dedicated to developing the next generation of soccer champions through expert coaching, structured programs, and a love for the beautiful game.',
    metadata: {
      missionTitle: 'Our Mission',
      missionBody:
        'To provide every young athlete in Columbus with access to world-class soccer training regardless of skill level.',
      valuesHeading: 'Our Values',
      coachesHeading: 'Meet Our Coaches',
      statsHeading: 'By the Numbers',
      values: DEFAULT_VALUES,
      coaches: DEFAULT_COACHES,
      stats: DEFAULT_STATS,
    },
  })

  const values = Array.isArray(aboutBlock.metadata.values)
    ? aboutBlock.metadata.values.filter(
        (value): value is AboutValue =>
          Boolean(value) &&
          typeof value.icon === 'string' &&
          typeof value.title === 'string' &&
          typeof value.desc === 'string'
      )
    : []
  const coaches = Array.isArray(aboutBlock.metadata.coaches)
    ? aboutBlock.metadata.coaches.filter(
        (coach): coach is CoachProfile =>
          Boolean(coach) &&
          typeof coach.name === 'string' &&
          typeof coach.title === 'string' &&
          typeof coach.bio === 'string' &&
          typeof coach.initials === 'string'
      )
    : []
  const stats = Array.isArray(aboutBlock.metadata.stats)
    ? aboutBlock.metadata.stats.filter(
        (stat): stat is AboutStat =>
          Boolean(stat) &&
          typeof stat.value === 'string' &&
          typeof stat.label === 'string'
      )
    : []

  const safeValues = values.length > 0 ? values : DEFAULT_VALUES
  const safeCoaches = coaches.length > 0 ? coaches : DEFAULT_COACHES
  const safeStats = stats.length > 0 ? stats : DEFAULT_STATS
  const missionTitle =
    typeof aboutBlock.metadata.missionTitle === 'string'
      ? aboutBlock.metadata.missionTitle
      : 'Our Mission'
  const missionBody =
    typeof aboutBlock.metadata.missionBody === 'string'
      ? aboutBlock.metadata.missionBody
      : 'To provide every young athlete in Columbus with access to world-class soccer training regardless of skill level.'
  const valuesHeading =
    typeof aboutBlock.metadata.valuesHeading === 'string'
      ? aboutBlock.metadata.valuesHeading
      : 'Our Values'
  const coachesHeading =
    typeof aboutBlock.metadata.coachesHeading === 'string'
      ? aboutBlock.metadata.coachesHeading
      : 'Meet Our Coaches'
  const statsHeading =
    typeof aboutBlock.metadata.statsHeading === 'string'
      ? aboutBlock.metadata.statsHeading
      : 'By the Numbers'

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
          {aboutBlock.title ?? 'About Kante Elite Training'}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">{aboutBlock.body}</p>
      </div>

      <div className="bg-green-700 text-white rounded-3xl p-10 mb-16">
        <h2 className="text-2xl font-bold mb-4">{missionTitle}</h2>
        <p className="text-green-100 text-lg leading-relaxed">{missionBody}</p>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">{valuesHeading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {safeValues.map((value) => {
            const Icon = ICON_MAP[value.icon] ?? Trophy
            return (
              <div key={value.title} className="text-center bg-gray-50 rounded-2xl p-8">
                <Icon className="h-10 w-10 mb-4 mx-auto text-green-700" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-10">{coachesHeading}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {safeCoaches.map((coach) => (
            <div key={coach.name} className="flex gap-5 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {coach.initials}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">{coach.name}</div>
                <div className="text-green-700 font-medium text-sm mb-2">{coach.title}</div>
                <p className="text-gray-600 text-sm">{coach.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 text-white rounded-3xl p-10">
        <h2 className="text-2xl font-bold text-center mb-8">{statsHeading}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {safeStats.map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-extrabold text-yellow-400">{stat.value}</div>
              <div className="text-gray-400 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
