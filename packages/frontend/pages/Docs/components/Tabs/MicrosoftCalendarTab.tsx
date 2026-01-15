import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function MicrosoftCalendarTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">Microsoft Calendar</Typography>

      <Typography variant="p" className="mb-4">
        Connect Microsoft Calendar to enable scheduling, meeting management, and availability tracking across your organization.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">• View and search calendar events across accounts</Typography>
          <Typography variant="p" className="mb-1">• Schedule meetings and send invites automatically</Typography>
          <Typography variant="p" className="mb-1">• Check availability and find optimal meeting times</Typography>
          <Typography variant="p">• Manage recurring events and meeting conflicts</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">• search_calendar_events: find events by date, attendee, or subject</Typography>
          <Typography variant="p" className="mb-1">• create_calendar_event: schedule meetings with attendees and details</Typography>
          <Typography variant="p">• Additional Microsoft Calendar actions are proxied via Composio when connected</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect Microsoft Calendar</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="p" className="mb-1">2. Select Microsoft Calendar and sign in with your Microsoft account</Typography>
          <Typography variant="p">3. Choose which calendars to sync with Banbury</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}

