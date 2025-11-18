import dynamic from 'next/dynamic';
import Layout from 'frontend/layout/Layout';

const AuthCallback = dynamic(() => import('frontend/pages/AuthCallback'), { ssr: false });

export default function AuthCallbackPage() {
  return (
    <Layout>
      <AuthCallback />
    </Layout>
  );
}
