import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useEffect } from 'react';
import { ClaudeRuntimeProvider } from '@/assistant/ClaudeRuntimeProvider';
import { Toaster } from '@/components/ui/toaster';
import '@/index.css';
import '@/styles/DiffPreview.css';
import { useRouter } from 'next/router';
import { attachRouteTracking } from '@/handlers/routeTracking';

function AppInner({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const detach = attachRouteTracking(router)
    return () => {
      if (typeof detach === 'function') detach()
    }
  }, [router])

  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        storageKey="themeMode"
      >
        <ClaudeRuntimeProvider>
          <Component {...pageProps} />
        </ClaudeRuntimeProvider>
        <Toaster />
      </ThemeProvider>
    </HelmetProvider>
  );
}

const MyApp = dynamic(() => Promise.resolve(AppInner), { ssr: false });

export default MyApp;


