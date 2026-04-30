import DocPageLayout from '../DocPageLayout'
import { Card } from '../../../../components/common/ui/card'
import { Typography } from '../../../../components/common/ui/typography'

const browserAutomationDemo = require('../../../../assets/images/browser-automation-demo.mp4')

export default function FoldersFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Folders
        </Typography>

        <div className="mb-4">
          <Typography variant="h4" className="mb-2">
            <strong>Visibility:</strong>
          </Typography>
          <Typography variant="list">
            <li>Banbury can read what's inside a folder and help to understand it better.</li>
          </Typography>
        </div>

        <div>
          <Typography variant="h4" className="mb-2">
            <strong>Actions - Banbury can:</strong>
          </Typography>
          <Typography variant="list">
            <li>Create a new folder.</li>
            <li>Move things into and out of a folder.</li>
            <li>Perform an in depth analysis of a folder.</li>
            <li>Rename a folder.</li>
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
