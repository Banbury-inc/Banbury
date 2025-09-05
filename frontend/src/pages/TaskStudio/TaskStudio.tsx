
import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { NavSidebar } from "../../components/nav-sidebar";
import { TooltipProvider } from "../../components/ui/tooltip";
import { Button } from "../../components/ui/button";
import { ApiService } from "../../services/apiService";
import { TaskScheduler } from "./components/TaskScheduler";
import { TaskTable } from "./components/TaskTable";

interface UserInfo {
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  picture?: any;
  phone_number?: string;
  auth_method?: string;
}



const TaskStudio = (): JSX.Element => {
  const theme = useTheme();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showTaskScheduler, setShowTaskScheduler] = useState(false);

  



  useEffect(() => {
    // Ensure dark mode is enabled
    window.localStorage.setItem('themeMode', 'dark');
    
    const checkAuthAndFetchUser = async () => {
      try {
        setLoading(true);

        // If no token, go to login immediately
        const existingToken = localStorage.getItem('authToken');
        if (!existingToken) {
          router.push('/login');
          return;
        }

        // Optimistically set basic user info from storage
        const storedUsername = localStorage.getItem('username');
        const basicUserInfo: UserInfo = {
          username: storedUsername || 'User',
          email: localStorage.getItem('userEmail') || storedUsername || '',
          first_name: '',
          last_name: '',
          picture: null
        };
        setUserInfo(basicUserInfo);

        // Validate token in background and try refresh if needed
        let isValid = await ApiService.validateToken();
        if (!isValid) {
          const refreshed = await ApiService.refreshToken();
          if (!refreshed) {
            router.push('/login');
            return;
          }
          isValid = await ApiService.validateToken();
          if (!isValid) {
            router.push('/login');
            return;
          }
        }
      } catch {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
          const fallbackUser: UserInfo = {
            username: storedUsername,
            email: localStorage.getItem('userEmail') || storedUsername,
            first_name: '',
            last_name: '',
            picture: null
          };
          setUserInfo(fallbackUser);
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

  const handleTaskCreated = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowTaskScheduler(false); // Hide the scheduler after task is created
  };

  const toggleTaskScheduler = () => {
    setShowTaskScheduler(prev => !prev);
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
        <div className="flex-1 flex overflow-hidden pl-10">
          {/* Left Side - Task Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header with Create Task Button */}
            <div className="bg-background border-b border-border px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground pl-4">Task Studio</h1>
                <Button 
                  onClick={toggleTaskScheduler}
                  variant={showTaskScheduler ? "outline" : "default"}
                >
                  {showTaskScheduler ? 'Cancel' : 'Create Task'}
                </Button>
              </div>
            </div>

            {/* Task Table - Full Height */}
            <div className="flex-1 overflow-auto pl-6">
              <TaskTable refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* Right Side - Task Scheduler */}
          <div className={`transition-all duration-300 ease-in-out ${
            showTaskScheduler 
              ? 'w-96 opacity-100' 
              : 'w-0 opacity-0'
          } overflow-hidden`}>
            <div className="w-96 border-l border-border bg-background flex flex-col h-full">
              <div className="p-5 border-b border-border flex-shrink-0">
                <h2 className="text-lg font-semibold text-foreground">Create New Task</h2>
              </div>
              <div className="flex-1 overflow-auto p-6">
                <TaskScheduler onTaskCreated={handleTaskCreated} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
export default TaskStudio;