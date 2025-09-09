import { Box, Typography } from '@mui/material';
import Image from 'next/image';
const canvasDemo = require('../../../assets/images/canvas.png');

export default function CanvasFeatureTab() {
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
        Canvas
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
          • Banbury can view and understand the contents of a canvas, including all elements, shapes, text, and layouts.
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
            • Create a new canvas.
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
            • Add and modify elements on the canvas.
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
            • Arrange and organize canvas elements.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 0,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Rename and manage canvas files.
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
        <Image
          src={canvasDemo}
          alt="Canvas Demo"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#0f0f0f'
          }}
          priority
        />
        </Box>
      </Box>
    </Box>
  );
}
