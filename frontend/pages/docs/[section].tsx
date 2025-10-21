import dynamic from 'next/dynamic';
const DocsLayout = dynamic(() => import('@/layout/DocsLayout'), { ssr: false });
const Docs = dynamic(() => import('@/pages/Docs/Docs'), { ssr: false });

export default function DocsSectionPage() {
  return (
    <DocsLayout>
      <Docs />
    </DocsLayout>
  );
}

