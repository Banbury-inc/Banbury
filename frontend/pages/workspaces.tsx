import dynamic from 'next/dynamic';

const Workspaces = dynamic(() => import('@/pages/Workspaces'), { ssr: false });

export default function WorkspacesPage() {
  return <Workspaces />;
}


