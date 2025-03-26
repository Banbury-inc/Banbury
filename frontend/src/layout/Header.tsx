import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import CustomButton from '../components/CustomButton';

interface Props {
  onSidebarOpen: () => void;
}

const Header = ({ onSidebarOpen }: Props): JSX.Element => {
  const theme = useTheme();

  return (
    <>
      <Toolbar sx={{ minHeight: 70, display: 'flex', justifyContent: 'space-between' }}>
        <Link href='/' sx={{ textDecoration: 'none', marginRight: 'auto' }}>
          <IconButton size='large' disabled>
            {/* <StormIcon */}
            {/*   sx={{ */}
            {/*     color: */}
            {/*       theme.palette.mode === 'dark' */}
            {/*         ? theme.palette.primary.main */}
            {/*         : theme.palette.success.dark, */}
            {/*     height: 40, */}
            {/*     width: 40, */}
            {/*   }} */}
            {/* /> */}
            <Typography
              variant='h6'
              sx={{
                color: theme.palette.text.primary,
                // fontWeight: 'bold',
                // textTransform: 'uppercase',
                marginLeft: '10px',
              }}
            >
              Banbury
            </Typography>
          </IconButton>
        </Link>


        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <CustomButton href='/' text='Home' />
          <CustomButton href='/Cloud' text='Cloud' />
          {/* <CustomButton href='/filedownload/mmills/67659e872b46a3ef70402ead' text='File Download' /> */}
          {/* <CustomButton href='/NeuraNet' text='NeuraNet' /> */}
          {/* <CustomButton href='/Research' text='Research' /> */}
          <CustomButton href='/News' text='News' />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ width: 48 }} />
          {/* Placeholder for right-aligned items if necessary */}
        </Box>



        {/* </Box> */}

        {/* <Divider */}
        {/*   orientation='vertical' */}
        {/*   sx={{ */}
        {/*     height: 32, */}
        {/*     marginX: 2, */}
        {/*     display: { lg: 'flex', md: 'none', xs: 'none' }, */}
        {/*   }} */}
        {/* /> */}


        {/* <Box sx={{ display: 'flex' }}> */}
        {/*   <IconButton */}
        {/*     onClick={colorMode.toggleColorMode} */}
        {/*     aria-label='Theme Mode' */}
        {/*     color={theme.palette.mode === 'dark' ? 'warning' : 'inherit'} */}
        {/*   > */}
        {/*     {theme.palette.mode === 'dark' ? ( */}
        {/*       <Tooltip title='Turn on the light'> */}
        {/*         <LightModeIcon fontSize='medium' /> */}
        {/*       </Tooltip> */}
        {/*     ) : ( */}
        {/*       <Tooltip title='Turn off the light'> */}
        {/*         <DarkModeIcon fontSize='medium' /> */}
        {/*       </Tooltip> */}
        {/*     )} */}
        {/*   </IconButton> */}
        {/* </Box> */}
        {/*   <Button */}
        {/*     onClick={() => onSidebarOpen()} */}
        {/*     aria-label='Menu' */}
        {/*     variant='outlined' */}
        {/*     sx={{ */}
        {/*       borderRadius: 0, */}
        {/*       minWidth: 'auto', */}
        {/*       padding: 1, */}
        {/*       borderColor: alpha(theme.palette.divider, 0.2), */}
        {/*     }} */}
        {/*   > */}
        {/*     <MenuIcon */}
        {/*       sx={{ */}
        {/*         color: */}
        {/*           theme.palette.mode === 'dark' */}
        {/*             ? theme.palette.primary.main */}
        {/*             : theme.palette.success.dark, */}
        {/*       }} */}
        {/*     /> */}
        {/*   </Button> */}
      </Toolbar>
    </>
  );
};

export default Header;
