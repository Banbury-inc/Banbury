import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function IntegrationsTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Integrations
        </Typography>

        <Typography variant="p" className="mb-4">
          Banbury connects securely with your existing tools and data sources to provide grounded analysis and automation across your stack.
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Supported integrations</Typography>
          <Typography variant="p" className="mb-3">
            Click each integration to learn more about setup and capabilities:
          </Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/gmail" className="underline underline-offset-4">Gmail</Link> — Read, search, and send emails
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/google-docs" className="underline underline-offset-4">Google Docs</Link> — Access and work with documents
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/google-sheets" className="underline underline-offset-4">Google Sheets</Link> — Read and update spreadsheets
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/outlook" className="underline underline-offset-4">Outlook</Link> — Email and calendar workflows (latest)
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/microsoft-calendar" className="underline underline-offset-4">Microsoft Calendar</Link> — Schedule and manage calendar events
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/microsoft-teams" className="underline underline-offset-4">Microsoft Teams</Link> — Read Teams context and send channel messages
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/onedrive" className="underline underline-offset-4">OneDrive</Link> — Access and sync cloud files
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/dropbox" className="underline underline-offset-4">Dropbox</Link> — Browse and manage cloud storage
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/notion" className="underline underline-offset-4">Notion</Link> — Search workspace knowledge and create pages
            </Typography>
            <Typography variant="p">
              • <Link href="/docs/x" className="underline underline-offset-4">X (Twitter)</Link> — Social media read/post
            </Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Connecting services</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Select the service you want to connect</Typography>
            <Typography variant="p" className="mb-1">3. Complete OAuth sign-in (Google, Microsoft, etc.)</Typography>
            <Typography variant="p">4. Choose which resources (mailboxes, folders, calendars) to sync</Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Authentication & security</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">• OAuth with per-workspace scoping and token rotation</Typography>
            <Typography variant="p" className="mb-1">• Read-only access by default; least-privilege principle</Typography>
            <Typography variant="p">• Event-level lineage for downstream answers and automations</Typography>
          </div>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">Latest integration: Outlook</Typography>
          <Typography variant="p" className="mb-3">
            Microsoft Outlook is now available as an integration, enabling email and calendar workflows.
          </Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">• Read and summarize email threads with citations</Typography>
            <Typography variant="p" className="mb-1">• Create and manage calendar events</Typography>
            <Typography variant="p">• Draft replies and trigger task automations</Typography>
          </div>
          <Typography variant="p" className="mt-3">
            See the full <Link href="/docs/outlook" className="underline underline-offset-4">Outlook documentation</Link> for setup steps.
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
