import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const Login = dynamic(() => import('frontend/pages/Login'), { ssr: false });

export default function LoginPage() {
  return (
    <Layout>
      <Login />
    </Layout>
  );
}


