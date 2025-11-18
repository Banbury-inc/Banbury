import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const Register = dynamic(() => import('frontend/pages/Register'), { ssr: false });

export default function RegisterPage() {
  return (
    <Layout>
      <Register />
    </Layout>
  );
}
