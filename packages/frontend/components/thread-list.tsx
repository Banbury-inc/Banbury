import { useEffect, useState } from "react";
import type { FC } from "react";
import { ArchiveIcon, PlusIcon, FolderOpen, RefreshCwIcon } from "lucide-react";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { Button } from "frontend/components/ui/button";
import { ApiService } from "backend/api/apiService";

export const ThreadList: FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ApiService.Conversations.getConversations(50, 0);
      if (res.success && Array.isArray(res.conversations)) {
        setItems(res.conversations);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="text-foreground flex flex-col items-stretch gap-1.5">
      <ThreadListNew onReload={load} loading={loading} />
      <ThreadListItems items={items} />
    </div>
  );
};

const ThreadListNew: FC<{ onReload: () => void; loading: boolean }> = ({ onReload, loading }) => {
  return (
    <div className="flex items-center gap-2">
      <Button className="hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start" variant="ghost" onClick={onReload} disabled={loading}>
        <RefreshCwIcon className="mr-1" />
        {loading ? 'Loading…' : 'Refresh'}
      </Button>
      <Button className="hover:bg-muted flex items-center justify-start gap-1 rounded-lg px-2.5 py-2 text-start" variant="ghost">
        <PlusIcon />
        New Thread
      </Button>
    </div>
  );
};

const ThreadListItems: FC<{ items: any[] }> = ({ items }) => {
  if (!items.length) {
    return <div className="text-sm text-foreground/70 px-2.5 py-2">No conversations</div>;
  }
  return (
    <div className="flex flex-col gap-1">
      {items.map((c) => (
        <ThreadListItem key={c._id} item={c} />
      ))}
    </div>
  );
};

const ThreadListItem: FC<{ item: any }> = ({ item }) => {
  const handleLoad = async () => {
    try {
      const res = await ApiService.Conversations.getConversation(item._id);
      const conv = res?.conversation;
      const rawMessages = Array.isArray(conv?.messages) ? conv.messages : [];
      const sanitized = rawMessages.map((msg: any, i: number) => ({
        id: msg.id || `msg-${i}-${Date.now()}`,
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: Array.isArray(msg.content)
          ? msg.content
          : (typeof msg.content === 'string' && msg.content.length > 0 ? [{ type: 'text', text: msg.content }] : []),
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }));
      window.dispatchEvent(new CustomEvent('assistant-load-conversation', { detail: { messages: sanitized } }));
    } catch {}
  };

  return (
    <div className="hover:bg-muted focus-visible:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2">
      <button className="flex-grow px-3 py-2 text-start" onClick={handleLoad} title="Load conversation">
        <ThreadListItemTitle title={item.title} />
      </button>
      <ThreadListItemArchive />
    </div>
  );
};

const ThreadListItemTitle: FC<{ title?: string }> = ({ title }) => {
  return <p className="text-sm truncate">{title || 'New Chat'}</p>;
};

const ThreadListItemArchive: FC = () => {
  return (
    <TooltipIconButton
      className="hover:text-foreground/60 p-4 text-foreground ml-auto mr-1 size-4"
      variant="ghost"
      tooltip="Archive thread"
    >
      <ArchiveIcon />
    </TooltipIconButton>
  );
};
