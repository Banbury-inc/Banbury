import DocPageLayout from '../DocPageLayout'
import { Card } from '../../../../components/common/ui/card'
import { Typography } from '../../../../components/common/ui/typography'

const spreadsheetDemo = require('../../../../assets/images/spreadsheet_demo.mp4')

export default function SpreadsheetsFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Spreadsheets
        </Typography>

        <div className="mb-4">
          <Typography variant="h4" className="mb-2">
            <strong>Visibility:</strong>
          </Typography>
          <Typography variant="list">
            <li>Banbury can read what's inside a spreadsheet and look at every single cell.</li>
          </Typography>
        </div>

        <div>
          <Typography variant="h4" className="mb-2">
            <strong>Actions - Banbury can:</strong>
          </Typography>
          <Typography variant="list">
            <li>Create a new spreadsheet.</li>
            <li>Edit the contents of a spreadsheet.</li>
            <li>Rename a spreadsheet.</li>
          </Typography>
        </div>

        <Card className="relative mt-4 flex min-h-0 flex-col overflow-hidden rounded-2xl p-6">
          <div className="relative min-h-[300px] w-full flex-1 overflow-hidden rounded-xl">
            <video
              src={spreadsheetDemo}
              controls
              muted
              playsInline
              className="h-full w-full rounded-xl object-cover"
            />
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
