import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useNavigate } from 'react-router-dom';
import getTheme from './theme/theme';
import ColorModeContext from './utils/ColorModeContext';
import Layout from './layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import Features from './components/Features';
import News from './components/News';
import Terms_of_use from './components/Terms_of_use';
import Privacy_Policy from './components/Privacy_Policy';
import FileDownload from './pages/Filedownload';
import { trackPageView } from './services/trackingService';
import './index.css';
import API from './components/API';

const SitemapRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.location.href = '/sitemap.xml'; // Directly redirect to the sitemap file in the public directory
  }, [navigate]);

  return null; // Return null because this component doesn't render anything
};

const PageTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location]);

  return null;
};

const App = (): JSX.Element => {
  const [mode, setMode] = useState('dark');
  const colorMode = useMemo(
    () => ({
      // The theme mode switch will invoke this method
      toggleColorMode: () => {
        window.localStorage.setItem(
          'themeMode',
          mode === 'dark' ? 'light' : 'dark'
        );
        setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
      },
    }),
    [mode]
  );

  useEffect(() => {
    try {
      const localTheme = window.localStorage.getItem('themeMode');
      localTheme ? setMode(localTheme) : setMode('dark');
    } catch {
      setMode('dark');
    }
  }, []);

  return (
    <HelmetProvider>
      <Helmet
        titleTemplate="%s | Banbury"
        defaultTitle="Banbury"
      />
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={getTheme(mode)}>
          <CssBaseline />
          <BrowserRouter>
            <PageTracker />
            <Layout>
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/login' element={<Login />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='/auth/callback' element={<AuthCallback />} />
                <Route path='/features' element={<Features />} />
                <Route path='/filedownload/:username/:file_id' element={<FileDownload />} />
                <Route path='/api' element={<API />} />
                <Route path='/news' element={<News />} />
                <Route path='/news/:postId' element={<News />} />
                <Route path='/terms_of_use' element={<Terms_of_use />} />
                <Route path='/privacy_policy' element={<Privacy_Policy />} />
                <Route path='/sitemap' element={<SitemapRedirect />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </HelmetProvider>
  );
};

export default App;
