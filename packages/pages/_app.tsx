import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'frontend/components/ThemeProvider';
import { useEffect } from 'react';
import { ClaudeRuntimeProvider } from 'frontend/assistant/ClaudeRuntimeProvider/ClaudeRuntimeProvider';
import { Toaster } from 'frontend/components/ui/toaster';
import '@/index.css';
import '@/styles/DiffPreview.css';
import { useRouter } from 'next/router';
import { attachRouteTracking } from 'frontend/handlers/routeTracking';

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


