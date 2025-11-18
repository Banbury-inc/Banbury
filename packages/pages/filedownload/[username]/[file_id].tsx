import dynamic from 'next/dynamic';
const Layout = dynamic(() => import('frontend/layout/Layout'), { ssr: false });
const FileDownload = dynamic(() => import('frontend/pages/Filedownload'), { ssr: false });

export default function FileDownloadRoute() {
  return (
    <Layout>
      <FileDownload />
    </Layout>
  );
}


