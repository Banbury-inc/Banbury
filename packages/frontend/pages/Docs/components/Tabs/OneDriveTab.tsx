import { Box, Paper } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function OneDriveTab() {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">OneDrive</Typography>

      <Typography variant="p" className="mb-4">
        Connect OneDrive to enable cloud file storage access, document management, and seamless file sharing workflows.
      </Typography>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Capabilities</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">• Browse and search files across your OneDrive storage</Typography>
          <Typography variant="p" className="mb-1">• Read and summarize documents with citations</Typography>
          <Typography variant="p" className="mb-1">• Upload and organize files into folders</Typography>
          <Typography variant="p">• Share files and manage permissions</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 4, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">AI tools</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">• search_files: find documents by name in OneDrive storage</Typography>
          <Typography variant="p" className="mb-1">• create_file: create and upload files to OneDrive</Typography>
          <Typography variant="p">• Additional OneDrive actions are proxied via Composio when connected</Typography>
        </Box>
      </Paper>

      <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
        <Typography variant="h3" className="mb-2">Connect OneDrive</Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="p" className="mb-1">1. Go to Settings → Integrations</Typography>
          <Typography variant="p" className="mb-1">2. Select OneDrive and sign in with Microsoft</Typography>
          <Typography variant="p">3. Choose folders and files to sync with Banbury</Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}

