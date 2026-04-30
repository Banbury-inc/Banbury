import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function GoogleSheetsTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">Google Sheets</Typography>

        <Typography variant="p" className="mb-4">
          Connect Google Sheets to analyze data, maintain models, and automate spreadsheet workflows.
        </Typography>

        <Card className="mb-4 p-6">
          <Typography variant="h3" className="mb-2">Capabilities</Typography>
          <Typography variant="list">
            <li>Read and write sheets with granular control</li>
            <li>Generate reports, pivot summaries, and charts</li>
            <li>Sync sheet insights into the knowledge graph</li>
          </Typography>
        </Card>

        <Card className="mb-4 p-6">
          <Typography variant="h3" className="mb-2">AI tools</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">• sheet_ai: setCell, setRange, insertRows/Cols, deleteRows/Cols</Typography>
            <Typography variant="p" className="mb-1">• create_file: create .xlsx spreadsheets in cloud workspace</Typography>
            <Typography variant="p">• search_files: find spreadsheets by name in cloud storage</Typography>
          </div>
        </Card>

        <Card className="p-6">
          <Typography variant="h3" className="mb-2">Connect Google Sheets</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Select Google Sheets and complete OAuth</Typography>
            <Typography variant="p">3. Share specific sheets or folders with Banbury</Typography>
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
