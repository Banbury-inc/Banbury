import Layout from '@/layout/Layout';
import dynamic from 'next/dynamic';
const Download = dynamic(() => import('@/pages/Desktop'), { ssr: false });

export default function DocsPage() {
  return (
    <Layout>
      <Download />
    </Layout>
  );
}
