import Image from 'next/image'
import DocPageLayout from '../DocPageLayout'
import { Card } from '../../../../components/common/ui/card'
import { Typography } from '../../../../components/common/ui/typography'
const canvasDemo = require('../../../../assets/images/canvas.png')

export default function CanvasFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Canvas
        </Typography>

        <div className="mb-4">
          <Typography variant="h4" className="mb-2">
            <strong>Visibility:</strong>
          </Typography>
          <Typography variant="list">
            <li>Banbury can view and understand the contents of a canvas, including all elements, shapes, text, and layouts.</li>
          </Typography>
        </div>

        <div>
          <Typography variant="h4" className="mb-2">
            <strong>Actions - Banbury can:</strong>
          </Typography>
          <Typography variant="list">
            <li>Create a new canvas.</li>
            <li>Add and modify elements on the canvas.</li>
            <li>Arrange and organize canvas elements.</li>
            <li>Rename and manage canvas files.</li>
          </Typography>
        </div>

        <Card className="relative mt-4 flex h-full flex-col overflow-hidden rounded-2xl p-6">
          <div className="relative min-h-[300px] w-full flex-1 overflow-hidden rounded-xl">
            <Image
              src={canvasDemo}
              alt="Canvas Demo"
              className="h-auto w-full rounded-xl border border-border bg-muted"
              priority
            />
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
