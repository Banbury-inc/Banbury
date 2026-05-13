import { Box, Container } from '@mui/material'
import { motion } from 'framer-motion'
import { Button } from '../../../components/common/ui/button'
import { Typography } from '../../../components/common/ui/typography'
import { handleRegisterClick } from './HeroSection/handlers/navigation-handlers'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function CTASection() {
  return (
    <Box
      sx={{
        py: { xs: 10, md: 18 },
        px: { xs: 2, md: 0 },
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 3, md: 2 }, position: 'relative', zIndex: 1 }}>
        <Box className="rounded-[2rem] border border-border bg-card px-6 py-12 text-center shadow-lg shadow-background/20 md:px-12 md:py-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography variant="xs" className="mb-5 inline-flex rounded-full border border-border bg-background/70 px-4 py-2 uppercase tracking-[0.22em] text-muted-foreground">
              Your next workspace is waiting
            </Typography>
            <Typography variant="h2" className="mb-6 text-3xl tracking-[-0.05em] sm:text-4xl md:text-5xl">
              Give every project one place to think, act, and finish.
            </Typography>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <Typography variant="p" className="mx-auto mb-10 max-w-2xl px-4 text-base leading-8 text-muted-foreground sm:text-lg md:px-0">
              Start with your current files and apps. Banbury adds the connective tissue that helps the whole system move faster.
            </Typography>
          </motion.div>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: { xs: 2, sm: 3 }, 
            justifyContent: 'center', 
            px: { xs: 2, md: 0 }
          }}>
            <Button
              variant="default"
              size="lg"
              onClick={handleRegisterClick}
              className="h-12 rounded-full px-8 shadow-2xl shadow-primary/20"
            >
              Get started for free
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default CTASection
