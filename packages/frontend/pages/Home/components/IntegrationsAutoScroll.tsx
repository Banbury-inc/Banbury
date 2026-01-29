import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import {
  GmailIcon,
  GoogleDocsIcon,
  GoogleSheetsIcon,
  OutlookIcon,
  TwitterIcon,
  SlackIcon,
  GitHubIcon,
  ZoomIcon,
  GoogleMeetIcon
} from '../../../components/icons'

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

function IntegrationsAutoScroll() {
  return (
    <Box sx={{ 
      position: 'relative', 
      mb: 8,
      overflow: 'visible',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '50px',
        height: '100%',
        background: 'linear-gradient(90deg, #000000 0%, transparent 100%)',
        zIndex: 10,
        pointerEvents: 'none'
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        right: 0,
        width: '50px',
        height: '100%',
        background: 'linear-gradient(270deg, #000000 0%, transparent 100%)',
        zIndex: 10,
        pointerEvents: 'none'
      }
    }}>
      <Box 
        sx={{ 
          display: 'flex',
          animation: 'scroll 30s linear infinite',
          '@keyframes scroll': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' }
          },
          '&:hover': {
            animationPlayState: 'paused'
          }
        }}
      >
        {/* Gmail */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <GmailIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Google Docs */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <GoogleDocsIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Google Sheets */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <GoogleSheetsIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Outlook */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.3 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <OutlookIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* X (Twitter) */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.35 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <TwitterIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Slack */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.4 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <SlackIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* GitHub */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.5 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <GitHubIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Zoom */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.55 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <ZoomIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Google Meet */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.6 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(66, 133, 244, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(66, 133, 244, 0.5), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <GoogleMeetIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Duplicate content for seamless scrolling */}
        {/* Gmail */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <GmailIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Google Docs */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.15 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <GoogleDocsIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>

        {/* Google Sheets */}
        <Box sx={{ 
          minWidth: { xs: '280px', md: '320px', lg: '350px' },
          flexShrink: 0,
          px: 2
        }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeInUp}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          >
            <Box
              sx={{
                p: 4,
                height: '200px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '6px',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                },
              }}
            >
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                <GoogleSheetsIcon size={48} />
              </Box>
            </Box>
          </motion.div>
        </Box>
      </Box>
    </Box>
  )
}

export default IntegrationsAutoScroll
