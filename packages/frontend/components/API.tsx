import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import axios from 'axios';
import yaml from 'js-yaml';
import React, { useState, useEffect } from 'react';

interface AboutProps {
  value: number;
  suffix: string;
  description: string;
}

interface APIInfo {
  title: string;
  version: string;
  description: string;
}

interface APIResponse {
  description: string;
}

interface APIMethod {
  description: string;
  responses: Record<string, APIResponse>;
}

interface APIPath {
  [method: string]: APIMethod;
}

interface APIData {
  info: APIInfo;
  paths: Record<string, APIPath>;
}

// Type for grouped paths
interface GroupedPaths {
  [groupName: string]: string[];
}

// Common scrollbar styling
const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#2B2C2F', // Background of the scrollbar track
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#555',    // Color of the scrollbar thumb
    borderRadius: '4px',       // Rounded corners for the thumb
    '&:hover': {
      backgroundColor: '#777', // Slightly lighter on hover
    },
  },
};

const About = (): JSX.Element => {
  const theme = useTheme();

  const [apiData, setApiData] = useState<APIData | null>(null);
  const [groupedPaths, setGroupedPaths] = useState<GroupedPaths>({}); // State for grouped paths

  const fetchAbout = () => {
    axios
      .get<AboutProps[]>('http://127.0.0.1:8000/about', {
        headers: {
          Accept: 'application/json',
        },
      })
      .catch((error) => console.log(error));
  };

  useEffect(() => {
    fetchAbout();
  }, []);

  useEffect(() => {
    const fetchYaml = async () => {
      try {
        const response = await fetch('/Banbury_API.yaml');
        const text = await response.text();
        const data = yaml.load(text) as APIData;
        console.log('Parsed API Data:', data);
        setApiData(data);

        // Group paths after fetching data
        const groups: GroupedPaths = {};
        Object.keys(data.paths).forEach((path) => {
          const segments = path.split('/').filter(Boolean); // Split and remove empty strings
          const groupName = segments.length > 0 ? segments[0] : 'General'; // Use first segment or 'General'
          if (!groups[groupName]) {
            groups[groupName] = [];
          }
          groups[groupName].push(path);
        });
        // Sort groups alphabetically, put 'General' first if it exists
        const sortedGroupNames = Object.keys(groups).sort((a, b) => {
          if (a === 'General') return -1;
          if (b === 'General') return 1;
          return a.localeCompare(b);
        });
        const sortedGroups: GroupedPaths = {};
        sortedGroupNames.forEach(name => { sortedGroups[name] = groups[name]; });

        setGroupedPaths(sortedGroups);

      } catch (error) {
        console.error('Error loading YAML:', error);
      }
    };
    
    fetchYaml();
  }, []);

  // Function to generate valid HTML IDs from paths
  const generateIdFromPath = (path: string) => {
    return `endpoint-${path.replace(/[^a-zA-Z0-9]/g, '-')}`;
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Sidebar Navigation */}
      {apiData && (
        <Box 
          sx={{
            width: '280px',
            flexShrink: 0,
            backgroundColor: '#212121',
            borderRight: '1px solid #444',
            height: '100vh',
            position: 'sticky',
            top: 0,
            overflowY: 'auto',
            ...scrollbarStyles, // Apply common scrollbar styles
          }}
        >
          <List sx={{ paddingTop: '10px' }}>
            {Object.entries(groupedPaths).map(([groupName, paths]) => (
              <React.Fragment key={groupName}> {/* Use Fragment to wrap section */}
                <ListSubheader 
                  sx={{ 
                    backgroundColor: '#212121', 
                    color: '#FFFFFF', 
                    fontWeight: 'bold', 
                    textTransform: 'capitalize', 
                    paddingTop: '10px',
                    paddingBottom: '5px',
                    fontSize: '0.9rem' // Slightly smaller header
                  }}
                >
                  {groupName}
                </ListSubheader>
                {paths.map((path) => (
                  <ListItem key={path} disablePadding>
                    <ListItemButton 
                      component="a" 
                      href={`#${generateIdFromPath(path)}`} 
                      sx={{
                        paddingLeft: 3, 
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        },
                        color: '#B0B1B4'
                      }}
                    >
                      <ListItemText 
                        primary={path} 
                        sx={{ 
                          wordBreak: 'break-all', 
                          whiteSpace: 'normal'   
                        }}
                        primaryTypographyProps={{ 
                          fontSize: '0.75rem', // Smaller path text
                          fontFamily: 'monospace'
                        }}/>
                    </ListItemButton>
                  </ListItem>
                ))}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* Main Content Area */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          padding: 4, 
          overflowY: 'auto', 
          backgroundColor: '#212121',
          ...scrollbarStyles, // Apply common scrollbar styles
        }}
      >
        {/* Add smooth scrolling behavior */}
        <style>{`html { scroll-behavior: smooth; }`}</style>

        {/* API Documentation Section - Styled like OpenAI */}
        {apiData && (
          <Box marginTop={4} /* Adjusted margin */>
            <Typography
              variant='h5' // Smaller main title (was h4)
              align='left'
              color='#FFFFFF'
              fontWeight={600}
              gutterBottom
              sx={{ marginBottom: 1 }}
            >
              {apiData.info.title}
            </Typography>
            <Typography
              variant='body2' // Smaller description text (was body1)
              align='left'
              color='#B0B1B4'
              gutterBottom
              sx={{ marginBottom: 4 }}
            >
              Version: {apiData.info.version} - {apiData.info.description}
            </Typography>

            <Container maxWidth="lg" sx={{ padding: 0 }}> {/* Remove default container padding */}
              {Object.entries(apiData.paths).map(([path, methods]) => (
                // Add ID to this wrapper Box for navigation
                <Box key={path} id={generateIdFromPath(path)} sx={{ marginBottom: 4 }}> 
                  <Card sx={{ 
                    overflow: 'visible',
                    backgroundColor: '#2c2c2c', // Card background slightly darker
                    border: '1px solid #444', 
                    borderRadius: '8px' 
                    }}>
                    <Box sx={{ backgroundColor: '#1c1c1c', padding: '10px 16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}> {/* Reduced padding */}
                      <Typography variant="subtitle1" /* Smaller endpoint path (was h6) */ color="#FFFFFF" sx={{ fontFamily: 'monospace' }}>
                        {path}
                      </Typography>
                    </Box>
                    
                    <CardContent sx={{ padding: '16px' }}>
                      {Object.entries(methods).map(([method, details]) => (
                        <Box key={method} sx={{ marginBottom: 2.5, paddingBottom: 1.5, borderBottom: '1px solid #444', ':last-child': { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } }}> {/* Adjusted spacing */}
                          <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 1 }}>
                            <Typography 
                              component="span" 
                              sx={{
                                backgroundColor: method.toLowerCase() === 'get' ? '#10A37F' : method.toLowerCase() === 'post' ? '#FA6C17' : '#0A84FF',
                                color: 'white',
                                padding: '3px 6px', // Reduced padding
                                borderRadius: '4px',
                                fontSize: '0.75rem', // Smaller badge text
                                fontWeight: 'bold',
                                marginRight: 1.5 // Adjusted margin
                              }}
                            >
                              {method.toUpperCase()}
                            </Typography>
                            <Typography variant="body2" color="#E1E1E3"> {/* Smaller description (was body1) */}
                              {details.description}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ marginLeft: '58px' /* Adjusted indent */ }}>
                            <Typography variant="caption" /* Smaller responses title (was subtitle2) */ color="#B0B1B4" sx={{ marginBottom: 0.5, display:'block' }}>Responses:</Typography>
                            {Object.entries(details.responses).map(([status, response]) => (
                               <Box key={status} sx={{ display: 'flex', alignItems: 'center', marginBottom: 0.25 }}>
                                  <Typography 
                                    variant="caption" // Smaller status/response text (was body2)
                                    color="#E1E1E3" 
                                    sx={{ fontFamily: 'monospace', minWidth: '35px', marginRight: 1 }}
                                  >
                                    {status}
                                  </Typography>
                                  <Typography variant="caption" /* Smaller status/response text (was body2) */ color="#B0B1B4">
                                    {response.description}
                                  </Typography>
                               </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Container>
          </Box>
        )}

        {/* Original About cards section - commented out for focus on API docs */}
        {/* 
        <Container sx={{ marginTop: 8 }}>
          <Grid container spacing={4}>
            {about.map((item, i) => (
              <Grid item xs={12} md={4} key={i}>
                ...
              </Grid>
            ))}
          </Grid>
        </Container> 
        */}
      </Box>
    </Box>
  );
};

export default About;
