import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const Privacy = dynamic(() => import('frontend/components/Privacy_Policy'), { ssr: false });

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <Privacy />
    </Layout>
  );
}


