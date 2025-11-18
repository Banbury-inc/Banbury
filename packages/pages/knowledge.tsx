import dynamic from 'next/dynamic';

const Knowledge = dynamic(() => import('frontend/pages/Knowledge'), { ssr: false });

export default function KnowledgePage() {
  return <Knowledge />;
}
