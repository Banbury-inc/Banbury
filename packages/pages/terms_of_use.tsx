import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const Terms = dynamic(() => import('frontend/components/Terms_of_use'), { ssr: false });

export default function TermsPage() {
  return (
    <Layout>
      <Terms />
    </Layout>
  );
}


