import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
const Login = dynamic(() => import('@/pages/Login'), { ssr: false });

export default function LoginPage() {
  return (
    <Layout>
      <Login />
    </Layout>
  );
}


