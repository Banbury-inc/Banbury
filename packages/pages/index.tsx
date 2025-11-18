import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const Home = dynamic(() => import('frontend/pages/Home/Home'), { ssr: false });

export default function IndexPage() {
  return (
    <Layout>
      <Home />
    </Layout>
  );
}


