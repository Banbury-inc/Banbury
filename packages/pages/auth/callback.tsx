import dynamic from 'next/dynamic';

const AuthCallback = dynamic(() => import('frontend/pages/AuthCallback'), { ssr: false });

export default function AuthCallbackPage() {
  return <AuthCallback />;
}


