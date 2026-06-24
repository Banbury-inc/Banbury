import { Allotment } from 'allotment'
import Image from 'next/image'
import React from 'react'
import { PanelGroup, Panel } from '../types'
import { Kbd, KbdGroup } from '../../../components/common/ui/kbd'
import { getActiveKey, KeybindsState } from '../../../components/modals/settings-tabs/handlers/keybindHandlers'
import BanburyLogo from '../../../assets/images/New_Logo.png'

interface RenderPanelGroupParams {
  renderPanelWrapper: (panel: Panel) => React.ReactNode
  isMac: boolean
  keybinds: KeybindsState
  isMobile: boolean
}

export function createRenderPanelGroup({
  renderPanelWrapper,
  isMac,
  keybinds,
  isMobile
}: RenderPanelGroupParams): (group: PanelGroup) => React.ReactNode {
  // Helper to render a keybind display
  const renderKeybind = (keyString: string) => {
    const hasShift = keyString.includes('shift+')
    const key = keyString.replace('shift+', '').toUpperCase()
    
    return (
      <KbdGroup>
        <Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd>
        {hasShift && (
          <>
            <span className="text-muted-foreground">+</span>
            <Kbd>{isMac ? '⇧' : 'Shift'}</Kbd>
          </>
        )}
        <span className="text-muted-foreground">+</span>
        <Kbd>{key}</Kbd>
      </KbdGroup>
    )
  }

  const renderPanelGroup = (group: PanelGroup): React.ReactNode => {
    if (group.type === 'panel' && group.panel) {
      return renderPanelWrapper(group.panel)
    }
    
    if (group.type === 'group' && group.children) {
      return (
        <Allotment
          vertical={group.direction === 'vertical'}
          proportionalLayout={true}
          defaultSizes={group.children.map((child) => child.size || 50)}
          key={group.id}
          className="h-full"
        >
          {group.children.map((child) => (
            <Allotment.Pane key={child.id}>
              {renderPanelGroup(child)}
            </Allotment.Pane>
          ))}
        </Allotment>
      )
    }
    
    const newAgentKey = getActiveKey(keybinds.newAgent)
    const searchFilesKey = getActiveKey(keybinds.searchFiles)
    const toggleSidebarKey = getActiveKey(keybinds.toggleFileSidebar)
    const toggleSidebarAltKey = getActiveKey(keybinds.toggleFileSidebarAlt)
    const toggleAssistantPanelKey = getActiveKey(keybinds.toggleAssistantPanel)

    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-4">
        <Image 
          src={BanburyLogo} 
          alt="Banbury" 
          className="opacity-20 dark:opacity-15 invert dark:invert-0"
          width={isMobile ? 120 : 160}
          height={isMobile ? 120 : 160}
          priority
        />
        <div className="flex flex-col items-center gap-4 max-w-md w-full">
          {!isMobile ? (
            <>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Create a new agent</p>
                {renderKeybind(newAgentKey)}
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Search files</p>
                {renderKeybind(searchFilesKey)}
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Toggle left sidebar</p>
                <div className="flex items-center gap-2">
                  {renderKeybind(toggleSidebarKey)}
                  <span className="text-xs text-muted-foreground">or</span>
                  {renderKeybind(toggleSidebarAltKey)}
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Toggle right sidebar</p>
                {renderKeybind(toggleAssistantPanelKey)}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-muted-foreground mobile-text">Tap the menu buttons above to get started</p>
              <p className="text-xs text-muted-foreground mobile-text">Use the Files button to browse your workspace</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return renderPanelGroup
}
