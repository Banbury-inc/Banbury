export function prepareMessagesWithAttachments({ messages }: { messages: any[] }): any[] {
  if (!Array.isArray(messages)) return messages;

  const msgs = messages.map((m: any) => ({ ...m }));
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
}

