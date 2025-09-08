import { Box, Typography, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { useState } from 'react';

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
  onSectionChange?: (sectionId: string) => void;
}

const DocsSidebar = ({ activeSection, onSectionChange }: DocsSidebarProps): JSX.Element => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']));

  const sections: SidebarSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        { id: 'quick-start', title: 'What is Banbury?', href: '#quick-start' },
        { id: 'features', title: 'Features', href: '#features' },
        { id: 'using-banbury', title: 'Using Banbury', href: '#using-banbury' },
        { id: 'task-studio', title: 'Task Studio', href: '#task-studio' },
      ]
    },
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleItemClick = (sectionId: string, itemId: string) => {
    if (onSectionChange) {
      onSectionChange(itemId);
    }
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
      <Box sx={{ p: 3 }}>
        <Typography
          sx={{
            fontSize: '1.1rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 3,
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
                  mb: 1,
                }}
              >
                <ListItemButton
                  onClick={() => toggleSection(section.id)}
                  sx={{
                    borderRadius: '8px',
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
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: '#ffffff',
                        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      color: '#a1a1aa',
                      fontSize: '0.8rem',
                      transform: expandedSections.has(section.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    ›
                  </Typography>
                </ListItemButton>
              </ListItem>
              
              {expandedSections.has(section.id) && (
                <List sx={{ pl: 2, pb: 1 }}>
                  {section.items.map((item) => (
                    <ListItem key={item.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleItemClick(section.id, item.id)}
                        sx={{
                          borderRadius: '6px',
                          minHeight: '36px',
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
                              fontSize: '0.8rem',
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
