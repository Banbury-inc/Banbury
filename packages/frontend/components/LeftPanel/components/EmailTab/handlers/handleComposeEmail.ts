import React from 'react';
import { PanelGroup, EmailTab } from '../../../../../pages/Workspaces/types';

export const handleComposeEmail = (
  activePanelId: string,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: any) => PanelGroup,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
) => {
  // Create a special email tab for composing
  const tabId = `compose_${Date.now()}`;
  const newTab: EmailTab = {
    id: tabId,
    subject: 'New Email',
    emailId: 'compose',
    email: null, // No email data for compose mode
    type: 'email'
  };
  
  // Add tab to the active panel
  setPanelLayout(prev => addTabToPanel(prev, activePanelId, newTab));
  setActivePanelId(activePanelId);
};
