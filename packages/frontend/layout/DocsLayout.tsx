import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import NoSsr from '@mui/material/NoSsr';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import Zoom from '@mui/material/Zoom';
import React from 'react';

import Header from './Header';

interface Props {
  children: React.ReactNode;
}

const DocsLayout = ({ children }: Props): JSX.Element => {
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
        background: '#000000',
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {children}
      </Box>
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
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
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

export default DocsLayout;
