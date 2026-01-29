import { Box, Container, Grid } from '@mui/material'
import { motion } from 'framer-motion'
import EmailDemoApp from './EmailDemoApp'
import MeetingDemoApp from './MeetingDemoApp'
import SpreadsheetDemoApp from './SpreadsheetDemoApp'
import SpreadsheetDemo from '../../../assets/images/spreadsheet_demo.mp4'
import BrowserDemo from '../../../assets/images/browser-automation-demo.mp4'
import TaskCreationDemo from '../../../assets/images/task-creation-demo.mp4'
import DiffViewDemo from '../../../assets/images/diff-view.mp4'
import { Typography } from '../../../components/ui/typography'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function UseCasesSection() {
  return (
    <Box sx={{ 
      py: { xs: 8, md: 12 }, 
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
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.4s ease',
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={8}>
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
                        backgroundColor: 'rgba(255, 255, 255, 0.95) !important',
                        backdropFilter: 'blur(8px)',
                      },
                    }}
                    className="dark:[&>div]:!bg-zinc-900/95"
                  >
                    <EmailDemoApp />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ pl: { md: 0 } }}>
                <Box>
                  <Typography variant="h3">
                    Smart Email Management
                  </Typography>
                  <Typography variant="p">
                    Automatically categorize, prioritize, and respond to emails based on content and context. Set up intelligent filters that route messages to the right team members and draft personalized responses instantly.
                  </Typography>
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
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.4s ease',
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction={{ xs: 'column', md: 'row-reverse' }}>
              <Grid item xs={12} md={8}>
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
              <Grid item xs={12} md={4} sx={{ pl: { md: 0 } }}>
                <Box>
                  <Typography variant="h3">
                    Automated Meeting Scheduling
                  </Typography>
                  <Typography variant="p">
                    Schedule meetings across time zones, send automatic reminders, generate meeting agendas, and distribute notes to all attendees without lifting a finger.
                  </Typography>
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
              border: '1px solid rgba(59, 130, 246, 0.2)',
              transition: 'all 0.4s ease',
            }}
          >
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundImage: 'url(/metal.jpg)',
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
              <Grid item xs={12} md={4} sx={{ pl: { md: 0 } }}>
                <Box>
                  <Typography variant="h3">
                    Smart Spreadsheet Editor
                  </Typography>
                  <Typography variant="p">
                    Edit, analyze, and collaborate on spreadsheets with AI-powered features. Create formulas, charts, and apply conditional formatting - all within your workflow.
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Use Case 4 - Data Automation (Video Left) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box sx={{ mb: { xs: 8, md: 12 } }}>
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid rgba(249, 115, 22, 0.2)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  >
                    <source src={SpreadsheetDemo} type="video/mp4" />
                  </video>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ pl: { md: 4 } }}>
                  <Typography variant="h3">
                    Data Sync & Reporting
                  </Typography>
                  <Typography variant="p">
                    Keep your data synchronized across all platforms in real-time. Generate comprehensive reports and distribute them to stakeholders automatically on your preferred schedule.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <p>
                        Real-time data synchronization across platforms
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Automated report generation with custom schedules
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Data validation and error detection
                      </p>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Use Case 5 - Task Automation (Image Right) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box sx={{ mb: { xs: 8, md: 12 } }}>
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction={{ xs: 'column', md: 'row-reverse' }}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  >
                    <source src={TaskCreationDemo} type="video/mp4" />
                  </video>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ pr: { md: 4 } }}>
                  <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                    Schedule Tasks When You're Away
                  </Typography>
                  <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                    Schedule tasks when you're away and let Banbury handle the rest.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Create tasks with detailed information including titles, descriptions, scheduled dates and times.
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Set recurring tasks to ensure consistency and efficiency.
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        See the results of your tasks when you come back.
                      </p>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Use Case 6 - AI Assistant (Image Left) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box sx={{ mb: { xs: 8, md: 12 } }}>
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  >
                    <source src={DiffViewDemo} type="video/mp4" />
                  </video>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ pl: { md: 4 } }}>
                  <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                    Intelligent AI Support
                  </Typography>
                  <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                    Chat with your AI assistant to create workflows, get insights, and automate tasks using natural language. Just describe what you want, and let AI do the rest.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Natural language workflow creation
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Smart suggestions and optimizations
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        24/7 intelligent assistance and troubleshooting
                      </p>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </motion.div>

        {/* Use Case 7 - Browser Automation (Video Right) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Box>
            <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center" direction={{ xs: 'column', md: 'row-reverse' }}>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid rgba(14, 165, 233, 0.2)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                  >
                    <source src={BrowserDemo} type="video/mp4" />
                  </video>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ pr: { md: 4 } }}>
                  <Typography variant="h3" className="text-2xl sm:text-3xl md:text-4xl mb-4">
                    Browser Automation
                  </Typography>
                  <Typography variant="p" className="text-base md:text-lg text-zinc-400 leading-relaxed mb-6">
                    Automate repetitive web tasks like data entry, form filling, and web scraping. Let Banbury navigate websites and extract information while you focus on important work.
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Automated form filling and data entry
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Intelligent web scraping and data extraction
                      </p>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                      <Box
                        sx={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(59, 130, 246, 0)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          mt: 0.5,
                        }}
                      >
                        <span style={{ color: '#3B82F6', fontSize: '14px' }}>✓</span>
                      </Box>
                      <p className="text-sm md:text-base text-zinc-300 font-inter">
                        Schedule automated browser tasks
                      </p>
                    </Box>
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
