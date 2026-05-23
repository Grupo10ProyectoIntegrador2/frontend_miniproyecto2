import Hero from '../components/Hero'
import Features from '../components/Features'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  )
}
