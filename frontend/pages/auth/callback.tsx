import dynamic from 'next/dynamic';
import Layout from '@/layout/Layout';

const AuthCallback = dynamic(() => import('@/pages/AuthCallback'), { ssr: false });

export default function AuthCallbackPage() {
  return (
    <Layout>
      <AuthCallback />
    </Layout>
  );
}


