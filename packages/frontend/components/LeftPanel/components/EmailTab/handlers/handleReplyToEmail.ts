import React from 'react';
import { PanelGroup, WorkspaceTab, EmailTab } from '../../../../../pages/Workspaces/types';

export const handleReplyToEmail = (
  email: any,
  activePanelId: string,
  addTabToPanel: (layout: PanelGroup, panelId: string, tab: WorkspaceTab) => PanelGroup,
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>,
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>,
  setReplyToEmail: React.Dispatch<React.SetStateAction<any>>
) => {
  // Create a compose tab with reply data
  const tabId = `reply_${email.id}_${Date.now()}`;
  const subject = email.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
  const replySubject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;
  
  const newTab: EmailTab = {
    id: tabId,
    subject: replySubject,
    emailId: 'compose',
    email: null, // No email data for compose mode - reply data handled separately
    type: 'email'
  };
  
  // Set the reply context
  setReplyToEmail(email);
  
  // Add tab to the active panel
  setPanelLayout(prev => addTabToPanel(prev, activePanelId, newTab));
  setActivePanelId(activePanelId);
};
