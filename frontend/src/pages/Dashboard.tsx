import { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/apiService';
import { Thread } from '../components/thread';
import { NavSidebar } from "../components/nav-sidebar";
import { TooltipProvider } from "../components/ui/tooltip";
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';



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
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const runtime = useLocalRuntime({
    async run({ messages }) {
      const lastMessage = messages[messages.length - 1];
      const userContent = lastMessage?.content?.[0]?.type === 'text' 
        ? lastMessage.content[0].text 
        : 'Hello';
      
      return {
        content: [
          {
            type: "text" as const,
            text: `You said: "${userContent}". This is a local runtime response!`,
          },
        ],
      };
    },
  });



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
          navigate('/login');
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
        console.error('Auth check error:', err);
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
          navigate('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchUser();
  }, [navigate]);

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    navigate('/');
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
            <AssistantRuntimeProvider runtime={runtime}>
              <Thread />
            </AssistantRuntimeProvider>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
};
export default Dashboard;