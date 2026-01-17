import { Box } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function FileSharingTab() {
  return (
    <DocPageLayout>
      <Box>
        <Typography variant="h2" className="mb-3">
          File Sharing
        </Typography>

        <Typography variant="p" className="mb-4">
          Share files with other users in your workspace so you can collaborate. Sharing is edit-only today (everyone you share with gets edit access).
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Where to find it</Typography>
          <Typography variant="list">
            <li>From the file tree: open a file's context menu and select "Share"</li>
            <li>From the document viewer: use the share action (opens the same share dialog)</li>
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">How it works</Typography>
          <Typography variant="list">
            <li>Search for users by username, name, or email</li>
            <li>Select one or more users and confirm to share</li>
            <li>Shared users receive edit access to the file</li>
          </Typography>
          <Typography variant="p" className="mt-3">
            Note: Banbury currently supports edit-only sharing. View-only permissions are not available yet.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">Good practices</Typography>
          <Typography variant="list">
            <li>Share the smallest set of files needed for the task</li>
            <li>Use clear file names to avoid confusion when collaborating</li>
            <li>If sensitive content is involved, confirm recipients before sharing</li>
          </Typography>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
