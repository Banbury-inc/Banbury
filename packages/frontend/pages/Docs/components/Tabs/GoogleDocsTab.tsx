import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function GoogleDocsTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">Google Docs</Typography>

        <Typography variant="p" className="mb-4">
          Connect Google Docs to allow Banbury to read, summarize, and draft documents collaboratively.
        </Typography>

        <Card className="mb-4 p-6">
          <Typography variant="h3" className="mb-2">Capabilities</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">• Read and summarize documents with citations</Typography>
            <Typography variant="p" className="mb-1">• Generate outlines and drafts for approvals</Typography>
            <Typography variant="p">• Extract facts into the knowledge graph</Typography>
          </div>
        </Card>

        <Card className="mb-4 p-6">
          <Typography variant="h3" className="mb-2">AI tools</Typography>
          <Typography variant="list">
            <li>create_file: create .docx files in cloud workspace</li>
            <li>docx_ai: generate or edit Word documents with AI</li>
            <li>search_files: find documents by name in cloud storage</li>
          </Typography>
        </Card>

        <Card className="p-6">
          <Typography variant="h3" className="mb-2">Connect Google Docs</Typography>
          <div className="pl-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Select Google Docs and complete OAuth</Typography>
            <Typography variant="p">3. Share specific docs or folders with Banbury</Typography>
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
