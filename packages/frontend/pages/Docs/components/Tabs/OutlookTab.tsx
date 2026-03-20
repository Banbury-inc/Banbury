import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function OutlookTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">Outlook</Typography>

        <Typography variant="p" className="mb-4">
          Connect Outlook to enable email and calendar workflows for scheduling and communications.
        </Typography>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Capabilities</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Read and summarize threads with citations</Typography>
            <Typography variant="p" className="mb-1">• Create and manage calendar events</Typography>
            <Typography variant="p">• Draft replies and trigger task automations</Typography>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">AI tools</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• search_outlook_email: search Outlook messages (query, from, subject, attachments)</Typography>
            <Typography variant="p">• Additional Outlook actions are proxied via Composio when connected</Typography>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Connect Outlook</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Select Outlook and sign in with Microsoft</Typography>
            <Typography variant="p">3. Choose mailboxes and calendars to sync</Typography>
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
