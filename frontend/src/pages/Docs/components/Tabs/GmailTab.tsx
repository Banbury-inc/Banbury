import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function GmailTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">Gmail</Typography>

      <Typography variant="p" className="mb-4">
        Connect Gmail to let Banbury read, summarize, and act on emails with grounding and traceability.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• Read and summarize threads with citations</Typography>
          <Typography variant="muted" className="mb-1">• Extract key entities and deadlines into the knowledge graph</Typography>
          <Typography variant="muted">• Draft replies and trigger task automations</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• gmail_get_recent: fetch recent messages from inbox</Typography>
          <Typography variant="muted" className="mb-1">• gmail_search: search emails using Gmail query syntax</Typography>
          <Typography variant="muted" className="mb-1">• gmail_get_message: retrieve a specific message with full content</Typography>
          <Typography variant="muted">• gmail_send_message: send an email (HTML supported)</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect Gmail</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="muted" className="mb-1">2. Select Gmail and complete OAuth (read-only recommended)</Typography>
          <Typography variant="muted">3. Choose labels or folders for ingestion</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
