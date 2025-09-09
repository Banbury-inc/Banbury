import { Box, Typography, Paper } from '@mui/material'

export default function GoogleSheetsTab() {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 600, mb: 3, color: '#ffffff', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Google Sheets</Typography>

      <Typography sx={{ fontSize: '1rem', color: '#a1a1aa', mb: 4, lineHeight: 1.7, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        Connect Google Sheets to analyze data, maintain models, and automate spreadsheet workflows.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Read and write sheets with granular control</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Generate reports, pivot summaries, and charts</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• Sync sheet insights into the knowledge graph</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• sheet_ai: setCell, setRange, insertRows/Cols, deleteRows/Cols</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• create_file: create .xlsx spreadsheets in cloud workspace</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• search_files: find spreadsheets by name in cloud storage</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Connect Google Sheets</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>1. Go to Settings → Integrations</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>2. Select Google Sheets and complete OAuth</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>3. Share specific sheets or folders with Banbury</Typography>
        </Box>
      </Paper>
    </Box>
  )
}


