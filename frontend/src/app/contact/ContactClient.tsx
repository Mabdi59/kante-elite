'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, Clock3, Mail, MapPin, Phone } from 'lucide-react'
import { useSiteContentBlock } from '@/lib/siteContent'

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subject required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})
type FormData = z.infer<typeof schema>

type ContactBlockMeta = {
  addressLine1: string
  addressLine2: string
  phone: string
  email: string
  hours: string[]
  getInTouchHeading: string
  addressLabel: string
  phoneLabel: string
  emailLabel: string
  hoursLabel: string
  messageSentTitle: string
  messageSentBody: string
  sendAnotherLabel: string
  sendLabel: string
  sendingLabel: string
}

export default function ContactClient() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })
  const contactBlock = useSiteContentBlock<ContactBlockMeta>('contact.page', {
    key: 'contact.page',
    title: 'Contact Us',
    body: "Have questions? We'd love to hear from you. Send us a message and we'll get back to you within 24 hours.",
    metadata: {
      addressLine1: '3500 Olentangy River Rd',
      addressLine2: 'Columbus, OH 43214',
      phone: '(614) 555-0100',
      email: 'info@kanteelite.com',
      hours: ['Mon-Fri: 3 PM - 8 PM', 'Sat: 8 AM - 6 PM', 'Sun: 10 AM - 4 PM'],
      getInTouchHeading: 'Get in Touch',
      addressLabel: 'Address',
      phoneLabel: 'Phone',
      emailLabel: 'Email',
      hoursLabel: 'Hours',
      messageSentTitle: 'Message Sent!',
      messageSentBody: "Thanks for reaching out. We'll be in touch within 24 hours.",
      sendAnotherLabel: 'Send Another Message',
      sendLabel: 'Send Message',
      sendingLabel: 'Sending...',
    },
  })

  const hours = Array.isArray(contactBlock.metadata.hours)
    ? contactBlock.metadata.hours.filter((item): item is string => typeof item === 'string')
    : []
  const safeHours =
    hours.length > 0
      ? hours
      : ['Mon-Fri: 3 PM - 8 PM', 'Sat: 8 AM - 6 PM', 'Sun: 10 AM - 4 PM']
  const phone =
    typeof contactBlock.metadata.phone === 'string'
      ? contactBlock.metadata.phone
      : '(614) 555-0100'
  const email =
    typeof contactBlock.metadata.email === 'string'
      ? contactBlock.metadata.email
      : 'info@kanteelite.com'
  const getInTouchHeading =
    typeof contactBlock.metadata.getInTouchHeading === 'string'
      ? contactBlock.metadata.getInTouchHeading
      : 'Get in Touch'
  const addressLabel =
    typeof contactBlock.metadata.addressLabel === 'string' ? contactBlock.metadata.addressLabel : 'Address'
  const phoneLabel =
    typeof contactBlock.metadata.phoneLabel === 'string' ? contactBlock.metadata.phoneLabel : 'Phone'
  const emailLabel =
    typeof contactBlock.metadata.emailLabel === 'string' ? contactBlock.metadata.emailLabel : 'Email'
  const hoursLabel =
    typeof contactBlock.metadata.hoursLabel === 'string' ? contactBlock.metadata.hoursLabel : 'Hours'
  const messageSentTitle =
    typeof contactBlock.metadata.messageSentTitle === 'string'
      ? contactBlock.metadata.messageSentTitle
      : 'Message Sent!'
  const messageSentBody =
    typeof contactBlock.metadata.messageSentBody === 'string'
      ? contactBlock.metadata.messageSentBody
      : "Thanks for reaching out. We'll be in touch within 24 hours."
  const sendAnotherLabel =
    typeof contactBlock.metadata.sendAnotherLabel === 'string'
      ? contactBlock.metadata.sendAnotherLabel
      : 'Send Another Message'
  const sendLabel =
    typeof contactBlock.metadata.sendLabel === 'string' ? contactBlock.metadata.sendLabel : 'Send Message'
  const sendingLabel =
    typeof contactBlock.metadata.sendingLabel === 'string'
      ? contactBlock.metadata.sendingLabel
      : 'Sending...'
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, '')}`
  const emailHref = `mailto:${email}`

  const onSubmit = async (_data: FormData) => {
    // Simulate submission - in production, call an API endpoint
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
    reset()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          {contactBlock.title ?? 'Contact Us'}
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          {contactBlock.body}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{getInTouchHeading}</h2>
            <div className="space-y-4 text-gray-700">
              <div className="flex items-start gap-3">
                <MapPin className="h-6 w-6 mt-0.5" />
                <div>
                  <div className="font-semibold">{addressLabel}</div>
                  <div>{contactBlock.metadata.addressLine1 ?? '3500 Olentangy River Rd'}</div>
                  <div>{contactBlock.metadata.addressLine2 ?? 'Columbus, OH 43214'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-6 w-6 mt-0.5" />
                <div>
                  <div className="font-semibold">{phoneLabel}</div>
                  <a href={phoneHref} className="text-green-700 hover:underline">
                    {phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-6 w-6 mt-0.5" />
                <div>
                  <div className="font-semibold">{emailLabel}</div>
                  <a href={emailHref} className="text-green-700 hover:underline">
                    {email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="h-6 w-6 mt-0.5" />
                <div>
                  <div className="font-semibold">{hoursLabel}</div>
                  {safeHours.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          {sent ? (
            <div className="text-center py-10">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">{messageSentTitle}</h3>
              <p className="text-gray-600 mb-6">{messageSentBody}</p>
              <button
                onClick={() => setSent(false)}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors"
              >
                {sendAnotherLabel}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    {...register('name')}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    {...register('phone')}
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(optional)"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  {...register('subject')}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g. Booking question"
                />
                {errors.subject && (
                  <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  {...register('message')}
                  rows={5}
                  className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Tell us how we can help..."
                />
                {errors.message && (
                  <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {isSubmitting ? sendingLabel : sendLabel}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
