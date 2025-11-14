import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function XTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">X (Twitter)</Typography>

      <Typography variant="p" className="mb-4">
        Connect X to research accounts, monitor topics, and post updates programmatically.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• Lookup users and recent tweets</Typography>
          <Typography variant="muted" className="mb-1">• Search by query and track topics</Typography>
          <Typography variant="muted">• Post tweets via backend proxy</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">• x_api_get_user_info: fetch user info by username or user ID</Typography>
          <Typography variant="muted" className="mb-1">• x_api_get_user_tweets: list recent tweets by a user</Typography>
          <Typography variant="muted" className="mb-1">• x_api_search_tweets: search tweets by keywords</Typography>
          <Typography variant="muted" className="mb-1">• x_api_get_trending_topics: get trending topics (optional WOEID)</Typography>
          <Typography variant="muted">• x_api_post_tweet: post a tweet (optionally reply or attach media)</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect X</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="muted" className="mb-1">2. Enter API keys/tokens from X Developer portal</Typography>
          <Typography variant="muted">3. Enable read or post permissions as needed</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
