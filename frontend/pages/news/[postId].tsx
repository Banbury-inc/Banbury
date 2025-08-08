import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
import { useRouter } from 'next/router';

const News = dynamic(() => import('@/components/News'), { ssr: false });

export default function NewsPostPage() {
  const router = useRouter();
  const { postId } = router.query;
  return (
    <Layout>
      <News key={String(postId)} />
    </Layout>
  );
}


