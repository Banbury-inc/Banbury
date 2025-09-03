import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import getTheme from '@/theme/theme';
import ColorModeContext from '@/utils/ColorModeContext';
import { useEffect, useMemo, useState } from 'react';
import { ClaudeRuntimeProvider } from '@/assistant/ClaudeRuntimeProvider';
import { Toaster } from '@/components/ui/toaster';
import '@/index.css';
import { useRouter } from 'next/router';
import { attachRouteTracking } from './handlers/routeTracking';

function AppInner({ Component, pageProps }: AppProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const router = useRouter();

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        try {
          window.localStorage.setItem('themeMode', mode === 'dark' ? 'light' : 'dark');
        } catch {
          /* ignore */
        }
        setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
      },
    }),
    [mode]
  );

  useEffect(() => {
    try {
      const localTheme = window.localStorage.getItem('themeMode');
      setMode(localTheme === 'light' ? 'light' : 'dark');
    } catch {
      /* ignore */
      setMode('dark');
    }
  }, []);

  useEffect(() => {
    const detach = attachRouteTracking(router)
    return () => {
      if (typeof detach === 'function') detach()
    }
  }, [router])

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [mode]);

  return (
    <HelmetProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={getTheme(mode)}>
          <CssBaseline />
          <ClaudeRuntimeProvider>
            <Component {...pageProps} />
          </ClaudeRuntimeProvider>
          <Toaster />
        </ThemeProvider>
      </ColorModeContext.Provider>
    </HelmetProvider>
  );
}

const MyApp = dynamic(() => Promise.resolve(AppInner), { ssr: false });

export default MyApp;


