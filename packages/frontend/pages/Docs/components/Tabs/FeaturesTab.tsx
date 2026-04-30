import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function FeaturesTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Banbury's Features
        </Typography>
        <Typography variant="p" className="mb-4">
          Banbury is an Enterprise AI Analyst that works as a remote artificial employee within organizations. This guide highlights two important aspects of Banbury's interaction with your data:
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">What can Banbury see?</Typography>
          <Typography variant="p">
            Banbury has visibility into different asset types, allowing it to understand and interpret a wide array of data. For example, Banbury can read documents and spreadsheets, view the contents of folders, and even browse the web to gather information.
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">What can Banbury do?</Typography>
          <Typography variant="p">
            Beyond just viewing, Banbury can perform a multitude of actions on top of your assets to manage your workspace efficiently. It can create and edit documents & spreadsheets and share assets with others, among other capabilities.
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Available Features</Typography>
          <Typography variant="p" className="mb-3">
            Explore the specific capabilities of each feature by selecting them from the sidebar:
          </Typography>
          <Typography variant="list">
            <li><strong>Agent Modes</strong> — Switch between Agent, Ask, and Planning modes</li>
            <li><strong>Parallel Agents</strong> — Run multiple agents simultaneously for faster execution</li>
            <li><strong>Queued Messages</strong> — Queue up follow-up messages while the agent works</li>
            <li><strong>Flows</strong> — Build and schedule visual automations (integrations, HTTP, code, and more)</li>
            <li><strong>Video Generation</strong> — Create videos from text descriptions</li>
            <li><strong>Docs</strong> — Create, edit, and manage documents</li>
            <li><strong>Spreadsheets</strong> — Work with spreadsheet data and formulas</li>
            <li><strong>Folders</strong> — Organize and analyze folder contents</li>
            <li><strong>Browse</strong> — Web browsing and automation capabilities</li>
            <li><strong>Databases</strong> — Connect PostgreSQL, MySQL, and MongoDB; browse and edit data</li>
            <li><strong>Calendar</strong> — Manage events and calendar data</li>
            <li><strong>Canvas</strong> — Create and manage visual canvas elements</li>
            <li><strong>Gmail</strong> — Manage emails and automate communication</li>
          </Typography>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">Latest Features</Typography>
          <Typography variant="p" className="mb-3">
            New and recently updated capabilities:
          </Typography>
          <Typography variant="list">
            <li>
              <Link href="/docs/agent-modes" className="underline underline-offset-4">Agent Modes</Link> — Switch between Agent, Ask (read-only), and Planning modes
            </li>
            <li>
              <Link href="/docs/parallel-agents" className="underline underline-offset-4">Parallel Agents</Link> — Run multiple agents simultaneously on different tasks
            </li>
            <li>
              <Link href="/docs/queued-messages" className="underline underline-offset-4">Queued Messages</Link> — Queue follow-up messages while the agent is working
            </li>
            <li>
              <Link href="/docs/video-generation" className="underline underline-offset-4">Video Generation</Link> — Generate videos using Sora, Veo, Runway, and Luma
            </li>
            <li>
              <Link href="/docs/powerpoint-feature" className="underline underline-offset-4">PowerPoint / Presentations</Link> — Work with .pptx presentations (open, edit slides, and download)
            </li>
            <li>
              <Link href="/docs/context-wheel" className="underline underline-offset-4">Context Wheel</Link> — A context budget meter by the composer send button (used/remaining + reserved output)
            </li>
            <li>
              <Link href="/docs/file-sharing" className="underline underline-offset-4">File Sharing</Link> — Share files with other users (edit access today)
            </li>
            <li>
              <Link href="/docs/outlook" className="underline underline-offset-4">Outlook</Link> — Microsoft Outlook integration for email and calendar
            </li>
            <li>
              <Link href="/docs/flows" className="underline underline-offset-4">Flows</Link> — Visual automation with integrations, scheduling, and run logs
            </li>
            <li>
              <Link href="/docs/databases" className="underline underline-offset-4">Databases</Link> — Saved connections, SSH tunnels, table viewer, and Flow query nodes
            </li>
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
