import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const API = dynamic(() => import('frontend/components/API'), { ssr: false });

export default function APIDocsPage() {
  return (
    <Layout>
      <API />
    </Layout>
  );
}


