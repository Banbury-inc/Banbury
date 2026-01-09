import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from 'next/router';
import { useState } from 'react';

import DocsSidebar from './components/DocsSidebar';
import WhatIsBanburyTab from './components/Tabs/WhatIsBanburyTab';
import FeaturesTab from './components/Tabs/FeaturesTab';
import UsingBanburyTab from './components/UsingBanbury';
import TaskStudioTab from './components/Tabs/TaskStudioTab';
import KnowledgeGraphTab from './components/Tabs/KnowledgeGraphTab';
import IntegrationsTab from './components/Tabs/IntegrationsTab';
import GmailTab from './components/Tabs/GmailTab';
import GoogleDocsTab from './components/Tabs/GoogleDocsTab';
import GoogleSheetsTab from './components/Tabs/GoogleSheetsTab';
import OutlookTab from './components/Tabs/OutlookTab';
import MicrosoftCalendarTab from './components/Tabs/MicrosoftCalendarTab';
import OneDriveTab from './components/Tabs/OneDriveTab';
import XTab from './components/Tabs/XTab';
import MemoriesTab from './components/Tabs/MemoriesTab';
import DocsFeatureTab from './components/Tabs/DocsFeatureTab';
import SpreadsheetsFeatureTab from './components/Tabs/SpreadsheetsFeatureTab';
import FoldersFeatureTab from './components/Tabs/FoldersFeatureTab';
import BrowseFeatureTab from './components/Tabs/BrowseFeatureTab';
import CalendarFeatureTab from './components/Tabs/CalendarFeatureTab';
import CanvasFeatureTab from './components/Tabs/CanvasFeatureTab';
import GmailFeatureTab from './components/Tabs/GmailFeatureTab';
import MeetingAgentFeatureTab from './components/Tabs/MeetingAgentFeatureTab';
import PowerPointFeatureTab from './components/Tabs/PowerPointFeatureTab'
import ContextWheelTab from './components/Tabs/ContextWheelTab'
import FileSharingTab from './components/Tabs/FileSharingTab'
import BillingTab from './components/Tabs/BillingTab'
import AgentModesTab from './components/Tabs/AgentModesTab'
import ParallelAgentsTab from './components/Tabs/ParallelAgentsTab'
import QueuedMessagesTab from './components/Tabs/QueuedMessagesTab'
import VideoGenerationTab from './components/Tabs/VideoGenerationTab'

const Docs = () => {
  const router = useRouter();
  const section = router.query.section as string | undefined;
  const activeSection = section || 'what-is-banbury';
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMobileToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  return (
    <Box sx={{ 
      overflow: 'visible', 
      background: '#000000', 
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Mobile Menu Button */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' },
        alignItems: 'center',
        px: 2,
        py: 1.5,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(255, 255, 255, 0.02)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <IconButton
          color="inherit"
          aria-label="open navigation menu"
          onClick={handleMobileToggle}
          sx={{ 
            color: '#ffffff',
            mr: 2,
          }}
        >
          <MenuIcon />
        </IconButton>
        <Box 
          component="span" 
          sx={{ 
            color: '#ffffff', 
            fontSize: '0.875rem',
            fontWeight: 500,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Documentation
        </Box>
      </Box>

      {/* Main Content with Sidebar */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: { xs: 'calc(100vh - 120px)', md: 'calc(100vh - 200px)' },
        height: { xs: 'auto', md: 'calc(100vh - 200px)' },
      }}>
        {/* Sidebar - Fixed position on desktop, drawer on mobile */}
        <DocsSidebar 
          activeSection={activeSection}
          mobileOpen={mobileOpen}
          onMobileClose={handleMobileClose}
        />
        
        {/* Content Area - Scrollable with left margin for fixed sidebar */}
        <Box sx={{ 
          flex: 1, 
          px: { xs: 2, sm: 3, md: 4 }, 
          py: { xs: 3, md: 6 },
          minHeight: { xs: 'auto', md: 'calc(100vh - 70px)' },
          height: { xs: 'auto', md: 'calc(100vh - 70px)' },
          ml: { xs: 0, md: '280px' },
          overflowY: { xs: 'visible', md: 'auto' },
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
          <Box sx={{ maxWidth: '900px', mx: 'auto' }}>
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

            {activeSection === 'microsoft-calendar' && (
              <MicrosoftCalendarTab />
            )}

            {activeSection === 'onedrive' && (
              <OneDriveTab />
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

            {activeSection === 'powerpoint-feature' && (
              <PowerPointFeatureTab />
            )}

            {activeSection === 'context-wheel' && (
              <ContextWheelTab />
            )}

            {activeSection === 'file-sharing' && (
              <FileSharingTab />
            )}

            {activeSection === 'billing' && (
              <BillingTab />
            )}

            {activeSection === 'agent-modes' && (
              <AgentModesTab />
            )}

            {activeSection === 'parallel-agents' && (
              <ParallelAgentsTab />
            )}

            {activeSection === 'queued-messages' && (
              <QueuedMessagesTab />
            )}

            {activeSection === 'video-generation' && (
              <VideoGenerationTab />
            )}

            {/* Default Tab - Show when no specific tab is selected */}
            {!['what-is-banbury', 'features', 'using-banbury', 'task-studio', 'knowledge-graph', 'memories', 'integrations', 'gmail', 'google-docs', 'google-sheets', 'outlook', 'microsoft-calendar', 'onedrive', 'x', 'docs-feature', 'spreadsheets-feature', 'folders-feature', 'browse-feature', 'calendar-feature', 'canvas-feature', 'gmail-feature', 'meeting-agent-feature', 'powerpoint-feature', 'context-wheel', 'file-sharing', 'billing', 'agent-modes', 'parallel-agents', 'queued-messages', 'video-generation'].includes(activeSection) && (
              <WhatIsBanburyTab />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Docs;
