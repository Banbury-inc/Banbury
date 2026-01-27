import React from 'react';
import { PanelGroup, WorkspaceTab, CalendarTab } from '../../../../../pages/Workspaces/types';

export const openCalendarInTab = (
  targetPanelId: string,
  activePanelId: string,
  panelLayout: PanelGroup,
  getAllTabs: (layout: PanelGroup) => WorkspaceTab[],
  updatePanelActiveTab: (layout: PanelGroup, panelId: string, tabId: string) => PanelGroup,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
) => {
  // Check if a calendar tab already exists
  const allTabs = getAllTabs(panelLayout);
  const existing = allTabs.find(tab => (tab as any).type === 'calendar') as CalendarTab | undefined;
  if (existing) {
    // Activate the panel containing this tab
    const activateExisting = (layout: PanelGroup): boolean => {
      if (layout.type === 'panel' && layout.panel) {
        const has = layout.panel.tabs.some(t => t.id === existing.id);
        if (has) {
          setActivePanelId(layout.panel.id);
          setPanelLayout(prev => updatePanelActiveTab(prev, layout.panel!.id, existing.id));
          return true;
        }
      }
      if (layout.type === 'group' && layout.children) {
        return layout.children.some(child => activateExisting(child));
      }
      return false;
    };
    activateExisting(panelLayout);
    return;
  }

  const tabId = `calendar_${Date.now()}`;
  const newTab: CalendarTab = { id: tabId, title: 'Calendar', type: 'calendar' };
  setPanelLayout(prev => addTabToPanel(prev, targetPanelId, newTab));
  setActivePanelId(targetPanelId);
};
