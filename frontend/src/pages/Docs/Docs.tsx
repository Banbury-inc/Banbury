import { Box, Typography, Paper, Container } from '@mui/material';
import { useEffect, useState } from 'react';

import DocsSidebar from './components/DocsSidebar';
import { trackPageView } from '../../services/trackingService';
import WhatIsBanburyTab from './components/WhatIsBanburyTab';
import FeaturesTab from './components/FeaturesTab';
import UsingBanburyTab from './components/UsingBanbury';
import TaskStudioTab from './components/TaskStudioTab';

const Docs = (): JSX.Element => {
  const [activeSection, setActiveSection] = useState<string>('what-is-banbury');

  // Track page visit when component mounts
  useEffect(() => {
    trackPageView('/docs');
  }, []);



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
          onSectionChange={setActiveSection}
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

            {/* Default Tab - Show when no specific tab is selected */}
            {!['what-is-banbury', 'features', 'using-banbury', 'task-studio'].includes(activeSection) && (
              <WhatIsBanburyTab />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Docs;
