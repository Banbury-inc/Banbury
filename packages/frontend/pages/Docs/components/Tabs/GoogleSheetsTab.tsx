import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function GoogleSheetsTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">Google Sheets</Typography>

      <Typography variant="p" className="mb-4">
        Connect Google Sheets to analyze data, maintain models, and automate spreadsheet workflows.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• Read and write sheets with granular control</Typography>
          <Typography variant="muted" className="mb-1">• Generate reports, pivot summaries, and charts</Typography>
          <Typography variant="muted">• Sync sheet insights into the knowledge graph</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• sheet_ai: setCell, setRange, insertRows/Cols, deleteRows/Cols</Typography>
          <Typography variant="muted" className="mb-1">• create_file: create .xlsx spreadsheets in cloud workspace</Typography>
          <Typography variant="muted">• search_files: find spreadsheets by name in cloud storage</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect Google Sheets</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="muted" className="mb-1">2. Select Google Sheets and complete OAuth</Typography>
          <Typography variant="muted">3. Share specific sheets or folders with Banbury</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
