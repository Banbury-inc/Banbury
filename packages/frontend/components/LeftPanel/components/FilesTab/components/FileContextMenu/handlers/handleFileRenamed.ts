import React from 'react';
import { FileSystemItem } from '../../../../../utils/fileTreeUtils';
import type { PanelGroup } from '../../../../../pages/Workspaces/types';

export const handleFileRenamed = (
  oldPath: string,
  newPath: string,
  selectedFile: FileSystemItem | null,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  triggerSidebarRefresh: () => void
) => {
  const newFileName = newPath.split('/').pop() || newPath;
  
  // Update tabs for the renamed file in all panels
  setPanelLayout(prev => {
    const updateInAllPanels = (layout: PanelGroup): PanelGroup => {
      if (layout.type === 'panel' && layout.panel) {
        const updatedTabs = layout.panel.tabs.map(tab => {
          if (tab.type === 'file' && tab.filePath === oldPath) {
            const updatedFile = { ...tab.file, path: newPath, name: newFileName };
            return {
              ...tab,
              filePath: newPath,
              fileName: newFileName,
              file: updatedFile
            };
          }
          return tab;
        });
        
        return {
          ...layout,
          panel: {
            ...layout.panel,
            tabs: updatedTabs
          }
        };
      }
      if (layout.type === 'group' && layout.children) {
        return {
          ...layout,
          children: layout.children.map(child => updateInAllPanels(child))
        };
      }
      return layout;
    };
    
    return updateInAllPanels(prev);
  });
  
  // If the renamed file was selected, update its path
  if (selectedFile?.path === oldPath) {
    setSelectedFile(prev => prev ? { ...prev, path: newPath, name: newFileName } : null);
  }
  
  // Refresh the sidebar to update the file list
  triggerSidebarRefresh();
};
