import { Box } from '@mui/material';
import DocPageLayout from '../DocPageLayout';
import { Typography } from '../../../../components/ui/typography';

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

      {/* What can Banbury see? */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" className="mb-3">
          1. <strong>What can Banbury see?</strong>
        </Typography>
        <Typography variant="p" className="mb-4">
          Banbury has visibility into different asset types, allowing it to understand and interpret a wide array of data. For example, Banbury can read documents and spreadsheets, view the contents of folders, and even browse the web to gather information.
        </Typography>
      </Box>

      {/* What can Banbury do? */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" className="mb-3">
          2. <strong>What can Banbury do?</strong>
        </Typography>
        <Typography variant="p" className="mb-4">
          Beyond just viewing, Banbury can perform a multitude of actions on top of your assets to manage your workspace efficiently. It can create and edit documents & spreadsheets and share assets with others, among other capabilities.
        </Typography>
      </Box>

      {/* Feature Overview */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" className="mb-3">
          <strong>Available Features</strong>
        </Typography>
        <Typography variant="p" className="mb-4">
          Explore the specific capabilities of each feature by selecting them from the sidebar:
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">
            • <strong>Docs</strong> - Create, edit, and manage documents
          </Typography>
          <Typography variant="muted" className="mb-1">
            • <strong>Spreadsheets</strong> - Work with spreadsheet data and formulas
          </Typography>
          <Typography variant="muted" className="mb-1">
            • <strong>Folders</strong> - Organize and analyze folder contents
          </Typography>
          <Typography variant="muted" className="mb-1">
            • <strong>Browse</strong> - Web browsing and automation capabilities
          </Typography>
          <Typography variant="muted" className="mb-1">
            • <strong>Calendar</strong> - Manage events and calendar data
          </Typography>
          <Typography variant="muted" className="mb-1">
            • <strong>Canvas</strong> - Create and manage visual canvas elements
          </Typography>
          <Typography variant="muted">
            • <strong>Gmail</strong> - Manage emails and automate communication
          </Typography>
        </Box>
      </Box>
      </Box>
    </DocPageLayout>
  );
}