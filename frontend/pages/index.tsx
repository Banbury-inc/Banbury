import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
const Home = dynamic(() => import('@/pages/Home'), { ssr: false });

export default function IndexPage() {
  return (
    <Layout>
      <Home />
    </Layout>
  );
}


