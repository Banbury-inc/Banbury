import dynamic from 'next/dynamic';

const ElectronCallback = dynamic(() => import('frontend/pages/authentication/auth/electron/callback'), { ssr: false });

export default function ElectronCallbackPage() {
  return <ElectronCallback />;
}

