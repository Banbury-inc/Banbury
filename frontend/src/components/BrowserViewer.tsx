import React, { useMemo } from 'react';

interface BrowserViewerProps {
  viewerUrl: string;
  title?: string;
}

const BrowserViewer: React.FC<BrowserViewerProps> = ({ viewerUrl, title }) => {
  const safeSrc = useMemo(() => {
    try {
      // Basic allow-listing: only allow https URLs
      const url = new URL(viewerUrl);
      if (url.protocol !== 'https:') return '';
      return url.toString();
    } catch {
      return '';
    }
  }, [viewerUrl]);

  const host = useMemo(() => {
    try {
      const u = new URL(safeSrc);
      return u.host.toLowerCase();
    } catch { return ''; }
  }, [safeSrc]);

  const cannotEmbed = useMemo(() => {
    // Known sites that block iframe embedding
    const blockedHosts = new Set([
      'google.com', 'www.google.com', 'news.google.com', 'accounts.google.com',
      'duckduckgo.com', 'www.duckduckgo.com', 'bing.com', 'www.bing.com'
    ]);
    return host ? Array.from(blockedHosts).some(h => host === h || host.endsWith('.' + h)) : false;
  }, [host]);

  const openExternal = () => {
    if (safeSrc) {
      try { window.open(safeSrc, '_blank', 'noopener,noreferrer'); } catch {}
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <div className="flex-1 min-h-0">
        {safeSrc && !cannotEmbed ? (
          <iframe
            src={safeSrc}
            title={title || 'Browser Session'}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write; microphone; camera; display-capture;"
            referrerPolicy="no-referrer"
          />
        ) : safeSrc && cannotEmbed ? (
          <div className="w-full h-full flex items-center justify-center text-zinc-300 px-6 text-center">
            <div>
              <div className="mb-2 font-medium">This site blocks embedding in an iframe.</div>
              <div className="mb-4 text-sm text-zinc-400">Use the "Open externally" button above to view it in a new tab.</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            Invalid viewer URL
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowserViewer;


