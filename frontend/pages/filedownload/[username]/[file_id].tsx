import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('@/layout/Layout'), { ssr: false });
const FileDownload = dynamic(() => import('@/pages/Filedownload'), { ssr: false });

export default function FileDownloadRoute() {
  return (
    <Layout>
      <FileDownload />
    </Layout>
  );
}


