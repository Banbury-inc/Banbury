import { useCallback } from 'react'
import { PanelGroup } from '../../../../../pages/Workspaces/types'
import { openEmailInTab } from '../../../../../pages/Workspaces/handlers/tabManagement'
import { handleComposeEmail } from './handleComposeEmail'
import { handleReplyToEmail } from './handleReplyToEmail'
import { getAllTabs, updatePanelActiveTab, addTabToPanel } from '../../../../../pages/Workspaces/handlers/panelUtils'

interface WorkspaceDependencies {
  activePanelId: string
  panelLayout: PanelGroup
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>
  setSelectedEmail: React.Dispatch<React.SetStateAction<any | null>>
  setReplyToEmail: React.Dispatch<React.SetStateAction<any>>
}

export function useEmailWorkspaceHandlers(deps: WorkspaceDependencies) {
  const {
    activePanelId,
    panelLayout,
    setPanelLayout,
    setActivePanelId,
    setSelectedEmail,
    setReplyToEmail
  } = deps

  const handleEmailSelect = useCallback((email: any) => {
    setSelectedEmail(email)
    openEmailInTab(
      email,
      activePanelId,
      activePanelId,
      panelLayout,
      getAllTabs,
      updatePanelActiveTab,
      addTabToPanel,
      setActivePanelId,
      setPanelLayout,
      setSelectedEmail
    )
  }, [activePanelId, panelLayout, setActivePanelId, setPanelLayout, setSelectedEmail])

  const handleComposeEmailCallback = useCallback(() => {
    handleComposeEmail(activePanelId, addTabToPanel, setPanelLayout, setActivePanelId)
  }, [activePanelId, addTabToPanel, setPanelLayout, setActivePanelId])

  const handleReplyToEmailCallback = useCallback((email: any) => {
    handleReplyToEmail(email, activePanelId, addTabToPanel, setPanelLayout, setActivePanelId, setReplyToEmail)
  }, [activePanelId, addTabToPanel, setPanelLayout, setActivePanelId, setReplyToEmail])

  return {
    handleEmailSelect,
    handleComposeEmail: handleComposeEmailCallback,
    handleReplyToEmail: handleReplyToEmailCallback
  }
}
