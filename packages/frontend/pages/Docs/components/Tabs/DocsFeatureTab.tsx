import DocPageLayout from '../DocPageLayout'
import { Card } from '../../../../components/common/ui/card'
import { Typography } from '../../../../components/common/ui/typography'

const browserAutomationDemo = require('../../../../assets/images/browser-automation-demo.mp4')

export default function DocsFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Docs
        </Typography>

        <div className="mb-4">
          <Typography variant="h4" className="mb-2">
            <strong>Visibility:</strong>
          </Typography>
          <Typography variant="list">
            <li>Banbury can read what's inside a document and look at every single page.</li>
          </Typography>
        </div>

        <div>
          <Typography variant="h4" className="mb-2">
            <strong>Actions - Banbury can:</strong>
          </Typography>
          <Typography variant="list">
            <li>Create a new document.</li>
            <li>Edit the contents of a document.</li>
            <li>Rename a document.</li>
          </Typography>
        </div>

        <Card className="relative mt-4 flex h-full min-h-0 flex-col overflow-hidden rounded-xl p-6">
          <div className="relative min-h-[300px] w-full flex-1 overflow-hidden rounded-xl">
            <video
              src={browserAutomationDemo}
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
