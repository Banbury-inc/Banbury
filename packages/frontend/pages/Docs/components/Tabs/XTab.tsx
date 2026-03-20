import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function XTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">X (Twitter)</Typography>

        <Typography variant="p" className="mb-4">
          Connect X to research accounts, monitor topics, and post updates programmatically.
        </Typography>

        <Card className="mb-4 p-6">
          <Typography variant="h3" className="mb-2">Capabilities</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">• Lookup users and recent tweets</Typography>
            <Typography variant="p" className="mb-1">• Search by query and track topics</Typography>
            <Typography variant="p">• Post tweets via backend proxy</Typography>
          </div>
        </Card>

        <Card className="mb-4 p-6">
          <Typography variant="h3" className="mb-2">AI tools</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">• x_api_get_user_info: fetch user info by username or user ID</Typography>
            <Typography variant="p" className="mb-1">• x_api_get_user_tweets: list recent tweets by a user</Typography>
            <Typography variant="p" className="mb-1">• x_api_search_tweets: search tweets by keywords</Typography>
            <Typography variant="p" className="mb-1">• x_api_get_trending_topics: get trending topics (optional WOEID)</Typography>
            <Typography variant="p">• x_api_post_tweet: post a tweet (optionally reply or attach media)</Typography>
          </div>
        </Card>

        <Card className="p-6">
          <Typography variant="h3" className="mb-2">Connect X</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Enter API keys/tokens from X Developer portal</Typography>
            <Typography variant="p">3. Enable read or post permissions as needed</Typography>
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
