import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import CustomButton from '../components/CustomButton';

const Header = (): JSX.Element => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUsername = localStorage.getItem('username');
    
    if (token && storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
    } else {
      setIsLoggedIn(false);
      setUsername('');
    }
  }, []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUsername('');
    handleMenuClose();
    navigate('/');
  };

  const handleDashboard = () => {
    handleMenuClose();
    navigate('/dashboard');
  };

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
          <CustomButton href='/Features' text='Features' />
          {/* <CustomButton href='/filedownload/mmills/67659e872b46a3ef70402ead' text='File Download' /> */}
          {/* <CustomButton href='/NeuraNet' text='NeuraNet' /> */}
          {/* <CustomButton href='/Research' text='Research' /> */}
          <CustomButton href='/News' text='News' />
          <CustomButton href='/api' text='API' />
          <CustomButton href='/task-studio' text='Task Studio' />
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#a0a0a0' : '#666666',
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  Welcome,
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                    fontWeight: 500,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {username}
                </Typography>
              </Box>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  p: 0.5,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#171717'
                  }}
                >
                  <PersonIcon sx={{ fontSize: 20 }} />
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#333333' : '#e0e0e0'}`,
                    mt: 1
                  }
                }}
              >
                <MenuItem onClick={handleDashboard}>
                  <DashboardIcon sx={{ mr: 1, fontSize: 18 }} />
                  Dashboard
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1, fontSize: 18 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              sx={{
                borderRadius: '20px',
                textTransform: 'none',
                paddingX: 3,
                paddingY: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : '#171717',
                color: theme.palette.mode === 'dark' ? '#171717' : '#ffffff',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#e0e0e0' : '#333333',
                },
              }}
            >
              Login
            </Button>
          )}
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
