import { Box } from '@mui/material';
import HeroSection from './components/HeroSection/HeroSection';
import IntegrationsSection from './components/IntegrationsSection/IntegrationsSection';
import FeaturesSection from './components/FeaturesSection';
import UseCasesSection from './components/UseCasesSection/UseCasesSection';
import CTASection from './components/CTASection';

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

