import { Box, Container, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import EmailDemoApp from './components/EmailDemoApp'
import MeetingDemoApp from './components/MeetingDemoApp'
import SpreadsheetDemoApp from './components/SpreadsheetDemoApp'
import { Typography } from '../../../../components/common/ui/typography'
import Link from 'next/link'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function UseCasesSection() {
  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 },
      px: '55px',
      background: '#000000',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 3, md: 4 } }}>

        {/* Use Case 1 - Email Management (Image Left) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box
            sx={{
              mb: { xs: 8, md: 12 },
              p: 2,
              borderRadius: '6px',
              background: '#323232',
              transition: 'all 0.4s ease',
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={12} lg={9}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundImage: 'url(/white.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '665px',
                    maxWidth: '1200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pl: 2
                  }}
                >
                    <EmailDemoApp />
                </Box>
              </Grid>
              <Grid item xs={12} md={12} lg={3} sx={{ pl: { md: 0 } }}>
                <Box>
                  <Typography variant="h3" className="text-base sm:text-lg md:text-xl lg:text-2xl">
                    Smart Email Management
                  </Typography>
                  <Typography variant="p" className="text-xs sm:text-sm md:text-base">
                    Automatically categorize, prioritize, and respond to emails based on content and context. Set up intelligent filters that route messages to the right team members and draft personalized responses instantly.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Link href="/docs/email-management">
                      <Typography variant="xs" className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1">
                        Learn more about email management
                        <span aria-hidden="true">→</span>
                      </Typography>
                    </Link>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Use Case 2 - Meeting Automation (Video Right) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box
            sx={{
              mb: { xs: 8, md: 12 },
              p: 2,
              borderRadius: '6px',
              background: '#323232',
              transition: 'all 0.4s ease',
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction="row-reverse">
              <Grid item xs={12} md={12} lg={9}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundImage: 'url(/pink.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '665px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      '& > div': {
                        backdropFilter: 'blur(8px)',
                      },
                    }}
                    className="dark:[&>div]:!bg-zinc-900/95"
                  >
                    <MeetingDemoApp />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={12} lg={3} sx={{ pl: { md: 0 } }}>
                <Box>
                  <Typography variant="h3" className="text-base sm:text-lg md:text-xl lg:text-2xl">
                    Automated Meeting Scheduling
                  </Typography>
                  <Typography variant="p" className="text-xs sm:text-sm md:text-base">
                    Schedule meetings across time zones, send automatic reminders, generate meeting agendas, and distribute notes to all attendees without lifting a finger.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                      <Link href="/docs/meeting-scheduling">
                      <Typography variant="xs" className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1">
                        Learn more about meeting scheduling
                        <span aria-hidden="true">→</span>
                      </Typography>
                    </Link>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Use Case 3 - Spreadsheet Editor (Interactive Left) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box
            sx={{
              mb: { xs: 8, md: 12 },
              p: 2,
              borderRadius: '6px',
              background: '#323232',
              transition: 'all 0.4s ease',
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={12} lg={8}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundImage: 'url(/sand.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    minHeight: '665px',
                    maxWidth: '1200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pl: 2
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      '& > div': {
                        backgroundColor: 'rgba(255, 255, 255, 0.95) !important',
                        backdropFilter: 'blur(8px)',
                      },
                    }}
                    className="dark:[&>div]:!bg-zinc-900/95"
                  >
                    <SpreadsheetDemoApp />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={12} lg={4} sx={{ pl: { md: 0 } }}>
                <Box>
                  <Typography variant="h3" className="text-base sm:text-lg md:text-xl lg:text-2xl">
                    Smart Spreadsheet Editor
                  </Typography>
                  <Typography variant="p" className="text-xs sm:text-sm md:text-base">
                    Edit, analyze, and collaborate on spreadsheets with AI-powered features. Create formulas, charts, and apply conditional formatting - all within your workflow.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Link href="/docs/spreadsheet-editor">
                      <Typography variant="xs" className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1">
                        Learn more about the spreadsheet editor
                        <span aria-hidden="true">→</span>
                      </Typography>
                    </Link>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      </Container>
    </Box>
  )
}

export default UseCasesSection
