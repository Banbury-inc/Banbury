import { Box, Typography, Button, Container, Grid, Paper } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import CloudIcon from '@mui/icons-material/Cloud';
import DevicesIcon from '@mui/icons-material/Devices';
import SecurityIcon from '@mui/icons-material/Security';
import Screenshot1 from '../assets/images/Screenshot1.png';
import { useState, useEffect } from 'react';
import { determineOS } from '../handlers/determineOS';

const Home = (): JSX.Element => {
  const theme = useTheme();
  const [downloadText, setDownloadText] = useState<string>('Download');
  const [downloadUrl, setDownloadUrl] = useState<string>('');

  const features = [
    {
      icon: <CloudIcon sx={{ fontSize: 40 }} />,
      title: 'Cloud Sync',
      description: 'Automatically sync your files across all your devices with AI-powered optimization.'
    },
    {
      icon: <DevicesIcon sx={{ fontSize: 40 }} />,
      title: 'Multi-Device Access',
      description: 'Access your files from any device, anywhere in the world, with seamless integration.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Secure Access',
      description: 'Enterprise-grade security with end-to-end encryption for all your data.'
    }
  ];


  useEffect(() => {
    determineOS(setDownloadText, setDownloadUrl);
  }, []);



  const handleDownload = () => {
    window.open(downloadUrl, '_blank');
  };


  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 4, md: 0 },
        }}
      >
        <Container maxWidth="xl">
          <Grid 
            container 
            spacing={0} 
            alignItems="center"
            sx={{ 
              position: 'relative',
              minHeight: '90vh',
            }}
          >
            {/* Text Content - Left Side */}
            <Grid item xs={12} md={6} sx={{ position: 'relative', zIndex: 2 }}>
              <Box sx={{ pr: { md: 6 }, mb: { xs: 6, md: 0 } }}>
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '3rem', md: '4.5rem' },
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: '#ffffff',
                    mb: 3,
                  }}
                >
                  Any Device,<br />Anywhere
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.5rem', md: '2rem' },
                    fontWeight: 400,
                    color: '#e0e0e0',
                    mb: 3,
                    maxWidth: '600px',
                  }}
                >
                  Tap into your devices&apos; unused resources, regardless of where you are
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: '#a0a0a0',
                    lineHeight: 1.6,
                    mb: 4,
                    maxWidth: '600px',
                  }}
                >
                  Experience the future of cloud services. Secure, private, and intelligent solutions that puts you in control of your data.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleDownload}
                    sx={{
                      borderRadius: '100px',
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      backgroundColor: '#ffffff',
                      color: '#171717',
                      '&:hover': {
                        backgroundColor: '#e0e0e0',
                      },
                    }}
                  >
                  {downloadText}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderRadius: '100px',
                      py: 1.5,
                      px: 4,
                      fontSize: '1.1rem',
                      textTransform: 'none',
                      borderColor: '#ffffff',
                      color: '#ffffff',
                      '&:hover': {
                        borderColor: '#e0e0e0',
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    Learn More
                  </Button>
                </Box>
              </Box>
            </Grid>

            {/* Image - Right Side */}
            <Grid item xs={12} md={6} sx={{ 
              position: 'relative',
              height: { xs: '400px', md: '700px' },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Box
                component="img"
                src={Screenshot1}
                sx={{
                  position: 'absolute',
                  right: { xs: '-20%', md: '-40%' },
                  width: { xs: '120%', md: '140%' },
                  maxWidth: 'none',
                  height: 'auto',
                  borderRadius: '12px',
                  filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.4))',
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: '100%',
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f8f8f8',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f0f0f0',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 2,
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#a0a0a0' : '#666666',
                    lineHeight: 1.6,
                  }}
                >
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              sx={{
                mb: 3,
                fontWeight: 600,
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
              }}
            >
              Ready to get started?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                mb: 4,
                color: theme.palette.mode === 'dark' ? '#a0a0a0' : '#666666',
              }}
            >
              Join thousands of users who trust Banbury Cloud for their device management needs.
            </Typography>
            <Button
              component={Link}
              to="/cloud"
              variant="contained"
              size="large"
              sx={{
                borderRadius: 2,
                py: 1.5,
                px: 6,
                fontSize: '1.1rem',
                textTransform: 'none',
                backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                color: theme.palette.mode === 'dark' ? '#171717' : '#ffffff',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                },
              }}
            >
              Download Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;

