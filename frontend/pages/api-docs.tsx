import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
const API = dynamic(() => import('@/components/API'), { ssr: false });

export default function APIDocsPage() {
  return (
    <Layout>
      <API />
    </Layout>
  );
}


