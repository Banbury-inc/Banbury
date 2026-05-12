import React from 'react';
import { FileSystemItem } from '../../../../../utils/fileTreeUtils';
import { isViewableFileExtended } from '../../../../../pages/Workspaces/handlers/fileTypeUtils';
import { openFileInTab } from '../../../../../pages/Workspaces/handlers/tabManagement';

interface HandleFileSelectParams {
  file: FileSystemItem;
  activePanelId: string;
  panelLayout: any;
  getAllTabs: (layout: any) => any[];
  updatePanelActiveTab: (layout: any, panelId: string, tabId: string) => any;
  addTabToPanel: (layout: any, panelId: string, tab: any) => any;
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>;
  setPanelLayout: React.Dispatch<React.SetStateAction<any>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>;
}

export const handleFileSelect = ({
  file,
  activePanelId,
  panelLayout,
  getAllTabs,
  updatePanelActiveTab,
  addTabToPanel,
  setActivePanelId,
  setPanelLayout,
  setSelectedFile,
}: HandleFileSelectParams) => {
  // Check if it's a Drive file
  const isDriveFile = file.path?.startsWith('drive://')
  const isDropboxFile = file.path?.startsWith('dropbox://')
  
  // For Drive files, check mimeType; for local files, check extension
  let viewable = false
  if (isDriveFile || isDropboxFile) {
    // Google Workspace files are always viewable (Docs, Sheets, Slides)
    if (isDriveFile && file.mimeType?.includes('vnd.google-apps')) {
      viewable = true
    } else {
      // Check other Drive file types (images, PDFs, videos, documents, spreadsheets, presentations, etc)
      viewable = !!(file.mimeType && (
        file.mimeType.includes('image/') ||
        file.mimeType.includes('pdf') ||
        file.mimeType.includes('video/') ||
        file.mimeType.includes('text/') ||
        file.mimeType.includes('msword') ||
        file.mimeType.includes('wordprocessingml') ||
        file.mimeType.includes('excel') ||
        file.mimeType.includes('spreadsheetml') ||
        file.mimeType.includes('csv') ||
        file.mimeType.includes('presentationml') ||
        file.mimeType.includes('ms-powerpoint')
      ))
    }
  } else {
    viewable = isViewableFileExtended(file)
  }
  
  if (!viewable) {
    setSelectedFile(file);
    return;
  }
  
  openFileInTab(
    file,
    activePanelId,
    activePanelId,
    panelLayout,
    getAllTabs,
    updatePanelActiveTab,
    addTabToPanel,
    setActivePanelId,
    setPanelLayout,
    setSelectedFile
  );
};
