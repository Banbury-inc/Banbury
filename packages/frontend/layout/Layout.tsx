import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import NoSsr from '@mui/material/NoSsr';
import { useTheme } from '@mui/material/styles';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Zoom from '@mui/material/Zoom';
import React from 'react';

import Footer from './Footer';
import Header from './Header';

interface Props {
  children: React.ReactNode;
}

const Layout = ({ children }: Props): JSX.Element => {
  const theme = useTheme();

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 100,
  });

  const scrollTo = (id: string): void => {
    setTimeout(() => {
      const element = document.querySelector(`#${id}`) as HTMLElement;
      if (!element) {
        return;
      }
      window.scrollTo({ left: 0, top: element.offsetTop, behavior: 'smooth' });
    });
  };

  return (
    <Box
      id='page-top'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: theme.palette.background.default,
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          margin: '0 auto',
          background: '#000000',
        }}
      >
        {children}
      </Box>
      <Footer />
      <NoSsr>
        <Zoom in={trigger}>
          <Box
            onClick={() => scrollTo('page-top')}
            role='presentation'
            sx={{ position: 'fixed', bottom: 24, right: 32 }}
          >
            <Fab
              color='primary'
              size='small'
              aria-label='scroll back to top'
              sx={{
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.04)',
                color: theme.palette.text.primary,
                border: theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(0, 0, 0, 0.08)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <KeyboardArrowUpIcon />
            </Fab>
          </Box>
        </Zoom>
      </NoSsr>
    </Box>
  );
};

export default Layout;
