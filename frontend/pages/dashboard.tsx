import dynamic from 'next/dynamic';

const Dashboard = dynamic(() => import('@/pages/Dashboard'), { ssr: false });

export default function DashboardPage() {
  return <Dashboard />;
}


