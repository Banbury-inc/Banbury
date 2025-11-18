import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function IntegrationsTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
        Integrations
      </Typography>

      <Typography variant="p" className="mb-4">
        Banbury connects securely with your existing tools and data sources to provide grounded analysis and automation across your stack.
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">Supported integrations</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• Gmail</Typography>
          <Typography variant="muted" className="mb-1">• Google Docs</Typography>
          <Typography variant="muted" className="mb-1">• Google Sheets</Typography>
          <Typography variant="muted" className="mb-1">• Outlook</Typography>
          <Typography variant="muted">• X (Twitter)</Typography>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">Connecting services</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">1. Gmail: connect via OAuth in Settings → Integrations (read-only scopes recommended)</Typography>
          <Typography variant="muted" className="mb-1">2. Google Docs: grant access to specific documents or folders as needed</Typography>
          <Typography variant="muted" className="mb-1">3. Google Sheets: enable access for target spreadsheets to allow reading and updates</Typography>
          <Typography variant="muted" className="mb-1">4. Outlook: sign in with Microsoft account to sync email and calendar</Typography>
          <Typography variant="muted">5. X (Twitter): provide API keys/tokens in Settings to enable read/post</Typography>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">Authentication & security</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• OAuth with per-workspace scoping and token rotation</Typography>
          <Typography variant="muted" className="mb-1">• Read-only access by default; least-privilege principle</Typography>
          <Typography variant="muted">• Event-level lineage for downstream answers and automations</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
