import React from 'react';
import { FileSystemItem } from '../../../../../../../utils/fileTreeUtils';
import type { PanelGroup } from '../../../../../../../pages/Workspaces/types';

export const handleFileDeleted = <T extends PanelGroup>(
  fileId: string,
  selectedFile: FileSystemItem | null,
  setPanelLayout: React.Dispatch<React.SetStateAction<T>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  triggerSidebarRefresh: () => void
) => {
  // Remove tabs for the deleted file from all panels
  setPanelLayout(prev => {
    const removeFromAllPanels = (layout: T): T => {
      if (layout.type === 'panel' && layout.panel) {
        const newTabs = layout.panel.tabs.filter(tab => tab.type === 'file' && tab.file.file_id !== fileId);
        let newActiveTabId = layout.panel.activeTabId;
        
        // If the active tab was deleted, switch to another tab
        const activeTabDeleted = layout.panel.tabs.find(tab => tab.id === layout.panel!.activeTabId && tab.type === 'file' && tab.file.file_id === fileId);
        if (activeTabDeleted) {
          newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
        }
        
        return {
          ...layout,
          panel: {
            ...layout.panel,
            tabs: newTabs,
            activeTabId: newActiveTabId
          }
        } as T;
      }
      if (layout.type === 'group' && layout.children) {
        return {
          ...layout,
          children: layout.children.map(child => removeFromAllPanels(child as T))
        } as T;
      }
      return layout;
    };
    
    return removeFromAllPanels(prev);
  });
  
  // If the deleted file was selected, clear the selection
  if (selectedFile?.file_id === fileId) {
    setSelectedFile(null);
  }
  
  // Don't refresh the sidebar - the optimistic update in LocalFilesView handles UI updates
  // If deletion fails, the file will be restored via handleFileDeleteFailed
};
