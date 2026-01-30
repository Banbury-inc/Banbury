import dynamic from 'next/dynamic';
const LoginElectron = dynamic(() => import('frontend/pages/LoginElectron'), { ssr: false });
const Workspaces = dynamic(() => import('frontend/pages/Workspaces/Workspaces'), { ssr: false });

export default function LoginElectronPage() {
  const authToken = localStorage.getItem('authToken')
  if (authToken) {
    return <Workspaces/>
  }
  return <LoginElectron />;
}
