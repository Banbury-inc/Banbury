import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
const Privacy = dynamic(() => import('@/components/Privacy_Policy'), { ssr: false });

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <Privacy />
    </Layout>
  );
}


