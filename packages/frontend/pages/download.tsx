import { Box, Container } from '@mui/material'
import { motion } from 'framer-motion'
import { DesktopDownloadButton } from '../components/DesktopDownloadButton'
import { Typography } from '../components/ui/typography'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const Download = (): JSX.Element => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#000000',
      overflow: 'hidden',
      position: 'relative',
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
    }}>
      <Container maxWidth="lg" sx={{ 
        position: 'relative',
        zIndex: 2,
        py: { xs: 8, md: 16 },
        px: { xs: 3, sm: 4, md: 6 },
      }}>
        {/* Hero Section */}
        <Box sx={{ 
          textAlign: 'center',
          mb: { xs: 8, md: 12 },
          maxWidth: '800px',
          mx: 'auto',
        }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography variant="h1" className="mb-6 md:mb-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              Try the Banbury desktop app<br />
              <span className="text-white">for a faster experience</span>
            </Typography>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          >
            <Box sx={{ mb: { xs: 6, md: 8 } }}>
              <DesktopDownloadButton 
                size="lg"
                className="rounded-full px-8 md:px-10 text-base md:text-lg h-12 md:h-14"
              />
            </Box>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            <Typography variant="lead" className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Fast and minimal. Work without distractions.
            </Typography>
          </motion.div>
        </Box>

        {/* Bot-Free Recording Section */}
        <Box sx={{
          maxWidth: '900px',
          mx: 'auto',
          mb: { xs: 8, md: 12 },
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box
              sx={{
                p: { xs: 4, md: 6 },
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                position: 'relative',
                overflow: 'hidden',
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
              <Typography variant="h2" className="mb-4 text-2xl sm:text-3xl md:text-4xl">
                Record meetings without a bot joining the call
              </Typography>
              
              <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                One of the key advantages of the desktop app is its ability to record meetings without requiring a bot participant to join your video calls.
              </Typography>

              <Box sx={{ pl: { xs: 2, md: 3 } }}>
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="h4" className="mb-1 text-lg md:text-xl">
                        No bot in participant lists
                      </Typography>
                      <Typography variant="p" className="text-sm md:text-base text-zinc-400 leading-relaxed">
                        Records directly from your desktop using Recall AI's Desktop Recording SDK. No bot appears in participant lists, maintaining a professional meeting environment.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="h4" className="mb-1 text-lg md:text-xl">
                        Automatic meeting detection
                      </Typography>
                      <Typography variant="p" className="text-sm md:text-base text-zinc-400 leading-relaxed">
                        Automatically detects meeting windows from Zoom, Microsoft Teams, Google Meet, and other platforms. Just start your meeting and let Banbury handle the rest.
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                    <Box>
                      <Typography variant="h4" className="mb-1 text-lg md:text-xl">
                        Superior recording quality
                      </Typography>
                      <Typography variant="p" className="text-sm md:text-base text-zinc-400 leading-relaxed">
                        Native desktop recording captures higher quality audio and video compared to bot-based solutions, ensuring your meetings are recorded with crystal-clear quality.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Additional Benefits Section */}
        <Box sx={{
          maxWidth: '900px',
          mx: 'auto',
          mb: { xs: 8, md: 12 },
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          >
            <Typography variant="h2" className="mb-6 text-2xl sm:text-3xl md:text-4xl text-center">
              A faster, more focused experience awaits
            </Typography>
          </motion.div>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: { xs: 4, md: 6 },
            mb: { xs: 8, md: 12 },
          }}>
            {[
              {
                title: 'Native Performance',
                description: 'Faster load times and smoother interactions compared to the web version. Built with Electron for optimal desktop experience.',
              },
              {
                title: 'Offline Capabilities',
                description: 'Continue working even when internet connectivity is limited. Access your work and data without constant internet connection.',
              },
              {
                title: 'System Integration',
                description: 'Better integration with your operating system, native notifications, and keyboard shortcuts for faster workflows.',
              },
              {
                title: 'Resource Efficiency',
                description: 'Optimized resource usage for extended usage sessions. Lightweight and efficient without compromising on features.',
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 * index }}
              >
                <Box
                  sx={{
                    p: { xs: 4, md: 5 },
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Typography variant="h3" className="mb-3 text-lg md:text-xl">
                    {benefit.title}
                  </Typography>
                  <Typography variant="p" className="text-sm md:text-base text-zinc-400 leading-relaxed">
                    {benefit.description}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>
        </Box>

        {/* Final CTA */}
        <Box sx={{ textAlign: 'center', maxWidth: '600px', mx: 'auto' }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Typography variant="lead" className="text-base sm:text-lg md:text-xl text-zinc-400 mb-6 leading-relaxed">
              Download the latest version and experience the difference
            </Typography>
            <DesktopDownloadButton 
              size="lg"
              className="rounded-full px-8 md:px-10 text-base md:text-lg h-12 md:h-14"
            />
          </motion.div>
        </Box>
      </Container>
    </Box>
  )
}

export default Download
