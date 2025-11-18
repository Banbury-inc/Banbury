import { Box } from '@mui/material';
import DocPageLayout from '../DocPageLayout';
import { Typography } from '../../../../components/ui/typography';
const browserAutomationDemo = require('../../../../assets/images/browser-automation-demo.mp4');

export default function FoldersFeatureTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
        Folders
      </Typography>
      
      {/* Visibility */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          • <strong>Visibility:</strong>
        </Typography>
        <Typography variant="muted" className="mb-2 pl-2">
          • Banbury can read what's inside a folder and help to understand it better.
        </Typography>
      </Box>

      {/* Actions */}
      <Box>
        <Typography variant="h4" className="mb-2">
          • <strong>Actions - Banbury can:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">
            • Create a new folder.
          </Typography>
          <Typography variant="muted" className="mb-1">
            • Move things into and out of a folder.
          </Typography>
          <Typography variant="muted" className="mb-1">
            • Perform an in depth analysis of a folder.
          </Typography>
          <Typography variant="muted">
            • Rename a folder.
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
    </DocPageLayout>
  );
}
