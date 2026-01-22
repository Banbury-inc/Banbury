import { NextRouter } from 'next/router';
import { ApiService } from '../../../../backend/api/apiService';
import { UserInfo } from '../types';

export const checkAuthAndFetchUser = async (
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
  router: NextRouter,
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>,
  triggerSidebarRefresh: () => void
) => {
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
    const firstName = localStorage.getItem('userFirstName') || '';
    const lastName = localStorage.getItem('userLastName') || '';
    const picture = localStorage.getItem('userPicture');
    const basicUserInfo: UserInfo = {
      username: username || 'User',
      email: localStorage.getItem('userEmail') || username || '',
      first_name: firstName,
      last_name: lastName,
      picture: picture || null
    };
    setUserInfo(basicUserInfo);
    
    // Trigger a file refresh after userInfo is set to ensure real files are loaded
    setTimeout(() => {
      triggerSidebarRefresh();
    }, 500);
  } catch (err) {
    // Still try to show basic info if we have some stored data
    const username = localStorage.getItem('authUsername') || localStorage.getItem('username');
    if (username) {
      const firstName = localStorage.getItem('userFirstName') || '';
      const lastName = localStorage.getItem('userLastName') || '';
      const picture = localStorage.getItem('userPicture');
      const basicUserInfo: UserInfo = {
        username: username,
        email: localStorage.getItem('userEmail') || username,
        first_name: firstName,
        last_name: lastName,
        picture: picture || null
      };
      setUserInfo(basicUserInfo);
      
      // Trigger a file refresh here too
      setTimeout(() => {
        triggerSidebarRefresh();
      }, 500);
    } else {
      router.push('/login');
      return;
    }
  } finally {
    setLoading(false);
  }
};
