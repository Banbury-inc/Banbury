import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
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
}

const DocsSidebar = ({ activeSection }: DocsSidebarProps): JSX.Element => {
  const router = useRouter();

  const sections: SidebarSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        { id: 'what-is-banbury', title: 'What is Banbury?', href: '/docs/what-is-banbury' },
        { id: 'using-banbury', title: 'Using Banbury', href: '/docs/using-banbury' },
      ]
    },
    {
      id: 'features',
      title: 'Features',
      items: [
        { id: 'features', title: 'Overview', href: '/docs/features' },
        { id: 'gmail-feature', title: 'Gmail', href: '/docs/gmail-feature' },
        { id: 'docs-feature', title: 'Docs', href: '/docs/docs-feature' },
        { id: 'spreadsheets-feature', title: 'Spreadsheets', href: '/docs/spreadsheets-feature' },
        { id: 'calendar-feature', title: 'Calendar', href: '/docs/calendar-feature' },
        { id: 'meeting-agent-feature', title: 'Meetings', href: '/docs/meeting-agent-feature' },
        { id: 'folders-feature', title: 'Folders', href: '/docs/folders-feature' },
        { id: 'browse-feature', title: 'Browse', href: '/docs/browse-feature' },
        { id: 'canvas-feature', title: 'Canvas', href: '/docs/canvas-feature' },
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
        { id: 'x', title: 'X (Twitter)', href: '/docs/x' },
      ]
    },
  ];

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(section => section.id))
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

  const handleItemClick = (itemId: string, href: string) => {
    router.push(href);
  };

  return (
    <Box
      sx={{
        width: { xs: '100%', md: '280px' },
        minWidth: { md: '280px' },
        background: 'rgba(255, 255, 255, 0.02)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        height: 'calc(100vh - 70px)', // Subtract header height
        minHeight: 'calc(100vh - 70px)',
        overflowY: 'auto',
        position: 'fixed',
        left: 0,
        top: '70px', // Start below header
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
      <Box sx={{ p: 2 }}>
        <Typography
          sx={{
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
                        onClick={() => handleItemClick(item.id, item.href)}
                        sx={{
                          borderRadius: '4px',
                          minHeight: '28px',
                          py: 0.5,
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
                              fontSize: '0.75rem',
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
    </Box>
  );
};

export default DocsSidebar;
