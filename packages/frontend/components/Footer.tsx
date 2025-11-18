
// src/layout/Footer.tsx
import { Box, Typography } from '@mui/material';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        textAlign: 'center',
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Typography variant="body2">
        © 2024 Banbury. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
