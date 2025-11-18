import dynamic from 'next/dynamic';

// Use suspense to avoid aborted fetch during rapid route transitions
const Admin = dynamic(() => import('frontend/pages/Admin/Admin'), { ssr: false, suspense: true });

export default function AdminPage() {
  return (
    <Admin />
  );
}
