import { FileSystemItem } from "../../../../../../utils/fileTreeUtils";

interface SyncAttachmentsToLocalStorageParams {
  attachedFiles: FileSystemItem[];
  attachedEmails: any[];
  attachmentPayloads: Record<string, { fileData: string; mimeType: string }>;
}

export function syncAttachmentsToLocalStorage({
  attachedFiles,
  attachedEmails,
  attachmentPayloads,
}: SyncAttachmentsToLocalStorageParams): void {
  try {
    const simplifiedFiles = attachedFiles.map((f) => ({
      fileId: f.file_id,
      fileName: f.name,
      filePath: f.path,
      ...(f.file_id && attachmentPayloads[f.file_id]
        ? { fileData: attachmentPayloads[f.file_id].fileData, mimeType: attachmentPayloads[f.file_id].mimeType }
        : {}),
    }));
    
    const simplifiedEmails = attachedEmails.map((e) => ({
      emailId: e.id,
      subject: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
      from: e.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown',
      snippet: e.snippet || '',
      threadId: e.threadId,
      internalDate: e.internalDate,
      payload: e.payload
    }));
    
    localStorage.setItem('pendingAttachments', JSON.stringify(simplifiedFiles));
    localStorage.setItem('pendingEmailAttachments', JSON.stringify(simplifiedEmails));
  } catch {
    // ignore storage errors
  }
}
