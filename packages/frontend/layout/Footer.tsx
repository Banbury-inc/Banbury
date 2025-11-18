import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box, Typography, Link, Grid, IconButton } from '@mui/material';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 6,
        background: '#000000',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
      }}
    >
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={6} md={2}>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{
              color: '#a1a1aa',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Our research
          </Typography>
          <Link 
            href="#" 
            sx={{
              color: '#d4d4d8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'underline',
              },
            }}
          >
            Overview
          </Link>
          <br />
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{
              color: '#a1a1aa',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Banbury Cloud
          </Typography>
          <Link 
            href="#" 
            sx={{
              color: '#d4d4d8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'underline',
              },
            }}
          >
            For Everyone
          </Link>
          <br />
          <Link 
            href="#" 
            sx={{
              color: '#d4d4d8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'underline',
              },
            }}
          >
            Download
          </Link>
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{
              color: '#a1a1aa',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Company
          </Typography>
          <Link 
            href="/About" 
            sx={{
              color: '#d4d4d8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'underline',
              },
            }}
          >
            About us
          </Link>
          <br />
          <Link 
            href="/News" 
            sx={{
              color: '#d4d4d8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'underline',
              },
            }}
          >
            News
          </Link>
          <br />
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{
              color: '#a1a1aa',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Terms & policies
          </Typography>
          <Link 
            href="/Terms_of_use" 
            sx={{
              color: '#d4d4d8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'underline',
              },
            }}
          >
            Terms of use
          </Link>
          <br />
          <Link 
            href="/privacy_policy" 
            sx={{
              color: '#d4d4d8',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: '#ffffff',
                textDecoration: 'underline',
              },
            }}
          >
            Privacy Policy
          </Link>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3,
            color: '#a1a1aa',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontWeight: 400,
            fontSize: '0.875rem',
          }}
        >
          © 2024 Banbury. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
          <IconButton
            component="a"
            href="https://www.x.com/banbury_io"
            target="_blank"
            rel="noopener"
            sx={{
              color: '#71717a',
              '&:hover': {
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <TwitterIcon />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.linkedin.com/company/banburyinnovationsinc"
            target="_blank"
            rel="noopener"
            sx={{
              color: '#71717a',
              '&:hover': {
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton
            component="a"
            href="https://github.com/Banbury-inc"
            target="_blank"
            rel="noopener"
            sx={{
              color: '#71717a',
              '&:hover': {
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <GitHubIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;

