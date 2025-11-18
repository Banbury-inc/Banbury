import { Theme, responsiveFontSizes } from '@mui/material';
import { createTheme, ComponentsOverrides } from '@mui/material/styles';

import { light, dark } from './palette';

const getTheme = (mode: string): Theme =>
  responsiveFontSizes(
    createTheme({
      palette: mode === 'light' ? light : dark,
      typography: {
        fontFamily: '"Söhne", sans-serif', // Söhne as the base font
        h1: {
          fontSize: '3.052rem',
          fontWeight: 700, // Bold weight
          lineHeight: 1.167,
          letterSpacing: '-0.01562em',
        },
        h2: {
          fontSize: '2.441rem',
          fontWeight: 700, // Bold weight
          lineHeight: 1.2,
          letterSpacing: '-0.00833em',
        },
        h3: {
          fontSize: '1.953rem',
          fontWeight: 700, // Bold weight
          lineHeight: 1.167,
          letterSpacing: '0em',
        },
        h4: {
          fontSize: '1.563rem',
          fontWeight: 700, // Bold weight
          lineHeight: 1.235,
          letterSpacing: '0.00735em',
        },
        body1: {
          fontFamily: '"Söhne", sans-serif',
          fontSize: '1rem',
          fontWeight: 400, // Regular weight for body text
          lineHeight: 1.5,
          letterSpacing: '0em',
        },
      }, components: {
        MuiButton: {
          styleOverrides: {
            root: {
              fontWeight: 400,
              letterSpacing: '0.0362px',
              borderRadius: 0,
              paddingTop: 10,
              paddingBottom: 10,
              textTransform: 'none',
            },
          } as ComponentsOverrides['MuiButton'],
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: 0,
            },
          } as ComponentsOverrides['MuiInputBase'],
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: 0,
            },
            input: {
              borderRadius: 0,
            },
          } as ComponentsOverrides['MuiOutlinedInput'],
        },
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 0,
            },
          } as ComponentsOverrides['MuiCard'],
        },
      },
    })
  );

export default getTheme;
