import React from 'react';
import { Box, Typography, Link, Grid, IconButton } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';

import { useTheme } from '@mui/material/styles';

const Footer: React.FC = () => {

  const theme = useTheme();
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={6} md={2}>
          <Typography variant="subtitle1" gutterBottom color={theme.palette.text.secondary}>
            Our research
          </Typography>
          <Link href="#" color="inherit" underline="hover">
            Overview
          </Link>
          <br />
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography variant="subtitle1" gutterBottom color={theme.palette.text.secondary}>
            Banbury Cloud
          </Typography>
          <Link href="#" color="inherit" underline="hover">
            For Everyone
          </Link>
          <br />
          <Link href="#" color="inherit" underline="hover">
            Download
          </Link>
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography variant="subtitle1" gutterBottom color={theme.palette.text.secondary}>
            Company
          </Typography>
          <Link href="/About" color="inherit" underline="hover">
            About us
          </Link>
          <br />
          <Link href="/News" color="inherit" underline="hover">
            News
          </Link>
          <br />
        </Grid>
        <Grid item xs={6} md={2}>
          <Typography variant="subtitle1" gutterBottom color={theme.palette.text.secondary}>
            Terms & policies
          </Typography>
          <Link href="/Terms_of_use" color="inherit" underline="hover">
            Terms of use
          </Link>
          <br />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          © 2024 Banbury. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton
            component="a"
            href="https://www.x.com/banbury_io"
            target="_blank"
            rel="noopener"
            color="inherit"
          >
            <XIcon />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.linkedin.com/company/banburyinnovationsinc"
            target="_blank"
            rel="noopener"
            color="inherit"
          >
            <LinkedInIcon />
          </IconButton>
          <IconButton
            component="a"
            href="https://github.com/Banbury-inc"
            target="_blank"
            rel="noopener"
            color="inherit"
          >
            <GitHubIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;

