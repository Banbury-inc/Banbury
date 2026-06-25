"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { AiConversationTabPane } from "../../../components/RightPanel/AiConversationTabPane"
import { getAllTabs } from "./panelUtils"
import type { PanelGroup, AiTab } from "../types"
import type { FileSystemItem } from "../../../utils/fileTreeUtils"
import type { MeetingSession } from "../../../types/meeting-types"

interface AiTabRuntimeHostProps {
  panelLayout: PanelGroup
  assistantDockLayout: PanelGroup
  userInfo: {
    username: string
    email?: string
  } | null
  selectedFile?: FileSystemItem | null
  selectedEmail?: any | null
  selectedMeeting?: MeetingSession | null
  onEmailSelect?: (email: any) => void
}

interface AiTabRuntimeProps {
  tab: AiTab
  userInfo: {
    username: string
    email?: string
  } | null
  selectedFile?: FileSystemItem | null
  selectedEmail?: any | null
  selectedMeeting?: MeetingSession | null
  onEmailSelect?: (email: any) => void
}

interface ContainerRect {
  top: number
  left: number
  width: number
  height: number
  visible: boolean
}

/**
 * Per-tab runtime component that keeps AiConversationTabPane alive
 * Uses absolute positioning to appear inside the panel container
 * The key insight: we NEVER change where the content is rendered in React,
 * we just change its visual position via CSS
 */
function AiTabRuntime({
  tab,
  userInfo,
  selectedFile,
  selectedEmail,
  selectedMeeting,
  onEmailSelect,
}: AiTabRuntimeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerRect, setContainerRect] = useState<ContainerRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    visible: false,
  })

  // Poll for container position and update our position to match
  useEffect(() => {
    let animationFrameId: number
    
    const updatePosition = () => {
      const container = document.querySelector(
        `[data-ai-tab-container="${tab.id}"]`
      ) as HTMLElement | null

      if (container) {
        const rect = container.getBoundingClientRect()
        const isVisible = !container.closest('.hidden') && 
                          container.offsetParent !== null &&
                          rect.width > 0 && 
                          rect.height > 0

        setContainerRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          visible: isVisible,
        })
      } else {
        setContainerRect(prev => prev.visible ? { ...prev, visible: false } : prev)
      }

      animationFrameId = requestAnimationFrame(updatePosition)
    }

    animationFrameId = requestAnimationFrame(updatePosition)

    return () => cancelAnimationFrame(animationFrameId)
  }, [tab.id])

  // Render the conversation pane with absolute positioning
  // It stays in the same place in the React tree but appears where the container is
  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: containerRect.top,
        left: containerRect.left,
        width: containerRect.width,
        height: containerRect.height,
        visibility: containerRect.visible ? "visible" : "hidden",
        pointerEvents: containerRect.visible ? "auto" : "none",
        zIndex: 10,
        overflow: "hidden",
      }}
      data-ai-tab-runtime={tab.id}
    >
      <AiConversationTabPane
        tabId={tab.id}
        threadId={tab.threadId}
        userInfo={userInfo}
        selectedFile={selectedFile}
        selectedEmail={selectedEmail}
        selectedMeeting={selectedMeeting}
        onEmailSelect={onEmailSelect}
      />
    </div>
  )
}

/**
 * Host component that discovers all AI tabs across both layouts
 * and maintains one persistent AiTabRuntime per tab
 * 
 * Key feature: We remember all tabs we've ever seen to prevent unmounting
 * during drag operations when a tab temporarily disappears from both layouts
 */
export function AiTabRuntimeHost({
  panelLayout,
  assistantDockLayout,
  userInfo,
  selectedFile,
  selectedEmail,
  selectedMeeting,
  onEmailSelect,
}: AiTabRuntimeHostProps) {
  // Track all known tabs - we never remove tabs from this until explicitly closed
  const [knownTabs, setKnownTabs] = useState<Map<string, AiTab>>(new Map())
  
  // Compute current AI tabs from both layouts
  const currentTabs = useMemo(() => {
    const mainTabs = getAllTabs(panelLayout)
    const assistantTabs = getAllTabs(assistantDockLayout)
    const allTabs = [...mainTabs, ...assistantTabs]
    return allTabs.filter((t): t is AiTab => t.type === "ai")
  }, [panelLayout, assistantDockLayout])

  // Update known tabs: add new tabs, remove tabs that are gone for good
  // We use a delay before removing to handle the drag transition period
  const pendingRemovalsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  
  useEffect(() => {
    const currentTabIds = new Set(currentTabs.map(t => t.id))
    
    setKnownTabs(prevKnown => {
      const newKnown = new Map(prevKnown)
      let hasChanges = false
      
      for (const tab of currentTabs) {
        // Cancel any pending removal for this tab
        const pendingRemoval = pendingRemovalsRef.current.get(tab.id)
        if (pendingRemoval) {
          clearTimeout(pendingRemoval)
          pendingRemovalsRef.current.delete(tab.id)
        }
        
        // Add to known tabs if not already there, or update if changed
        if (!newKnown.has(tab.id) || newKnown.get(tab.id) !== tab) {
          newKnown.set(tab.id, tab)
          hasChanges = true
        }
      }
      
      // Schedule removal for tabs that are no longer in layouts
      // (but give them time to reappear during drag transitions)
      for (const [tabId] of prevKnown) {
        if (!currentTabIds.has(tabId) && !pendingRemovalsRef.current.has(tabId)) {
          pendingRemovalsRef.current.set(tabId, setTimeout(() => {
            setKnownTabs(prev => {
              const next = new Map(prev)
              next.delete(tabId)
              return next
            })
            pendingRemovalsRef.current.delete(tabId)
          }, 1000)) // 1 second grace period for drag transitions
        }
      }
      
      return hasChanges ? newKnown : prevKnown
    })
  }, [currentTabs])

  // Clean up pending removals on unmount
  useEffect(() => {
    return () => {
      for (const timeout of pendingRemovalsRef.current.values()) {
        clearTimeout(timeout)
      }
    }
  }, [])

  // Convert known tabs map to array for rendering
  const tabsToRender = useMemo(() => Array.from(knownTabs.values()), [knownTabs])

  return (
    <>
      {tabsToRender.map((tab) => (
        <AiTabRuntime
          key={tab.id}
          tab={tab}
          userInfo={userInfo}
          selectedFile={selectedFile}
          selectedEmail={selectedEmail}
          selectedMeeting={selectedMeeting}
          onEmailSelect={onEmailSelect}
        />
      ))}
    </>
  )
}
