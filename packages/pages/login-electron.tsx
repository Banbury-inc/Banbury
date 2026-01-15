import dynamic from 'next/dynamic';
const LoginElectron = dynamic(() => import('frontend/pages/LoginElectron'), { ssr: false });

export default function LoginElectronPage() {
  return <LoginElectron />;
}
