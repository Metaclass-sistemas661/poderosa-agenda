import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Hero, Problem, HowItWorks, TargetAudience, Integrations, WhyChoose, Pricing, FAQ, FinalCTA } from '@/sections'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <TargetAudience />
        <Integrations />
        <WhyChoose />
        <Pricing />
        <FinalCTA />
        
        {/* Unified Closing Surface — Footer (Overlapped by CTA) */}
        <div className="relative -mt-24 md:-mt-32 z-10">
          <Footer className="!pt-40 md:!pt-48" />
        </div>
      </main>
    </>
  )
}