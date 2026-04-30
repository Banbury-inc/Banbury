import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function DatabasesTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Databases
        </Typography>

        <Typography variant="p" className="mb-4">
          Connect SQL and document databases from the workspace, browse schema and collections, and open tables in a spreadsheet-style viewer. Saved connections can be reused in <Link href="/docs/flows" className="underline underline-offset-4">Flows</Link> (Database Query nodes) and when exploring data in tabs.
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Where to find Databases</Typography>
          <Typography variant="p" className="mb-3">
            In the workspace left sidebar, open <strong>Databases</strong>. Add a connection, test it, and expand the tree to see databases, schemas, tables, or MongoDB collections.
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Supported providers</Typography>
          <Typography variant="list">
            <li><strong>PostgreSQL</strong> — schemas and tables</li>
            <li><strong>MySQL</strong> — databases and tables</li>
            <li><strong>MongoDB</strong> — databases and collections</li>
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Connections</Typography>
          <Typography variant="p" className="mb-3">
            You can connect using host, port, username, and password (and optional default database), or a connection URI where applicable. Before saving, use <strong>Test connection</strong> to verify reachability from Banbury&apos;s backend.
          </Typography>
          <Typography variant="p" className="mb-3">
            <strong>Saved connections</strong> store credentials securely for reuse; you can list and remove them from the databases panel. SSH tunneling is supported for environments where the database is only reachable through a bastion (host, port, user, password or public key).
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Table and collection viewer</Typography>
          <Typography variant="p" className="mb-3">
            Opening a table or collection creates a middle-panel tab with paginated rows, configurable page size, column sorting, and per-column filters. Keyboard navigation and a toolbar support refresh and bulk operations.
          </Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">
              • <strong>Edit cells</strong> on existing rows (relational data uses primary keys for updates)
            </Typography>
            <Typography variant="p" className="mb-1">
              • <strong>Add rows</strong> and save when your permissions and schema allow inserts
            </Typography>
            <Typography variant="p">
              • <strong>Save</strong> commits pending edits; validation and errors surface in the UI
            </Typography>
          </div>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">Flows integration</Typography>
          <Typography variant="p">
            In <Link href="/docs/flows" className="underline underline-offset-4">Flows</Link>, add a <strong>Database Query</strong> node and pick a saved connection, table (or equivalent), columns, and filters so automated runs can read data as part of a larger pipeline.
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
