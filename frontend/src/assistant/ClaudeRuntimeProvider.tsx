import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import type { FC, PropsWithChildren } from "react";

export const ClaudeRuntimeProvider: FC<PropsWithChildren> = ({ children }) => {
  const adapter = {
    async *run(options: { messages: any[]; abortSignal?: AbortSignal }) {
      // Immediately yield a running status to show typing
      const contentParts: any[] = [];
      yield { content: contentParts, status: { type: "running" } } as any;

      // Get auth token for file access
      const token = localStorage.getItem('authToken');

      // Ensure attachments are included in the request payload as content parts (only for the latest user message)
      const messagesWithAttachmentParts = Array.isArray(options.messages)
        ? (() => {
            const msgs = options.messages.map((m: any) => ({ ...m }));
            const lastUserIdx = [...msgs]
              .map((m: any, i: number) => ({ role: m?.role, i }))
              .reverse()
              .find((x) => x.role === 'user')?.i;
            if (lastUserIdx === undefined) return msgs;

            let attachments: any[] = [];
            const lastUser = msgs[lastUserIdx];
            if (Array.isArray(lastUser?.attachments) && lastUser.attachments.length > 0) {
              attachments = lastUser.attachments;
            } else {
              try {
                const pending = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
                if (Array.isArray(pending)) attachments = pending;
              } catch {}
            }

            const parts = attachments
              .map((att: any) => {
                const fileId = att?.fileId ?? att?.id ?? att?.file_id;
                const fileName = att?.fileName ?? att?.name;
                const filePath = att?.filePath ?? att?.path;
                const fileData = att?.fileData;
                const mimeType = att?.mimeType;
                if (!fileId || !fileName || !filePath) return null;
                
                const part: any = { type: 'file-attachment', fileId, fileName, filePath };
                
                // Include pre-downloaded file data if available
                if (fileData && mimeType) {
                  part.fileData = fileData;
                  part.mimeType = mimeType;
                }
                
                return part;
              })
              .filter(Boolean) as any[];

            if (parts.length > 0) {
              const baseContent = Array.isArray(lastUser?.content) ? lastUser.content : [];
              lastUser.content = [...baseContent, ...parts];
            }
            return msgs;
          })()
        : options.messages;

      const res = await fetch("/api/assistant/stream", {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          ...(token && { "Authorization": `Bearer ${token}` })
        },
        body: JSON.stringify({ messages: messagesWithAttachmentParts }),
        signal: options.abortSignal,
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        yield { content: [{ type: "text", text: "" }], status: { type: "incomplete", reason: "other" } } as any;
        return;
      }

      let buffer = "";
      let aggregatedText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          const json = chunk.slice(6).trim();
          if (!json) continue;
          const evt = JSON.parse(json);
          if (evt.type === "tool-call" && evt.part) {
            // Append tool call in chronological order
            contentParts.push(evt.part);
            yield { content: contentParts, status: { type: "running" } } as any;
          } else if (evt.type === "text-delta" && evt.text) {
            aggregatedText += evt.text;
            const last = contentParts[contentParts.length - 1];
            if (last && (last as any).type === "text") {
              (last as any).text = aggregatedText;
            } else {
              contentParts.push({ type: "text", text: aggregatedText });
            }
            yield { content: contentParts, status: { type: "running" } } as any;
          } else if (evt.type === "message-end") {
            yield { content: contentParts, status: evt.status } as any;
          }
        }
      }
    },
  } as any;
  const runtime = useLocalRuntime(adapter as any);
  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
};
