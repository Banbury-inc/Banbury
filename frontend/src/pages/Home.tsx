import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import backgroundImage from '../assets/images/abstract.png';

const Home = (): JSX.Element => {
  const theme = useTheme();

  return (
    <div
      id="home"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh', // Full viewport height to center vertically
        width: '100vw',  // Full viewport width to center horizontally
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '45vh',
          width: '60%',
          backgroundSize: 'cover',
          backgroundColor: 'white',
          backgroundPosition: 'center',
          textAlign: 'center',
          color: theme.palette.text.primary,
          borderRadius: '20px',
          overflow: 'hidden',
        }}
      >
        <Box>
          <Typography
            variant='h2'
            sx={{
              fontWeight: 400,
              marginBottom: theme.spacing(2),
              color: '#171717',
            }}
          >
            Banbury Cloud on your desktop
          </Typography>
          <Typography
            variant='h6'
            sx={{
              marginBottom: theme.spacing(4),
              // color: '#212121',
              color: '#171717',
            }}
          >
            Seamlessly access your devices from anywhere in the world
          </Typography>
          <Button variant='contained' color='inherit' href='/Cloud'
            sx={{

              borderRadius: '20px',
            }}

          >
            Learn more
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default Home;

