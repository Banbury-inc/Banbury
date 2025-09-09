import { Box, Typography } from '@mui/material';
const browserAutomationDemo = require('../../../assets/images/browser-automation-demo.mp4');

export default function BrowseFeatureTab() {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: { xs: '1.75rem', md: '2rem' },
          fontWeight: 600,
          mb: 3,
          color: '#ffffff',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Browse
      </Typography>
      
      {/* Visibility */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            mb: 2,
            color: '#ffffff',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          • <strong>Visibility:</strong>
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: '#a1a1aa',
            mb: 2,
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            pl: 2,
          }}
        >
          • Banbury can browse the web to gather and read information.
        </Typography>
      </Box>

      {/* Actions */}
      <Box>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            mb: 2,
            color: '#ffffff',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          • <strong>Actions - Banbury can:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Create a new browser session.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Read the output of a website.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Fill out forms on a website.
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        p: 3,
        mt: 4,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{ 
          position: 'relative', 
          width: '100%', 
          borderRadius: '12px', 
          overflow: 'hidden',
          flex: 1,
          minHeight: '300px'
        }}>
          <video 
            src={browserAutomationDemo} 
            controls 
            muted 
            playsInline 
            style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: '12px',
              objectFit: 'cover'
            }} 
          />
        </Box>
      </Box>
    </Box>
  );
}
