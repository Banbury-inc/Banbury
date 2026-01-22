import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const Features = dynamic(() => import('@/pages/Features'), { ssr: false });

export default function FeaturesPage() {
  return (
    <Layout>
      <Features />
    </Layout>
  );
}


