import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function MicrosoftTeamsTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">Microsoft Teams</Typography>

        <Typography variant="p" className="mb-4">
          Connect Microsoft Teams through Microsoft Graph so Banbury can read Teams context and send channel messages when enabled.
        </Typography>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Capabilities</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• List joined teams, channels, members, chats, messages, and replies</Typography>
            <Typography variant="p" className="mb-1">• Fetch channel message details before responding</Typography>
            <Typography variant="p" className="mb-1">• Send channel messages and threaded replies from your connected Microsoft account</Typography>
            <Typography variant="p">• Reuse the same Microsoft Graph OAuth connection and credentials as Outlook</Typography>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">AI tools</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• ms_teams_list_teams: list Microsoft Teams joined by the connected account</Typography>
            <Typography variant="p" className="mb-1">• ms_teams_list_channels: list channels in a Microsoft Team</Typography>
            <Typography variant="p" className="mb-1">• ms_teams_list_channel_messages: read recent messages from a Teams channel</Typography>
            <Typography variant="p" className="mb-1">• ms_teams_get_channel_message: get details for a specific Teams channel message</Typography>
            <Typography variant="p" className="mb-1">• ms_teams_send_channel_message: send a message to a Teams channel</Typography>
            <Typography variant="p" className="mb-1">• ms_teams_list_message_replies: read replies for a Teams channel message</Typography>
            <Typography variant="p" className="mb-1">• ms_teams_reply_to_message: reply to a Teams channel message</Typography>
            <Typography variant="p" className="mb-1">• ms_teams_list_members: list members of a Microsoft Team</Typography>
            <Typography variant="p">• ms_teams_list_chats: list available Microsoft Teams chats</Typography>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Connect Microsoft Teams</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Select Microsoft Teams and sign in with Microsoft Graph</Typography>
            <Typography variant="p" className="mb-1">3. Reconnect if your Microsoft account was connected before Teams scopes were added</Typography>
            <Typography variant="p">4. Use tool preferences to enable or disable assistant access to Microsoft Teams</Typography>
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
