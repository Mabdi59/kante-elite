'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js/pure'
import { CheckCircle2, CreditCard, Info } from 'lucide-react'

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
const DEV_MOCK_SECRET_PREFIX = 'dev_mock_client_secret_'
let cachedStripePromise: ReturnType<typeof loadStripe> | null = null
let hasConfiguredStripeLoadParams = false

function configureStripeLoadParams() {
  if (hasConfiguredStripeLoadParams) {
    return
  }
  if (process.env.NODE_ENV !== 'production') {
    loadStripe.setLoadParameters({ advancedFraudSignals: false })
  }
  hasConfiguredStripeLoadParams = true
}

function getStripePromise() {
  if (!PUBLISHABLE_KEY) {
    return null
  }
  if (!cachedStripePromise) {
    configureStripeLoadParams()
    cachedStripePromise = loadStripe(PUBLISHABLE_KEY)
  }
  return cachedStripePromise
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

interface StripePaymentPanelProps {
  clientSecret: string
  amountInCents: number
  onSuccess: () => void
}

function StripePaymentForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!stripe || !elements) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })

    if (result.error) {
      setErrorMessage(result.error.message ?? 'Payment failed. Please try again.')
      setIsSubmitting(false)
      return
    }

    const status = result.paymentIntent?.status
    if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
      onSuccess()
      return
    }

    setErrorMessage('Payment was not completed. Please try again.')
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 rounded-xl p-4">
        <PaymentElement />
      </div>
      {errorMessage && <p className="text-red-600 text-sm">{errorMessage}</p>}
      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
      >
        {isSubmitting ? 'Processing Payment...' : 'Pay Now'}
      </button>
    </form>
  )
}

export default function StripePaymentPanel({
  clientSecret,
  amountInCents,
  onSuccess,
}: StripePaymentPanelProps) {
  const isMockSecret = clientSecret.startsWith(DEV_MOCK_SECRET_PREFIX)
  const stripePromise = useMemo(() => {
    if (isMockSecret) {
      return null
    }
    return getStripePromise()
  }, [isMockSecret])

  if (isMockSecret) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-700 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Dev Payment Mode</h4>
            <p className="text-sm text-blue-800">
              Stripe is not configured on the backend. Your registration was created with a mock
              payment intent.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSuccess}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Continue
        </button>
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-red-700 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Stripe Not Configured</h4>
            <p className="text-sm text-red-800">
              Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to complete card payments in the frontend.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-700" />
            Complete Payment
          </h4>
          <p className="text-sm text-gray-600">Your spot is reserved after successful payment.</p>
        </div>
        <span className="inline-flex items-center gap-2 bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full">
          <CheckCircle2 className="h-4 w-4" />
          {formatPrice(amountInCents)}
        </span>
      </div>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripePaymentForm onSuccess={onSuccess} />
      </Elements>
    </div>
  )
}
