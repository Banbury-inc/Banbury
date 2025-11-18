import dynamic from 'next/dynamic';
const Pricing = dynamic(() => import('frontend/pages/Pricing'), { ssr: false });
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });

export default function PricingPage() {
  return (
    <Layout>
      <Pricing />
    </Layout>
  );
}


