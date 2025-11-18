import { Box } from '@mui/material';
import Image from 'next/image';
import DocPageLayout from '../DocPageLayout';
import { Typography } from '../../../../components/ui/typography';
const canvasDemo = require('../../../../assets/images/canvas.png');

export default function CanvasFeatureTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
        Canvas
      </Typography>
      
      {/* Visibility */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          • <strong>Visibility:</strong>
        </Typography>
        <Typography variant="muted" className="mb-2 pl-2">
          • Banbury can view and understand the contents of a canvas, including all elements, shapes, text, and layouts.
        </Typography>
      </Box>

      {/* Actions */}
      <Box>
        <Typography variant="h4" className="mb-2">
          • <strong>Actions - Banbury can:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">
            • Create a new canvas.
          </Typography>
          <Typography variant="muted" className="mb-1">
            • Add and modify elements on the canvas.
          </Typography>
          <Typography variant="muted" className="mb-1">
            • Arrange and organize canvas elements.
          </Typography>
          <Typography variant="muted">
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
    </DocPageLayout>
  );
}
