import CTASection from './components/CTASection'
import FeaturesSection from './components/FeaturesSection'
import HeroSection from './components/HeroSection/HeroSection'
import IntegrationsSection from './components/IntegrationsSection/IntegrationsSection'
import StatsSection from './components/StatsSection'
import UseCasesSection from './components/UseCasesSection/UseCasesSection'

const Home = (): JSX.Element => {
  return (
    <main className="relative w-full max-w-[100vw] overflow-hidden overflow-y-auto bg-card text-foreground">
      <HeroSection />
      <StatsSection />
      <IntegrationsSection />
      <UseCasesSection />
      <FeaturesSection />
      <CTASection />
    </main>
  )
}

export default Home

