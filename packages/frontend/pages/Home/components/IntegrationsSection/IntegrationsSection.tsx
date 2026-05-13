import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { Typography } from '../../../../components/common/ui/typography'
import IntegrationsAutoScroll from './components/IntegrationsAutoScroll'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function IntegrationsSection() {
  return (
    <Box sx={{
      pt: { xs: 8, sm: 10, md: 12, lg: 16 },
      pb: { xs: 4, md: 6 },
      background: 'var(--card)',
      position: 'relative',
      zIndex: 10,
      overflow: 'hidden',
    }}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 }, px: { xs: 2, md: 0 }, position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography variant="h2" className="text-3xl tracking-[-0.05em] sm:text-4xl md:text-5xl">
              Your tools, finally in conversation.
            </Typography>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <Typography variant="p" className="mx-auto max-w-2xl pt-4 text-base leading-8 text-muted-foreground md:text-lg">
              Connect the platforms you already use, then let Banbury carry context between them without another copy-paste loop.
            </Typography>
          </motion.div>
        </Box>

        <IntegrationsAutoScroll />
      </Box>
    </Box>
  )
}

export default IntegrationsSection
