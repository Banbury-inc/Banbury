import { ApiService } from "../../../../../../backend/api/apiService";
import { FileSystemItem } from "../../../../../../utils/fileTreeUtils";

interface FetchMissingPayloadsParams {
  attachedFiles: FileSystemItem[];
  attachmentPayloads: Record<string, { fileData: string; mimeType: string }>;
  setAttachmentPayloads: (updater: (prev: Record<string, { fileData: string; mimeType: string }>) => Record<string, { fileData: string; mimeType: string }>) => void;
}

function isSpreadsheet(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return ['.csv', '.xlsx', '.xls'].includes(ext);
}

function isTldrawCanvas(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return ext === '.tldraw';
}

function isPresentation(fileName: string): boolean {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return ['.pptx', '.ppt'].includes(ext);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      // Strip data URL prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function fetchMissingPayloads({
  attachedFiles,
  attachmentPayloads,
  setAttachmentPayloads,
}: FetchMissingPayloadsParams): Promise<void> {
  const tasks = attachedFiles
    .filter((f) => f.file_id && (isSpreadsheet(f.name) || isTldrawCanvas(f.name) || isPresentation(f.name)) && !attachmentPayloads[f.file_id])
    .map(async (f) => {
      try {
        const res = await ApiService.downloadFromS3(f.file_id!, f.name);
        if (res?.success && res.blob) {
          // Skip embedding if blob exceeds ~600KB to keep request under server limit after base64 overhead
          const approxSize = res.blob.size;
          if (approxSize > 600 * 1024) return;
          const base64 = await blobToBase64(res.blob);
          let mimeType = res.blob.type;
          if (!mimeType) {
            if (f.name.toLowerCase().endsWith('.csv')) {
              mimeType = 'text/csv';
            } else if (f.name.toLowerCase().endsWith('.tldraw')) {
              mimeType = 'application/json';
            } else if (f.name.toLowerCase().endsWith('.pptx')) {
              mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            } else if (f.name.toLowerCase().endsWith('.ppt')) {
              mimeType = 'application/vnd.ms-powerpoint';
            } else {
              mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }
          }
          setAttachmentPayloads((prev) => ({ ...prev, [f.file_id!]: { fileData: base64, mimeType } }));
        }
      } catch {}
    });
  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}
