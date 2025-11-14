import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function OutlookTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">Outlook</Typography>

      <Typography variant="p" className="mb-4">
        Connect Outlook to enable email and calendar workflows for scheduling and communications.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• Read and summarize threads with citations</Typography>
          <Typography variant="muted" className="mb-1">• Create and manage calendar events</Typography>
          <Typography variant="muted">• Draft replies and trigger task automations</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• search_outlook_email: search Outlook messages (query, from, subject, attachments)</Typography>
          <Typography variant="muted">• Additional Outlook actions are proxied via Composio when connected</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect Outlook</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="muted" className="mb-1">2. Select Outlook and sign in with Microsoft</Typography>
          <Typography variant="muted">3. Choose mailboxes and calendars to sync</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
