import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

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
        <Typography variant="list">
          <li>Read and write sheets with granular control</li>
          <li>Generate reports, pivot summaries, and charts</li>
          <li>Sync sheet insights into the knowledge graph</li>
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">• sheet_ai: setCell, setRange, insertRows/Cols, deleteRows/Cols</Typography>
          <Typography variant="p" className="mb-1">• create_file: create .xlsx spreadsheets in cloud workspace</Typography>
          <Typography variant="p">• search_files: find spreadsheets by name in cloud storage</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect Google Sheets</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="p" className="mb-1">2. Select Google Sheets and complete OAuth</Typography>
          <Typography variant="p">3. Share specific sheets or folders with Banbury</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
