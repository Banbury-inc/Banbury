import { Box } from '@mui/material';
import HeroSection from './components/HeroSection';
import IntegrationsSection from './components/IntegrationsSection/IntegrationsSection';
import StatsSection from './components/StatsSection';
import FeaturesSection from './components/FeaturesSection';
import UseCasesSection from './components/UseCasesSection';
import CTASection from './components/CTASection';
// Tracking handled globally in pages/_app.tsx via routeTracking handler

const Home = (): JSX.Element => {
  return (
    <Box sx={{ overflow: 'hidden', overflowY: 'auto', background: '#000000', width: '100%', maxWidth: '100vw' }}>
      <HeroSection />

      <IntegrationsSection />
      <UseCasesSection />
      <FeaturesSection />
      <CTASection />
    </Box>
  );
};

export default Home;

