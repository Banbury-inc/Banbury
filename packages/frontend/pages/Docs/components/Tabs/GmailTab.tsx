import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

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
          <Typography variant="p" className="mb-1">• Read and summarize threads with citations</Typography>
          <Typography variant="p" className="mb-1">• Extract key entities and deadlines into the knowledge graph</Typography>
          <Typography variant="p">• Draft replies and trigger task automations</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Typography variant="list">
          <li>gmail_get_recent: fetch recent messages from inbox</li>
          <li>gmail_search: search emails using Gmail query syntax</li>
          <li>gmail_get_message: retrieve a specific message with full content</li>
          <li>gmail_send_message: send an email (HTML supported)</li>
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect Gmail</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="p" className="mb-1">2. Select Gmail and complete OAuth (read-only recommended)</Typography>
          <Typography variant="p">3. Choose labels or folders for ingestion</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
