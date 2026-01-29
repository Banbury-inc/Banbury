import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { Typography } from '../../../../components/ui/typography'
import IntegrationsAutoScroll from './components/IntegrationsAutoScroll'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function IntegrationsSection() {
  return (
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
            <Typography variant="h2">
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
            <Typography variant="p" className='pt-4'>
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
  )
}

export default IntegrationsSection
