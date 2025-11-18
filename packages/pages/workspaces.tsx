import dynamic from 'next/dynamic';

const Workspaces = dynamic(() => import('frontend/pages/Workspaces/Workspaces'), { ssr: false });

export default function WorkspacesPage() {
  return <Workspaces />;
}


