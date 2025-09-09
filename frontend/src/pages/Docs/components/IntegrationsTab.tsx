import { Box, Typography, Paper } from '@mui/material'

export default function IntegrationsTab() {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: { xs: '1.75rem', md: '2rem' },
          fontWeight: 600,
          mb: 3,
          color: '#ffffff',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Integrations
      </Typography>

      <Typography
        sx={{
          fontSize: '1rem',
          color: '#a1a1aa',
          mb: 4,
          lineHeight: 1.7,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
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
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Supported integrations</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Gmail</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Google Docs</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Google Sheets</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Outlook</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• X (Twitter)</Typography>
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
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Connecting services</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>1. Gmail: connect via OAuth in Settings → Integrations (read-only scopes recommended)</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>2. Google Docs: grant access to specific documents or folders as needed</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>3. Google Sheets: enable access for target spreadsheets to allow reading and updates</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>4. Outlook: sign in with Microsoft account to sync email and calendar</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>5. X (Twitter): provide API keys/tokens in Settings to enable read/post</Typography>
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
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>Authentication & security</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• OAuth with per-workspace scoping and token rotation</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>• Read-only access by default; least-privilege principle</Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>• Event-level lineage for downstream answers and automations</Typography>
        </Box>
      </Paper>
    </Box>
  )
}


