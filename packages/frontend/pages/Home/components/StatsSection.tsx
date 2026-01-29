import { Box, Container, Grid } from '@mui/material'
import { motion } from 'framer-motion'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const stats = [
  { value: '10M+', label: 'Tasks Automated' },
  { value: '99.99%', label: 'Uptime' },
  { value: 'Unlimited', label: 'Cloud Storage' },
  { value: '24/7', label: 'Support' }
]

function StatsSection() {
  return (
    <Box sx={{ 
      py: { xs: 6, md: 8 },
      background: '#000000',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <Container maxWidth="lg" sx={{ px: { xs: 3, md: 2 } }}>
        <Grid container spacing={4}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, ease: 'easeOut', delay: index * 0.08 }}
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-2 tracking-tight font-inter">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm md:text-base text-zinc-400 font-normal font-inter">
                    {stat.label}
                  </div>
                </motion.div>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default StatsSection
