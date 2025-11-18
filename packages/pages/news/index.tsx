import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const News = dynamic(() => import('frontend/components/News'), { ssr: false });

export default function NewsPage() {
  return (
    <Layout>
      <News />
    </Layout>
  );
}


