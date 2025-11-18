import { PaletteMode } from '@mui/material';
import { green, orange } from '@mui/material/colors';

export const light = {
  mode: 'light' as PaletteMode,
  primary: {
    main: 'rgb(129, 187, 89)',
    contrastText: 'rgb(100, 101, 98)',
  },
  success: {
    main: 'rgb(111, 214, 145)',
    light: 'rgb(131, 231, 168)',
    dark: green[600],
  },
  text: {
    primary: 'rgb(40, 40, 40)',
    secondary: 'rgb(103, 119, 136)',
  },
  background: {
    paper: 'rgb(242, 243, 245)',
    default: 'rgb(255, 255, 255)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',

};

export const dark = {
  mode: 'dark' as PaletteMode,
  primary: {
    main: '#FFFFFF', // Updated to match Material UI's primary blue color
    light: '#FFFFFF', // Updated to match Material UI's primary blue color
    dark: '#FFFFFF', // Updated to match Material UI's primary blue color
    contrastText: 'rgb(100, 101, 98)',
  },
    secondary: {
      main: '#000000', // Updated to match Material UI's secondary pink color
      light: '#000000', // Updated to match Material UI's secondary pink color
      dark: '#000000', // Updated to match Material UI's secondary pink color
    },
  warning: {
    main: 'rgb(242, 175, 87)',
    light: 'rgb(245, 205, 130)',
    dark: orange[600],
  },
  text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3', //ray for less important text, adjust as needed
  },
  background: {
      default: '#212121', // Slightly lighter for elements considered "paper"
      paper: '#171717', // Very dark gray, almost black, as the main background
 
  },
  divider: '#424242',
};
