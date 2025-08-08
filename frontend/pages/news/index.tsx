import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
const News = dynamic(() => import('@/components/News'), { ssr: false });

export default function NewsPage() {
  return (
    <Layout>
      <News />
    </Layout>
  );
}


