import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function PowerPointFeatureTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          PowerPoint / Presentations
        </Typography>

        <Typography variant="p" className="mb-4">
          Banbury supports working with PowerPoint-style presentations (PPTX) directly in the app—open existing decks, edit slides, and download the updated file.
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">What Banbury supports</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Open and edit `.pptx` presentations in the document viewer</Typography>
            <Typography variant="p" className="mb-1">• Create new presentations from the Files area</Typography>
            <Typography variant="p" className="mb-1">• Edit slide content and structure (add, remove, reorder slides)</Typography>
            <Typography variant="p" className="mb-1">• Use common presentation tools (layouts, templates, theme-style controls, and transitions)</Typography>
            <Typography variant="p">• Download the updated presentation as a `.pptx` file</Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Where to find it</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• From the Files area: create a new presentation (named like "New Presentation … .pptx")</Typography>
            <Typography variant="p" className="mb-1">• From the file list: open any existing `.pptx` file</Typography>
            <Typography variant="p">• If you have Google Slides: export to `.pptx`, then open the exported file in Banbury</Typography>
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">Recommended workflow</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Start from a template or an existing deck, then iterate slide-by-slide</Typography>
            <Typography variant="p" className="mb-1">• Keep one concept per slide to make edits (and AI suggestions) more reliable</Typography>
            <Typography variant="p">• Download periodically to share externally or archive milestones</Typography>
          </div>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">AI assist (high level)</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Banbury can help draft slide text, tighten wording, and propose outlines based on your instructions</Typography>
            <Typography variant="p" className="mb-1">• Use clear constraints (audience, tone, length, slide count) for best results</Typography>
          </div>
          <Typography variant="p" className="mt-3">
            AI assistance is intended to accelerate drafting and editing, not replace review—always confirm facts and formatting before sharing.
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
