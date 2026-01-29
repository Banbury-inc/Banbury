import { Box, Container, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Typography } from '../../../components/ui/typography'
import DemoApp from './DemoApp'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function HeroSection() {
  return (
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
                px: { xs: 2, md: 0 },
                pt: 1.25,
                pb: 1.25
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
  )
}

export default HeroSection
