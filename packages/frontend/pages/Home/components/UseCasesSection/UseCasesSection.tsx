import { Box, Container, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import { Typography } from '../../../../components/common/ui/typography'
import Link from 'next/link'
import EmailDemoApp from './components/EmailDemoApp'
import MeetingDemoApp from './components/MeetingDemoApp'
import SpreadsheetDemoApp from './components/SpreadsheetDemoApp'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function UseCasesSection() {
  return (
    <Box sx={{ 
      py: { xs: 9, md: 14 },
      px: { xs: 0, md: '44px' },
      background: 'var(--background)',
      borderTop: '1px solid var(--border)',
      position: 'relative',
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 3, md: 4 } }}>
        <Box sx={{ maxWidth: '760px', mb: { xs: 7, md: 10 } }}>
          <Typography variant="h2" className="mb-4 text-3xl tracking-[-0.05em] sm:text-4xl md:text-5xl">
            Three workflows, one living workspace.
          </Typography>
          <Typography variant="p" className="text-base leading-8 text-muted-foreground md:text-lg">
            The home page demo shows how Banbury turns everyday operational work into connected, AI-assisted flows.
          </Typography>
        </Box>

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
              p: { xs: 1.5, md: 2 },
              borderRadius: '28px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 90px color-mix(in oklch, var(--background) 70%, transparent)',
              transition: 'all 0.4s ease',
              overflow: 'hidden'
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={12} lg={9}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '22px',
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
                    pl: 2,
                    boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--foreground) 10%, transparent)'
                  }}
                >
                    <EmailDemoApp />
                </Box>
              </Grid>
              <Grid item xs={12} md={12} lg={3} sx={{ pl: { md: 0 } }}>
                <Box>
                  <Typography variant="xs" className="mb-4 inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                    Inbox automation
                  </Typography>
                  <Typography variant="h3" className="mb-4 text-2xl tracking-[-0.04em] md:text-3xl">
                    Smart Email Management
                  </Typography>
                  <Typography variant="p" className="text-sm leading-7 text-muted-foreground md:text-base">
                    Automatically categorize, prioritize, and respond to emails based on content and context. Set up intelligent filters that route messages to the right team members.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Link href="/docs/email-management">
                      <Typography variant="xs" className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1">
                        <span>Learn more about email management</span>
                        <span aria-hidden="true">-&gt;</span>
                      </Typography>
                    </Link>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

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
              p: { xs: 1.5, md: 2 },
              borderRadius: '28px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 90px color-mix(in oklch, var(--background) 70%, transparent)',
              transition: 'all 0.4s ease',
              overflow: 'hidden'
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction="row-reverse">
              <Grid item xs={12} md={12} lg={9}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '22px',
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
                    boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--foreground) 10%, transparent)'
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
                  <Typography variant="xs" className="mb-4 inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                    Calendar intelligence
                  </Typography>
                  <Typography variant="h3" className="mb-4 text-2xl tracking-[-0.04em] md:text-3xl">
                    Automated Meeting Scheduling
                  </Typography>
                  <Typography variant="p" className="text-sm leading-7 text-muted-foreground md:text-base">
                    Schedule meetings across time zones, send automatic reminders, generate meeting agendas, and distribute notes to all attendees without lifting a finger.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Link href="/docs/meeting-scheduling">
                      <Typography variant="xs" className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1">
                        <span>Learn more about meeting scheduling</span>
                        <span aria-hidden="true">-&gt;</span>
                      </Typography>
                    </Link>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box
            sx={{
              mb: { xs: 4, md: 6 },
              p: { xs: 1.5, md: 2 },
              borderRadius: '28px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 90px color-mix(in oklch, var(--background) 70%, transparent)',
              transition: 'all 0.4s ease',
              overflow: 'hidden'
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={12} lg={8}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '22px',
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
                    pl: 2,
                    boxShadow: 'inset 0 0 0 1px color-mix(in oklch, var(--foreground) 10%, transparent)'
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
                  <Typography variant="xs" className="mb-4 inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-muted-foreground">
                    Data workbench
                  </Typography>
                  <Typography variant="h3" className="mb-4 text-2xl tracking-[-0.04em] md:text-3xl">
                    Smart Spreadsheet Editor
                  </Typography>
                  <Typography variant="p" className="text-sm leading-7 text-muted-foreground md:text-base">
                    Edit, analyze, and collaborate on spreadsheets with AI-powered features. Create formulas, charts, and apply conditional formatting within your workflow.
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <Link href="/docs/spreadsheet-editor">
                      <Typography variant="xs" className="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1">
                        <span>Learn more about the spreadsheet editor</span>
                        <span aria-hidden="true">-&gt;</span>
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
