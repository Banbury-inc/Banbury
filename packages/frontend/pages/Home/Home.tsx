import CloudIcon from '@mui/icons-material/Cloud';
import DevicesIcon from '@mui/icons-material/Devices';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { Box, Container, Grid } from '@mui/material';
import Image from 'next/image';
import { motion } from 'framer-motion';
import DemoApp from './components/DemoApp';
import { Button } from '../../components/ui/button';
import { Typography } from '../../components/ui/typography';
import IntegrationsAutoScroll from './components/IntegrationsAutoScroll';
import StatsSection from './components/StatsSection';
import UseCasesSection from './components/UseCasesSection';
import CTASection from './components/CTASection';
// Tracking handled globally in pages/_app.tsx via routeTracking handler

const Home = (): JSX.Element => {
  const features = [
    {
      icon: <CloudIcon sx={{ fontSize: { xs: 40, md: 48 }, color: '#71717a' }} />,
      title: 'AI-Powered Automation',
      description: 'Intelligent workflows that adapt and optimize themselves, reducing manual work by up to 80%.',
      highlight: 'Save 20+ hours/week'
    },
    {
      icon: <DevicesIcon sx={{ fontSize: { xs: 40, md: 48 }, color: '#71717a' }} />,
      title: 'Lightning Fast Processing',
      description: 'Process thousands of operations per second with our optimized cloud infrastructure.',
      highlight: '< 100ms response time'
    },
    {
      icon: <FlashOnIcon sx={{ fontSize: { xs: 40, md: 48 }, color: '#71717a' }} />,
      title: 'Customer-Driven Development',
      description: 'We listen to your feedback and rapidly build the features you need. Your requests shape our roadmap.',
      highlight: 'Feature requests delivered fast'
    }
  ];

  const fadeInUp = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Box sx={{ overflow: 'hidden', overflowY: 'auto', background: '#000000', width: '100%', maxWidth: '100vw' }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: { xs: '70vh', lg: '85vh' },
          display: 'flex',
          alignItems: 'flex-start',
          position: 'relative',
          overflow: 'visible',
          pt: { xs: 4, sm: 6, lg: 8 },
          pb: { xs: 0, lg: 0 },
          background: '#000000',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px)
            `,
            backgroundSize: { xs: '20px 20px', md: '40px 40px' },
            opacity: 0.25,
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-10%',
            right: '-20%',
            width: '70vw',
            height: '70vw',
            background: 'radial-gradient(closest-side, rgba(255,255,255,0.08), rgba(255,255,255,0.03) 35%, rgba(0,0,0,0) 70%)',
            filter: 'blur(40px)',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth={false} sx={{
          overflow: 'visible',
          px: { xs: 3, sm: 4, lg: 0 },
          width: { xs: '100%', lg: '86%' },
          mx: 'auto'
        }}>
          <Grid 
            container 
            spacing={{ xs: 0, sm: 2, lg: 4, xl: 6 }} 
            alignItems="center"
            justifyContent="flex-start"
            sx={{ 
              position: 'relative',
              minHeight: { xs: '20vh', lg: '70vh' },
              overflow: 'visible',
              width: '100%'
            }}
          >
            {/* Text Content */}
            <Grid item xs={12} sm={12} lg={12} xl={12} sx={{ 
              position: 'relative', 
              zIndex: 2, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              pl: { xs: 0, lg: 2, xl: 2 },
              pr: { xs: 0, lg: 3, xl: 3 },
              order: { xs: 1, sm: 1, lg: 1, xl: 1 }
            }}>
              <Box sx={{
                pr: { lg: 6, xl: 6 },
                mb: { xs: 0, sm: 3, lg: 2, xl: 2 },
                pt: { xs: 2, sm: 2, lg: 3, xl: 4 },
                textAlign: 'center',
                maxWidth: { xs: '100%', sm: '100%', lg: '760px', xl: '860px' },
                ml: { xs: 0, sm: 0, lg: 0, xl: 0 }
              }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeInUp}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                  <Typography variant="h1" className="mb-4 md:mb-8">
                    Your AI-Powered <br />
                    <span className="text-white">
                      Workflow Engine
                    </span>
                  </Typography>
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeInUp}
                  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                >
                  <Typography variant="p" className="leading-relaxed mb-3 md:mb-7 max-w-2xl text-base sm:text-lg md:text-xl px-2 md:px-0">
                    Transform your business operations with intelligent automation that learns, adapts, and scales with your needs.
                  </Typography>
                </motion.div>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: { xs: 1.5, sm: 3 }, 
                  mb: { xs: 0, md: 0 },
                  justifyContent: 'center',
                  px: { xs: 2, md: 0 }
                }}>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => window.location.href = '/register'}
                  >
                    Get Started for Free
                  </Button>
                </Box>
              </Box>
            </Grid>


            {/* Image - Beneath Hero Text */}
            <Grid item xs={12} sm={12} lg={12} xl={12} sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: { xs: 0, lg: 0, xl: 0 },
              overflow: 'visible',
              order: { xs: 2, sm: 2, lg: 2, xl: 2 },
            }}>
              {/* Gradient backdrop for depth */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: { xs: '100%', md: '95%', lg: '90%' },
                  height: { xs: '80%', lg: '90%' },
                  background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 40%, transparent 100%)',
                  borderRadius: '50%',
                  filter: 'blur(80px)',
                  zIndex: 0,
                }}
              />
              
              <DemoApp />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Integrations Section */}
      <Box sx={{ pt: { xs: 8, sm: 10, md: 12, lg: 16 }, pb: { xs: 1, md: 1 }, background: '#000000', position: 'relative', zIndex: 10 }}>
        <Box sx={{ width: '100%' }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, px: { xs: 2, md: 0 } }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Typography variant="h2" className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6">
                Powerful Integrations
              </Typography>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <Typography variant="p" className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
                Connect with your favorite tools and services. Seamlessly integrate with the platforms you already use to supercharge your workflow.
              </Typography>
            </motion.div>
          </Box>

          <IntegrationsAutoScroll />

          {/* Coming Soon Section */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
          >
          </motion.div>
        </Box>
      </Box>

      <StatsSection />

      {/* Features Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: '#000000' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 3, md: 2 } }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Typography variant="h2" className="text-3xl sm:text-4xl md:text-5xl mb-4 md:mb-6">
                Why Choose Banbury?
              </Typography>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInUp}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            >
              <Typography variant="p" className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
                Experience the power of AI-driven automation with features designed for modern businesses
              </Typography>
            </motion.div>
          </Box>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Box
                  sx={{
                    p: { xs: 4, md: 6 },
                    height: '100%',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      '& .feature-highlight': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      },
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    },
                  }}
                >
                  {/* Icon */}
                  <Box sx={{ mb: 3 }}>
                    {feature.icon}
                  </Box>

                  {/* Title */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.05 }}
                  >
                    <Typography variant="h3" className="mb-4 text-lg md:text-xl">
                      {feature.title}
                    </Typography>
                  </motion.div>

                  {/* Description */}
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeInUp}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.12 }}
                  >
                    <Typography variant="p" className="text-zinc-400 leading-relaxed mb-6 text-sm md:text-base">
                      {feature.description}
                    </Typography>
                  </motion.div>

                  {/* Highlight Badge */}
                  <Box
                    className="feature-highlight"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      px: { xs: 2, md: 3 },
                      py: 1,
                      borderRadius: '50px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      opacity: 0.7,
                      transform: 'translateY(10px)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <span className="text-blue-500 text-xs md:text-sm font-semibold">
                      {feature.highlight}
                    </span>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <UseCasesSection />

      <CTASection />
    </Box>
  );
};

export default Home;

