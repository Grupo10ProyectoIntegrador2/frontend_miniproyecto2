import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import FAQ from '../components/FAQ'
import CTASection from '../components/CTASection'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col font-sans selection:bg-fuchsia-200 selection:text-fuchsia-900">
      <Header />
      <main id="main-content" className="flex-1 bg-white">
        <Hero />
        <Features />
        <HowItWorks />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}
