import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function FlowsTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Flows
        </Typography>

        <Typography variant="p" className="mb-4">
          Flows are visual automations you build on a canvas: connect nodes from a start trigger through integrations and utilities to an output. You can run a flow on demand, inspect execution logs, save the graph, and optionally schedule recurring runs.
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Where to find Flows</Typography>
          <Typography variant="p" className="mb-3">
            Open the workspace left sidebar and choose the Flows section (branch icon). Create or open a flow; it opens in the main panel as a dedicated tab with the flow editor.
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Building a flow</Typography>
          <Typography variant="p" className="mb-3">
            Each flow begins at a <strong>Start</strong> node and typically ends at an <strong>Output</strong> node that surfaces results. Drag nodes from the palette, wire handles from one node to the next, and select a node to configure it in the side panel.
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">
              • <strong>Save</strong> persists the graph (nodes, edges, and viewport) to the server
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>Run</strong> executes the flow server-side; status and logs update when the run finishes
            </Typography>
            <Typography variant="p">
              • <strong>Stop</strong> cancels an in-flight run when supported
            </Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Node types</Typography>
          <Typography variant="p" className="mb-3">
            Available nodes include triggers, integrations, utilities, and output:
          </Typography>
          <Typography variant="list">
            <li><strong>Triggers:</strong> Start — entry point for the flow</li>
            <li><strong>Database:</strong> Database Query — read from a saved connection (see <Link href="/docs/databases" className="underline underline-offset-4">Databases</Link>)</li>
            <li><strong>Communication:</strong> Slack (send message), Gmail (send email)</li>
            <li><strong>Calendar:</strong> Google Calendar, Microsoft Calendar — list or create events</li>
            <li><strong>Storage:</strong> Google Drive, OneDrive — list or search files</li>
            <li><strong>Social:</strong> X (Twitter) — post or search</li>
            <li><strong>Development:</strong> GitHub (repos, issues, search), Python Code (inline script or file path)</li>
            <li><strong>Utility:</strong> Format Text (templates with <code className="text-sm">{'{{variable}}'}</code>), Filter Data, HTTP Request</li>
            <li><strong>Output:</strong> Output — display execution results</li>
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Scheduling</Typography>
          <Typography variant="p" className="mb-3">
            Flows support optional schedules so automation runs without manual clicks. From the flow editor, open scheduling to enable a pattern, set time and timezone, and optionally an end date.
          </Typography>
          <Typography variant="p" className="mb-3">Patterns include:</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Every minute, hourly, daily, weekly, or monthly</Typography>
            <Typography variant="p" className="mb-1">• Custom interval (minutes)</Typography>
            <Typography variant="p">• Weekly: choose days; monthly: day of month</Typography>
          </div>
          <Typography variant="p" className="mt-3">
            The UI shows the next run time when configured. Last run status and timestamps on the flow reflect scheduled and manual executions.
          </Typography>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">Tips</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">
              • Connect integrations in the order data should flow; downstream nodes receive upstream output
            </Typography>
            <Typography variant="p" className="mb-1">
              • Use <strong>Filter Data</strong> and <strong>Format Text</strong> to shape results before email, Slack, or HTTP steps
            </Typography>
            <Typography variant="p">
              • Database Query nodes rely on connections you save under <Link href="/docs/databases" className="underline underline-offset-4">Databases</Link>
            </Typography>
          </div>
        </div>
      </div>
    </DocPageLayout>
  )
}
