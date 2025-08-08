import { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { ApiService } from '../services/apiService';
import { Thread } from '../components/thread';
import { NavSidebar } from "../components/nav-sidebar";
import { TooltipProvider } from "../components/ui/tooltip";
 



interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}



const Dashboard = (): JSX.Element => {
  const theme = useTheme();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  



  useEffect(() => {
    // Ensure dark mode is enabled
    window.localStorage.setItem('themeMode', 'dark');
    
    const checkAuthAndFetchUser = async () => {
      try {
        setLoading(true);
        
        // Validate token first using ApiService
        const isValidToken = await ApiService.validateToken();

        if (!isValidToken) {
          // Token is invalid, redirect to login
          router.push('/login');
          return;
        }

        // Token is valid, create user info from stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        const basicUserInfo: UserInfo = {
          username: username || 'User',
          email: localStorage.getItem('userEmail') || username || '',
          first_name: '',
          last_name: '',
          picture: null
        };
        setUserInfo(basicUserInfo);
      } catch (err) {
        
        // Still try to show basic info if we have some stored data
        const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
        if (username) {
          const basicUserInfo: UserInfo = {
            username: username,
            email: localStorage.getItem('userEmail') || username,
            first_name: '',
            last_name: '',
            picture: null
          };
          setUserInfo(basicUserInfo);
        } else {
          router.push('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [router]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
  };



  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#f5f5f5'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }



  return (
    <TooltipProvider>
      <div className="flex h-screen">
        {/* Navigation Sidebar */}
        <NavSidebar onLogout={handleLogout} />
        
        {/* Main Content Area */}
        <div className="flex flex-1 ml-16 with-nav-sidebar bg-black">
          <main className="flex-1">
            <Thread />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
export default Dashboard;