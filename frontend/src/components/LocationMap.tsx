'use client'

import { Clock3, Mail, MapPin, Navigation, Phone } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

type LocationBlockMeta = {
  addressName: string
  addressLine: string
  addressSubline: string
  hours: string[]
  amenities: string[]
  phone: string
  email: string
  mapLabel: string
  mapAddress: string
  mapUrl: string
  mapEmbedUrl?: string
  directionsLabel?: string
}

export default function LocationMap() {
  const locationBlock = useSiteContentBlock<LocationBlockMeta>('home.location', {
    key: 'home.location',
    title: 'Find Us in Columbus, OH',
    metadata: {
      addressName: 'Primary Training Facility',
      addressLine: '3500 Olentangy River Rd, Columbus, OH 43214',
      addressSubline: 'Near Easton Town Center',
      hours: ['Monday - Friday: 3 PM - 8 PM', 'Saturday: 8 AM - 6 PM', 'Sunday: 10 AM - 4 PM'],
      amenities: ['Free Parking', 'Indoor Facility During Winter'],
      phone: '(614) 555-0100',
      email: 'info@kanteelite.com',
      mapLabel: 'Columbus, OH 43214',
      mapAddress: '3500 Olentangy River Rd',
      mapUrl: 'https://maps.google.com/?q=3500+Olentangy+River+Rd,Columbus,OH',
      mapEmbedUrl:
        'https://www.google.com/maps?q=3500+Olentangy+River+Rd,+Columbus,+OH&output=embed',
      directionsLabel: 'Get Directions',
    },
  })

  const hours = Array.isArray(locationBlock.metadata.hours)
    ? locationBlock.metadata.hours.filter((item): item is string => typeof item === 'string')
    : []
  const safeHours =
    hours.length > 0
      ? hours
      : ['Monday - Friday: 3 PM - 8 PM', 'Saturday: 8 AM - 6 PM', 'Sunday: 10 AM - 4 PM']

  const amenities = Array.isArray(locationBlock.metadata.amenities)
    ? locationBlock.metadata.amenities.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

  const phone = typeof locationBlock.metadata.phone === 'string' ? locationBlock.metadata.phone : '(614) 555-0100'
  const email =
    typeof locationBlock.metadata.email === 'string' && locationBlock.metadata.email.trim().length > 0
      ? locationBlock.metadata.email
      : 'info@kanteelite.com'
  const mapUrl =
    typeof locationBlock.metadata.mapUrl === 'string' ? locationBlock.metadata.mapUrl : 'https://maps.google.com'
  const mapEmbedUrl =
    typeof locationBlock.metadata.mapEmbedUrl === 'string' && locationBlock.metadata.mapEmbedUrl.trim().length > 0
      ? locationBlock.metadata.mapEmbedUrl
      : 'https://www.google.com/maps?q=3500+Olentangy+River+Rd,+Columbus,+OH&output=embed'
  const directionsLabel =
    typeof locationBlock.metadata.directionsLabel === 'string' && locationBlock.metadata.directionsLabel.trim().length > 0
      ? locationBlock.metadata.directionsLabel
      : 'Get Directions'
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`
  const emailHref = `mailto:${email}`

  return (
    <section className="py-20 bg-green-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">{locationBlock.title ?? 'Find Us in Columbus, OH'}</h2>

            <div className="space-y-5 text-green-100">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">
                    {locationBlock.metadata.addressName ?? 'Primary Training Facility'}
                  </div>
                  <div>{locationBlock.metadata.addressLine ?? '3500 Olentangy River Rd, Columbus, OH 43214'}</div>
                  <div className="text-sm mt-1">{locationBlock.metadata.addressSubline ?? 'Near Easton Town Center'}</div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock3 className="h-6 w-6 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Training Hours</div>
                  {safeHours.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-white">Get in Touch</div>
                  <a href={phoneHref} className="hover:text-yellow-300 transition-colors block">
                    {phone}
                  </a>
                  <a href={emailHref} className="hover:text-yellow-300 transition-colors inline-flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{email}</span>
                  </a>
                </div>
              </div>

              {amenities.length > 0 && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {amenities.map((item) => (
                    <span key={item} className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold">
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
            <iframe
              src={mapEmbedUrl}
              title={locationBlock.metadata.mapLabel ?? 'Kante Elite map'}
              className="w-full h-72 md:h-full min-h-72"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="px-5 py-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-white">{locationBlock.metadata.mapLabel ?? 'Columbus, OH 43214'}</div>
                <div className="text-sm text-green-100">{locationBlock.metadata.mapAddress ?? '3500 Olentangy River Rd'}</div>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="lift-button inline-flex items-center gap-2 bg-yellow-400 text-green-900 font-bold px-4 py-2 rounded-xl hover:bg-yellow-300 text-sm"
              >
                <Navigation className="h-4 w-4" />
                {directionsLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
