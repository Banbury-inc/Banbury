import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { Panel, PanelGroup, WorkspaceTab, SplitDirection, SplitPlacement } from '../types';

export const splitPanel = (
  panelId: string,
  direction: SplitDirection,
  newTab: WorkspaceTab | undefined,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setSelectedFile: React.Dispatch<React.SetStateAction<FileSystemItem | null>>,
  placement: SplitPlacement = 'after'
) => {
  const newPanelId = `panel-${Date.now()}`;
  const newPanel: Panel = {
    id: newPanelId,
    tabs: newTab ? [newTab] : [],
    activeTabId: newTab ? newTab.id : null
  };
  
  setPanelLayout(prev => {
    const splitPanelInLayout = (layout: PanelGroup): PanelGroup => {
      if (layout.type === 'panel' && layout.panel?.id === panelId) {
        const existingPanelGroup: PanelGroup = { ...layout, size: 50 };
        const newPanelGroup: PanelGroup = {
          id: newPanelId,
          type: 'panel',
          panel: newPanel,
          size: 50
        };

        // Convert panel to group with two children
        return {
          id: `group-${Date.now()}`,
          type: 'group',
          direction,
          children: placement === 'before'
            ? [newPanelGroup, existingPanelGroup]
            : [existingPanelGroup, newPanelGroup]
        };
      }
      if (layout.type === 'group' && layout.children) {
        return {
          ...layout,
          children: layout.children.map(child => splitPanelInLayout(child))
        };
      }
      return layout;
    };
    
    return splitPanelInLayout(prev);
  });
  
  setActivePanelId(newPanelId);
  if (newTab && newTab.type === 'file') {
    setSelectedFile(newTab.file);
  }
};
