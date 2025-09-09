import { Box, Typography, Paper } from '@mui/material'

export default function OutlookTab() {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 600, mb: 3, color: '#ffffff', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Outlook</Typography>

      <Typography sx={{ fontSize: '1rem', color: '#a1a1aa', mb: 4, lineHeight: 1.7, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        Connect Outlook to enable email and calendar workflows for scheduling and communications.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Read and summarize threads with citations</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Create and manage calendar events</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• Draft replies and trigger task automations</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• search_outlook_email: search Outlook messages (query, from, subject, attachments)</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• Additional Outlook actions are proxied via Composio when connected</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Connect Outlook</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>1. Go to Settings → Integrations</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>2. Select Outlook and sign in with Microsoft</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>3. Choose mailboxes and calendars to sync</Typography>
        </Box>
      </Paper>
    </Box>
  )
}


