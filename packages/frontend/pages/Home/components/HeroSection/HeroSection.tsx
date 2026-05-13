import { Box, Container, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { Button } from '../../../../components/common/ui/button'
import { Typography } from '../../../../components/common/ui/typography'
import DemoApp from './components/DemoApp'
import { handleDownloadClick, handleRegisterClick } from './handlers/navigation-handlers'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-card">
      <Container
        maxWidth={false}
        sx={{
          overflow: 'visible',
          px: { xs: 3, sm: 4, lg: 0 },
          pt: { xs: 8, sm: 10, lg: 14 },
          width: { xs: '100%', lg: '86%' },
          mx: 'auto'
        }}
      >
        <Grid 
          container 
          spacing={{ xs: 0, sm: 2, lg: 4, xl: 6 }} 
          alignItems="center"
          justifyContent="flex-start"
          sx={{ 
            position: 'relative',
            minHeight: { xs: '20vh', lg: '72vh' },
            overflow: 'visible',
            width: '100%'
          }}
        >
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
              mb: { xs: 1, sm: 3, lg: 4, xl: 4 },
              pt: { xs: 2, sm: 2, lg: 3, xl: 4 },
              textAlign: 'center',
              maxWidth: { xs: '100%', sm: '100%', lg: '900px', xl: '1020px' },
              ml: { xs: 0, sm: 0, lg: 0, xl: 0 }
            }}>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground shadow-2xl shadow-primary/5 backdrop-blur">
                  One workspace for every moving part
                </div>
              </motion.div>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.06 }}
              >
                <Typography variant="h1" className="mx-auto mb-5 max-w-5xl text-balance text-5xl leading-[0.95] tracking-[-0.08em] sm:text-6xl md:text-7xl lg:text-8xl">
                  The command center for your work, files, and AI.
                </Typography>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.12 }}
              >
                <Typography variant="p" className="mx-auto mb-7 max-w-3xl px-2 text-balance text-base leading-8 text-muted-foreground sm:text-lg md:text-xl">
                  Banbury brings your documents, inbox, calendar, and automation into one calm interface so your team can move from scattered context to finished work.
                </Typography>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.18 }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: { xs: 1.5, sm: 2 }, 
                  mb: { xs: 2, md: 3 },
                  justifyContent: 'center',
                  px: { xs: 2, md: 0 },
                  pt: 1.25,
                  pb: 1.25
                }}>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleRegisterClick}
                    className="h-12 rounded-full px-7 text-sm shadow-2xl shadow-primary/20"
                  >
                    Start building for free
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleDownloadClick}
                    className="h-12 rounded-full border-border bg-card/70 px-7 text-sm text-foreground backdrop-blur hover:bg-accent"
                  >
                    Download desktop app
                  </Button>
                </Box>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.24 }}
              >
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground sm:gap-3">
                  <span className="rounded-full border border-border bg-card/50 px-3 py-1.5 backdrop-blur">
                    Files
                  </span>
                  <span className="rounded-full border border-border bg-card/50 px-3 py-1.5 backdrop-blur">
                    Email
                  </span>
                  <span className="rounded-full border border-border bg-card/50 px-3 py-1.5 backdrop-blur">
                    Calendar
                  </span>
                  <span className="rounded-full border border-border bg-card/50 px-3 py-1.5 backdrop-blur">
                    AI assistant
                  </span>
                </div>
              </motion.div>
            </Box>
          </Grid>

          <Grid item xs={12} sm={12} lg={12} xl={12} sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: { xs: 0, lg: 0, xl: 0 },
            overflow: 'visible',
            order: { xs: 2, sm: 2, lg: 2, xl: 2 },
          }}>
            <DemoApp />
          </Grid>
        </Grid>
      </Container>
    </section>
  )
}

export default HeroSection
