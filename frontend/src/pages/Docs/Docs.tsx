import Box from '@mui/material/Box';
import { useRouter } from 'next/router';

import DocsSidebar from './components/DocsSidebar';
import WhatIsBanburyTab from './components/WhatIsBanburyTab';
import FeaturesTab from './components/FeaturesTab';
import UsingBanburyTab from './components/UsingBanbury';
import TaskStudioTab from './components/TaskStudioTab';
import KnowledgeGraphTab from './components/KnowledgeGraphTab';
import IntegrationsTab from './components/IntegrationsTab';
import GmailTab from './components/GmailTab';
import GoogleDocsTab from './components/GoogleDocsTab';
import GoogleSheetsTab from './components/GoogleSheetsTab';
import OutlookTab from './components/OutlookTab';
import XTab from './components/XTab';
import MemoriesTab from './components/MemoriesTab';
import DocsFeatureTab from './components/DocsFeatureTab';
import SpreadsheetsFeatureTab from './components/SpreadsheetsFeatureTab';
import FoldersFeatureTab from './components/FoldersFeatureTab';
import BrowseFeatureTab from './components/BrowseFeatureTab';
import CalendarFeatureTab from './components/CalendarFeatureTab';
import CanvasFeatureTab from './components/CanvasFeatureTab';
import GmailFeatureTab from './components/GmailFeatureTab';
import MeetingAgentFeatureTab from './components/MeetingAgentFeatureTab';

const Docs = () => {
  const router = useRouter();
  const section = router.query.section as string | undefined;
  const activeSection = section || 'what-is-banbury';

  // Page tracking is handled globally by routeTracking.ts



  return (
    <Box sx={{ 
      overflow: 'visible', 
      background: '#000000', 
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Hero Section */}

            {/* Main Content with Sidebar */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: 'calc(100vh - 200px)', // Subtract hero section height
        height: 'calc(100vh - 200px)',
      }}>
        {/* Sidebar - Fixed position */}
        <DocsSidebar 
          activeSection={activeSection}
        />
        
        {/* Content Area - Scrollable with left margin for fixed sidebar */}
        <Box sx={{ 
          flex: 1, 
          px: { xs: 3, md: 4 }, 
          py: { xs: 4, md: 6 },
          minHeight: 'calc(100vh - 70px)', // Adjust height to account for header
          height: 'calc(100vh - 70px)',
          ml: { xs: 0, md: '280px' }, // Left margin to account for fixed sidebar
          overflowY: 'auto', // Make content scrollable
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
          },
        }}>
          {/* Documentation Content */}
          <Box sx={{ maxWidth: '800px' }}>
            {/* Quick Start Guide Tab */}
            {activeSection === 'what-is-banbury' && (
              <WhatIsBanburyTab />
            )}

            {activeSection === 'features' && (
              <FeaturesTab />
            )}

            {activeSection === 'using-banbury' && (
              <UsingBanburyTab />
            )}

            {activeSection === 'task-studio' && (
              <TaskStudioTab />
            )}

            {activeSection === 'knowledge-graph' && (
              <KnowledgeGraphTab />
            )}

            {activeSection === 'memories' && (
              <MemoriesTab />
            )}

            {activeSection === 'integrations' && (
              <IntegrationsTab />
            )}

            {activeSection === 'gmail' && (
              <GmailTab />
            )}

            {activeSection === 'google-docs' && (
              <GoogleDocsTab />
            )}

            {activeSection === 'google-sheets' && (
              <GoogleSheetsTab />
            )}

            {activeSection === 'outlook' && (
              <OutlookTab />
            )}

            {activeSection === 'x' && (
              <XTab />
            )}

            {activeSection === 'docs-feature' && (
              <DocsFeatureTab />
            )}

            {activeSection === 'spreadsheets-feature' && (
              <SpreadsheetsFeatureTab />
            )}

            {activeSection === 'calendar-feature' && (
              <CalendarFeatureTab />
            )}

            {activeSection === 'folders-feature' && (
              <FoldersFeatureTab />
            )}

            {activeSection === 'browse-feature' && (
              <BrowseFeatureTab />
            )}


            {activeSection === 'canvas-feature' && (
              <CanvasFeatureTab />
            )}

            {activeSection === 'gmail-feature' && (
              <GmailFeatureTab />
            )}

            {activeSection === 'meeting-agent-feature' && (
              <MeetingAgentFeatureTab />
            )}

            {/* Default Tab - Show when no specific tab is selected */}
            {!['what-is-banbury', 'features', 'using-banbury', 'task-studio', 'knowledge-graph', 'memories', 'integrations', 'gmail', 'google-docs', 'google-sheets', 'outlook', 'x', 'docs-feature', 'spreadsheets-feature', 'folders-feature', 'browse-feature', 'calendar-feature', 'canvas-feature', 'gmail-feature', 'meeting-agent-feature'].includes(activeSection) && (
              <WhatIsBanburyTab />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Docs;
