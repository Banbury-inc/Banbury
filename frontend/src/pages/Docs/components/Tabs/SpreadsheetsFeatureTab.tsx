import { Box } from '@mui/material';
import DocPageLayout from '../DocPageLayout';
import { Typography } from '../../../../components/ui/typography';
const spreadsheetDemo = require('../../../../assets/images/spreadsheet_demo.mp4');

export default function SpreadsheetsFeatureTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
        Spreadsheets
      </Typography>
      
      {/* Visibility */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" className="mb-2">
          • <strong>Visibility:</strong>
        </Typography>
        <Typography variant="muted" className="mb-2 pl-2">
          • Banbury can read what's inside a spreadsheet and look at every single cell.
        </Typography>
      </Box>

      {/* Actions */}
      <Box>
        <Typography variant="h4" className="mb-2">
          • <strong>Actions - Banbury can:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">
            • Create a new spreadsheet.
          </Typography>
          <Typography variant="muted" className="mb-1">
            • Edit the contents of a spreadsheet.
          </Typography>
          <Typography variant="muted">
            • Rename a spreadsheet.
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
            src={spreadsheetDemo} 
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
