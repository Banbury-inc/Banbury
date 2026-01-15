import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import { useRouter } from 'next/router';

interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
}

interface SidebarItem {
  id: string;
  title: string;
  href: string;
}

interface DocsSidebarProps {
  activeSection?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const DocsSidebar = ({ activeSection, mobileOpen = false, onMobileClose }: DocsSidebarProps): JSX.Element => {
  const router = useRouter();

  const sections: SidebarSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        { id: 'what-is-banbury', title: 'What is Banbury?', href: '/docs/what-is-banbury' },
        { id: 'using-banbury', title: 'Using Banbury', href: '/docs/using-banbury' },
        { id: 'desktop-app', title: 'Desktop App', href: '/docs/desktop-app' },
      ]
    },
    {
      id: 'features',
      title: 'Features',
      items: [
        { id: 'features', title: 'Overview', href: '/docs/features' },
        { id: 'agent-modes', title: 'Agent Modes', href: '/docs/agent-modes' },
        { id: 'parallel-agents', title: 'Parallel Agents', href: '/docs/parallel-agents' },
        { id: 'queued-messages', title: 'Queued Messages', href: '/docs/queued-messages' },
        { id: 'video-generation', title: 'Video Generation', href: '/docs/video-generation' },
        { id: 'gmail-feature', title: 'Gmail', href: '/docs/gmail-feature' },
        { id: 'docs-feature', title: 'Docs', href: '/docs/docs-feature' },
        { id: 'spreadsheets-feature', title: 'Spreadsheets', href: '/docs/spreadsheets-feature' },
        { id: 'powerpoint-feature', title: 'PowerPoint', href: '/docs/powerpoint-feature' },
        { id: 'context-wheel', title: 'Context Wheel', href: '/docs/context-wheel' },
        { id: 'calendar-feature', title: 'Calendar', href: '/docs/calendar-feature' },
        { id: 'meeting-agent-feature', title: 'Meetings', href: '/docs/meeting-agent-feature' },
        { id: 'folders-feature', title: 'Folders', href: '/docs/folders-feature' },
        { id: 'browse-feature', title: 'Browse', href: '/docs/browse-feature' },
        { id: 'canvas-feature', title: 'Canvas', href: '/docs/canvas-feature' },
        { id: 'file-sharing', title: 'File Sharing', href: '/docs/file-sharing' },
      ]
    },
    {
      id: 'contextual-knowledge',
      title: 'Contextual Knowledge',
      items: [
        { id: 'knowledge-graph', title: 'Knowledge Graph', href: '/docs/knowledge-graph' },
        { id: 'memories', title: 'Memories', href: '/docs/memories' },
      ]
    },
    {
      id: 'automating-workflows',
      title: 'Automating Workflows',
      items: [
        { id: 'task-studio', title: 'Task Studio', href: '/docs/task-studio' },
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      items: [
        { id: 'integrations', title: 'Overview', href: '/docs/integrations' },
        { id: 'gmail', title: 'Gmail', href: '/docs/gmail' },
        { id: 'google-docs', title: 'Google Docs', href: '/docs/google-docs' },
        { id: 'google-sheets', title: 'Google Sheets', href: '/docs/google-sheets' },
        { id: 'outlook', title: 'Outlook', href: '/docs/outlook' },
        { id: 'microsoft-calendar', title: 'Microsoft Calendar', href: '/docs/microsoft-calendar' },
        { id: 'onedrive', title: 'OneDrive', href: '/docs/onedrive' },
        { id: 'x', title: 'X (Twitter)', href: '/docs/x' },
      ]
    },
    {
      id: 'account',
      title: 'Account',
      items: [
        { id: 'billing', title: 'Billing', href: '/docs/billing' },
      ]
    },
  ];

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['account', ...sections.map(section => section.id)])
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (href: string) => {
    router.push(href);
    if (onMobileClose) onMobileClose();
  };

  const sidebarContent = (
    <Box sx={{ p: 2 }}>
      {/* Mobile header with close button */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' }, 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: '#ffffff',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Documentation
        </Typography>
        <IconButton 
          onClick={onMobileClose}
          sx={{ color: '#ffffff' }}
          aria-label="close menu"
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      {/* Desktop title */}
      <Typography
        sx={{
          display: { xs: 'none', md: 'block' },
          fontSize: '1rem',
          fontWeight: 600,
          color: '#ffffff',
          mb: 1.5,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Documentation
      </Typography>
      
      <List sx={{ p: 0 }}>
        {sections.map((section) => (
          <Box key={section.id}>
            <ListItem
              disablePadding
              sx={{
                mb: 0.5,
              }}
            >
              <ListItemButton
                onClick={() => toggleSection(section.id)}
                sx={{
                  borderRadius: '6px',
                  py: 0.75,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                  '&.Mui-selected': {
                    background: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                <ListItemText
                  primary={section.title}
                  primaryTypographyProps={{
                    sx: {
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: '#ffffff',
                      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    },
                  }}
                />
                <Typography
                  sx={{
                    color: '#a1a1aa',
                    fontSize: '0.75rem',
                    transform: expandedSections.has(section.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  ›
                </Typography>
              </ListItemButton>
            </ListItem>
            
            {expandedSections.has(section.id) && (
              <List sx={{ pl: 1.5, pb: 0.5 }}>
                {section.items.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton
                      onClick={() => handleItemClick(item.href)}
                      sx={{
                        borderRadius: '4px',
                        minHeight: '36px',
                        py: { xs: 1, md: 0.5 },
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.03)',
                        },
                        '&.Mui-selected': {
                          background: 'rgba(255, 255, 255, 0.06)',
                        },
                      }}
                      selected={activeSection === item.id}
                    >
                      <ListItemText
                        primary={item.title}
                        primaryTypographyProps={{
                          sx: {
                            fontSize: { xs: '0.875rem', md: '0.75rem' },
                            color: activeSection === item.id ? '#ffffff' : '#a1a1aa',
                            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                            fontWeight: activeSection === item.id ? 500 : 400,
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: '280px',
            background: '#0a0a0a',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Desktop Sidebar - Fixed */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          width: '280px',
          minWidth: '280px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          height: 'calc(100vh - 70px)',
          minHeight: 'calc(100vh - 70px)',
          overflowY: 'auto',
          position: 'fixed',
          left: 0,
          top: '70px',
          zIndex: 1000,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
          },
        }}
      >
        {sidebarContent}
      </Box>
    </>
  );
};

export default DocsSidebar;
