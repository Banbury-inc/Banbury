import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
const Features = dynamic(() => import('@/components/Features'), { ssr: false });

export default function FeaturesPage() {
  return (
    <Layout>
      <Features />
    </Layout>
  );
}


