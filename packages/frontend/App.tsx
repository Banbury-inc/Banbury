import { useEffect } from 'react';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import API from './components/API';
import Features from './components/Features';
import News from './components/News';
import Privacy_Policy from './components/Privacy_Policy';
import Terms_of_use from './components/Terms_of_use';
import { ThemeProvider } from './components/ThemeProvider';
import Layout from './layout/Layout';
import Admin from './pages/Admin/Admin';
import AuthCallback from './pages/AuthCallback';
import FileDownload from './pages/Filedownload';
import Home from './pages/Home/Home';
import Knowledge from './pages/Knowledge';
import Login from './pages/Login';
import MeetingAgent from './pages/MeetingAgent/MeetingAgent';
import Workspaces from './pages/Workspaces';
import { ApiService } from '../backend/api/apiService';

import './index.css';


const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    ApiService.Tracking.trackPageView(fullPath);
  }, [location.pathname, location.search, location.hash]);

  return null;
};

const App = (): JSX.Element => {
  return (
    <HelmetProvider>
      <Helmet
        titleTemplate="%s | Banbury"
        defaultTitle="Banbury"
      />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="themeMode"
      >
        <BrowserRouter>
          <PageTracker />
          <Routes>
            <Route path='/workspaces' element={<Workspaces />} />
            <Route path='/knowledge' element={<Knowledge />} />
            <Route path='/meeting-agent' element={<MeetingAgent />} />
            <Route path='/admin' element={<Admin />} />
            <Route path='/' element={<Layout><Home /></Layout>} />
            <Route path='/login' element={<Layout><Login /></Layout>} />
            <Route path='/auth/callback' element={<Layout><AuthCallback /></Layout>} />
            <Route path='/features' element={<Layout><Features /></Layout>} />
            <Route path='/filedownload/:username/:file_id' element={<Layout><FileDownload /></Layout>} />
            <Route path='/api' element={<Layout><API /></Layout>} />
            <Route path='/news' element={<Layout><News /></Layout>} />
            <Route path='/news/:postId' element={<Layout><News /></Layout>} />
            <Route path='/terms_of_use' element={<Layout><Terms_of_use /></Layout>} />
            <Route path='/privacy_policy' element={<Layout><Privacy_Policy /></Layout>} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  );
};

export default App;
