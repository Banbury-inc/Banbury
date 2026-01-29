import { Box, Container } from '@mui/material'
import { motion } from 'framer-motion'
import { Button } from '../../../components/ui/button'
import { Typography } from '../../../components/ui/typography'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function CTASection() {
  return (
    <Box
      sx={{
        py: { xs: 8, md: 16 },
        background: '#000000',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Container maxWidth="md" sx={{ px: { xs: 3, md: 2 } }}>
        <Box sx={{ textAlign: 'center' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography variant="h2" className="text-3xl sm:text-4xl md:text-5xl mb-6 md:mb-8">
              Ready to Transform Your Workflow?
            </Typography>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <Typography variant="p" className="text-base sm:text-lg md:text-xl text-zinc-400 mb-10 md:mb-12 leading-relaxed max-w-2xl mx-auto px-4 md:px-0">
              Join Banbury to automate your processes and boost productivity by 300%.
            </Typography>
          </motion.div>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: { xs: 2, sm: 3 }, 
            justifyContent: 'center', 
            mb: 6,
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
      </Container>
    </Box>
  )
}

export default CTASection
