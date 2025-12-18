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
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• From the file tree: open a file's context menu and select "Share"</Typography>
            <Typography variant="p">• From the document viewer: use the share action (opens the same share dialog)</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">How it works</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• Search for users by username, name, or email</Typography>
            <Typography variant="p" className="mb-1">• Select one or more users and confirm to share</Typography>
            <Typography variant="p">• Shared users receive edit access to the file</Typography>
          </Box>
          <Typography variant="p" className="mt-3">
            Note: Banbury currently supports edit-only sharing. View-only permissions are not available yet.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">Good practices</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• Share the smallest set of files needed for the task</Typography>
            <Typography variant="p" className="mb-1">• Use clear file names to avoid confusion when collaborating</Typography>
            <Typography variant="p">• If sensitive content is involved, confirm recipients before sharing</Typography>
          </Box>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
