import dynamic from 'next/dynamic';
const DocsLayout = dynamic(() => import('frontend/layout/DocsLayout'), { ssr: false });
const Docs = dynamic(() => import('frontend/pages/Docs/Docs'), { ssr: false });

export default function DocsSectionPage() {
  return (
    <DocsLayout>
      <Docs />
    </DocsLayout>
  );
}

