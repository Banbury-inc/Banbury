import { useEffect } from 'react';

export default function SitemapRedirect() {
  useEffect(() => {
    window.location.href = '/sitemap.xml';
  }, []);
  return null;
}


