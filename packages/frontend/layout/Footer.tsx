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
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        color: 'var(--foreground)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Grid container spacing={4} justifyContent="center" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid item xs={6} md={2}>
          <Typography 
            variant="subtitle1" 
            gutterBottom 
            sx={{
              color: 'var(--muted-foreground)',
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
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'var(--foreground)',
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
              color: 'var(--muted-foreground)',
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
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'var(--foreground)',
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
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'var(--foreground)',
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
              color: 'var(--muted-foreground)',
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
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'var(--foreground)',
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
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'var(--foreground)',
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
              color: 'var(--muted-foreground)',
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
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'var(--foreground)',
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
              color: 'var(--foreground)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: 400,
              '&:hover': {
                color: 'var(--foreground)',
                textDecoration: 'underline',
              },
            }}
          >
            Privacy Policy
          </Link>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 3,
            color: 'var(--muted-foreground)',
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
              color: 'var(--muted-foreground)',
              '&:hover': {
                color: 'var(--foreground)',
                backgroundColor: 'color-mix(in oklch, var(--foreground) 10%, transparent)',
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
              color: 'var(--muted-foreground)',
              '&:hover': {
                color: 'var(--foreground)',
                backgroundColor: 'color-mix(in oklch, var(--foreground) 10%, transparent)',
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
              color: 'var(--muted-foreground)',
              '&:hover': {
                color: 'var(--foreground)',
                backgroundColor: 'color-mix(in oklch, var(--foreground) 10%, transparent)',
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

