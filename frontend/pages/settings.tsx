import dynamic from 'next/dynamic';

const Settings = dynamic(() => import('@/pages/Settings'), { ssr: false });

export default function SettingsPage() {
  return <Settings />;
}
