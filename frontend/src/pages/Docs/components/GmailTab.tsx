import { Box, Typography, Paper } from '@mui/material'

export default function GmailTab() {
  return (
    <Box>
      <Typography sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, fontWeight: 600, mb: 3, color: '#ffffff', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Gmail</Typography>

      <Typography sx={{ fontSize: '1rem', color: '#a1a1aa', mb: 4, lineHeight: 1.7, fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        Connect Gmail to let Banbury read, summarize, and act on emails with grounding and traceability.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Read and summarize threads with citations</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Extract key entities and deadlines into the knowledge graph</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• Draft replies and trigger task automations</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• gmail_get_recent: fetch recent messages from inbox</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• gmail_search: search emails using Gmail query syntax</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• gmail_get_message: retrieve a specific message with full content</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• gmail_send_message: send an email (HTML supported)</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Connect Gmail</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>1. Go to Settings → Integrations</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>2. Select Gmail and complete OAuth (read-only recommended)</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>3. Choose labels or folders for ingestion</Typography>
        </Box>
      </Paper>
    </Box>
  )
}


