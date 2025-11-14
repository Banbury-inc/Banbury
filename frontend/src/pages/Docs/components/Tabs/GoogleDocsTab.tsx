import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function GoogleDocsTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">Google Docs</Typography>

      <Typography variant="p" className="mb-4">
        Connect Google Docs to allow Banbury to read, summarize, and draft documents collaboratively.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• Read and summarize documents with citations</Typography>
          <Typography variant="muted" className="mb-1">• Generate outlines and drafts for approvals</Typography>
          <Typography variant="muted">• Extract facts into the knowledge graph</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• create_file: create .docx files in cloud workspace</Typography>
          <Typography variant="muted" className="mb-1">• docx_ai: generate or edit Word documents with AI</Typography>
          <Typography variant="muted">• search_files: find documents by name in cloud storage</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect Google Docs</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="muted" className="mb-1">2. Select Google Docs and complete OAuth</Typography>
          <Typography variant="muted">3. Share specific docs or folders with Banbury</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
