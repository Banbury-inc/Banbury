import { Box } from '@mui/material'
import Link from 'next/link'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function FeaturesTab() {
  return (
    <DocPageLayout>
      <Box>
        <Typography variant="h2" className="mb-3">
          Banbury's Features
        </Typography>
        <Typography variant="p" className="mb-4">
          Banbury is an Enterprise AI Analyst that works as a remote artificial employee within organizations. This guide highlights two important aspects of Banbury's interaction with your data:
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">What can Banbury see?</Typography>
          <Typography variant="p">
            Banbury has visibility into different asset types, allowing it to understand and interpret a wide array of data. For example, Banbury can read documents and spreadsheets, view the contents of folders, and even browse the web to gather information.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">What can Banbury do?</Typography>
          <Typography variant="p">
            Beyond just viewing, Banbury can perform a multitude of actions on top of your assets to manage your workspace efficiently. It can create and edit documents & spreadsheets and share assets with others, among other capabilities.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Available Features</Typography>
          <Typography variant="p" className="mb-3">
            Explore the specific capabilities of each feature by selecting them from the sidebar:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• <strong>Docs</strong> — Create, edit, and manage documents</Typography>
            <Typography variant="p" className="mb-1">• <strong>Spreadsheets</strong> — Work with spreadsheet data and formulas</Typography>
            <Typography variant="p" className="mb-1">• <strong>Folders</strong> — Organize and analyze folder contents</Typography>
            <Typography variant="p" className="mb-1">• <strong>Browse</strong> — Web browsing and automation capabilities</Typography>
            <Typography variant="p" className="mb-1">• <strong>Calendar</strong> — Manage events and calendar data</Typography>
            <Typography variant="p" className="mb-1">• <strong>Canvas</strong> — Create and manage visual canvas elements</Typography>
            <Typography variant="p">• <strong>Gmail</strong> — Manage emails and automate communication</Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">Latest Features</Typography>
          <Typography variant="p" className="mb-3">
            New and recently updated capabilities:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/powerpoint-feature" className="underline underline-offset-4">PowerPoint / Presentations</Link> — Work with .pptx presentations (open, edit slides, and download)
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/context-wheel" className="underline underline-offset-4">Context Wheel</Link> — A context budget meter by the composer send button (used/remaining + reserved output)
            </Typography>
            <Typography variant="p" className="mb-1">
              • <Link href="/docs/file-sharing" className="underline underline-offset-4">File Sharing</Link> — Share files with other users (edit access today)
            </Typography>
            <Typography variant="p">
              • <Link href="/docs/outlook" className="underline underline-offset-4">Outlook</Link> — Microsoft Outlook integration for email and calendar
            </Typography>
          </Box>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
