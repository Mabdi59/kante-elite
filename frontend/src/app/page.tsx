import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Testimonials from '@/components/Testimonials'
import PricingCards from '@/components/PricingCards'
import FAQ from '@/components/FAQ'
import LocationMap from '@/components/LocationMap'

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Testimonials />
      <PricingCards />
      <FAQ />
      <LocationMap />
    </>
  )
}
