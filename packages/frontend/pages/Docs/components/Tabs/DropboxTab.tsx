import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function DropboxTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">Dropbox</Typography>

        <Typography variant="p" className="mb-4">
          Connect Dropbox to let Banbury browse Dropbox-backed storage, organize files, and use selected files in workspace workflows.
        </Typography>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Capabilities</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Browse files and folders from connected Dropbox storage</Typography>
            <Typography variant="p" className="mb-1">• Search Dropbox content from the Files panel</Typography>
            <Typography variant="p" className="mb-1">• Create folders and upload files into Dropbox-backed workspaces</Typography>
            <Typography variant="p">• Copy supported workspace files into Dropbox when storage access is connected</Typography>
          </div>
        </Card>

        <Card className="mb-4 rounded-xl p-6">
          <Typography variant="h3" className="mb-2">AI tools</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">• Dropbox access powers file and storage workflows for your account</Typography>
            <Typography variant="p">• No dedicated assistant tool toggle is currently exposed for Dropbox in composer preferences</Typography>
          </div>
        </Card>

        <Card className="rounded-xl p-6">
          <Typography variant="h3" className="mb-2">Connect Dropbox</Typography>
          <div className="ps-4">
            <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
            <Typography variant="p" className="mb-1">2. Select Dropbox and authorize account access</Typography>
            <Typography variant="p">3. Return to Files to browse, search, and manage Dropbox content</Typography>
          </div>
        </Card>
      </div>
    </DocPageLayout>
  )
}
