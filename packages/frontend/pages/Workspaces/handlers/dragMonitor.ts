import React from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { Panel, PanelGroup, FileTab, SplitDirection, SplitPlacement, DragState } from '../types';
import { findTabInAllLayouts } from './findTabInAllLayouts';
import { addTabToPanel, removeTabFromPanel } from './panelUtils';
import { getPanelDropZone } from './panelDropIntent';

interface CreateDragMonitorParams {
  panelLayout: PanelGroup;
  assistantDockLayout: PanelGroup;
  dragStateRef: React.MutableRefObject<DragState>;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>;
  setActivePanelId: React.Dispatch<React.SetStateAction<string>>;
  setAssistantDockLayout: React.Dispatch<React.SetStateAction<PanelGroup>>;
  setActiveAssistantPanelId: React.Dispatch<React.SetStateAction<string>>;
  splitPanelCallback: (panelId: string, direction: SplitDirection, newFileTab?: FileTab, placement?: SplitPlacement) => void;
}

export const createDragMonitor = ({
  panelLayout,
  assistantDockLayout,
  dragStateRef,
  setDragState,
  setPanelLayout,
  setActivePanelId,
  setAssistantDockLayout,
  setActiveAssistantPanelId,
  splitPanelCallback,
}: CreateDragMonitorParams) => {
  // Determine which dock root a panel belongs to
  const getTargetDockRoot = (panelId: string): 'main' | 'assistant' => {
    return panelId.startsWith('assistant-') ? 'assistant' : 'main';
  };

  const resetDragState = () => {
    setDragState({
      isDragging: false,
      draggedTab: null,
      draggedFromPanel: null,
      dragStartPosition: null,
      currentPosition: null,
      dragDirection: null,
      dropZone: null,
      dropTargetPanel: null,
    });
  };

  return monitorForElements({
    onDragStart({ source, location }: any) {
      if (source?.data?.type !== 'tab') return;
      const { tab: dragged } = findTabInAllLayouts(source.data.id, panelLayout, assistantDockLayout);
      const input = location?.current?.input;
      const pos = input && typeof input.clientX === 'number' && typeof input.clientY === 'number'
        ? { x: input.clientX, y: input.clientY }
        : null;
      setDragState((prev) => ({
        ...prev,
        isDragging: true,
        draggedTab: dragged,
        draggedFromPanel: source.data.panelId || null,
        dragStartPosition: pos,
        currentPosition: pos || prev.currentPosition,
      }));
    },
    onDrag({ source, location }: any) {
      if (source?.data?.type !== 'tab') return;
      const input = location?.current?.input;
      if (input && typeof input.clientX === 'number' && typeof input.clientY === 'number') {
        const pos = { x: input.clientX, y: input.clientY };
        setDragState((prev) => ({ ...prev, currentPosition: pos }));
      }
    },
    onDrop({ location, source }: any) {
      if (source.data.type !== 'tab') return;
      const tabId = source.data.id as string;
      const dropTargets = location.current.dropTargets || [];
      const input = location?.current?.input;
      const currentPosition = input && typeof input.clientX === 'number' && typeof input.clientY === 'number'
        ? { x: input.clientX, y: input.clientY }
        : dragStateRef.current.currentPosition;

      // Find the dragged tab and its real source (across both layouts)
      const { tab: draggedTab, sourceLayout, sourcePanelId } = findTabInAllLayouts(tabId, panelLayout, assistantDockLayout);
      if (!draggedTab || !sourcePanelId) {
        resetDragState();
        return;
      }

      const tabStripTarget = dropTargets.find((target: any) => {
        const data = target.data as any;
        return data?.panelId && (data.type === 'tab' || data.type === 'container');
      });

      if (tabStripTarget) {
        const targetData = tabStripTarget.data as any;
        const targetPanelId = targetData.panelId as string;

        if (targetPanelId === sourcePanelId) {
          resetDragState();
          return;
        }

        const targetLayout = getTargetDockRoot(targetPanelId);
        const targetEdge = targetData.type === 'tab'
          ? extractClosestEdge(targetData)
          : null;
        const insertIndex = typeof targetData.index === 'number'
          ? targetData.index + (targetEdge === 'right' ? 1 : 0)
          : undefined;

        if (sourceLayout === 'main') {
          setPanelLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
        } else {
          setAssistantDockLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
        }

        if (targetLayout === 'main') {
          setPanelLayout((prev) => addTabToPanel(prev, targetPanelId, draggedTab, insertIndex));
          setActivePanelId(targetPanelId);
        } else {
          setAssistantDockLayout((prev) => addTabToPanel(prev, targetPanelId, draggedTab, insertIndex));
          setActiveAssistantPanelId(targetPanelId);
        }

        resetDragState();
        return;
      }

      // Determine target panel and edge
      const target = dropTargets.find((t: any) => t.data && (t.data as any).type === 'panel');
      let targetPanelId = target ? ((target.data as any).panelId as string) : '';

      // Fallback: compute panel from mouse position when not detected.
      if (!targetPanelId) {
        const pos = currentPosition;
        if (!pos) {
          resetDragState();
          return;
        }
        const el = document.elementFromPoint(pos.x, pos.y) as HTMLElement | null;
        const panelEl = el ? (el.closest('[data-panel-id]') as HTMLElement | null) : null;
        if (!panelEl) {
          resetDragState();
          return;
        }
        const pid = panelEl.getAttribute('data-panel-id') || '';
        if (!pid) {
          resetDragState();
          return;
        }
        targetPanelId = pid;
      }

      if (!targetPanelId) {
        resetDragState();
        return;
      }

      const edge = getPanelDropZone(targetPanelId, currentPosition);

      if (!edge) {
        if (targetPanelId === sourcePanelId) {
          resetDragState();
          return;
        }

        const targetLayout = getTargetDockRoot(targetPanelId);

        if (sourceLayout === 'main') {
          setPanelLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
        } else {
          setAssistantDockLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
        }

        if (targetLayout === 'main') {
          setPanelLayout((prev) => addTabToPanel(prev, targetPanelId, draggedTab));
          setActivePanelId(targetPanelId);
        } else {
          setAssistantDockLayout((prev) => addTabToPanel(prev, targetPanelId, draggedTab));
          setActiveAssistantPanelId(targetPanelId);
        }

        resetDragState();
        return;
      }

      const targetLayout = getTargetDockRoot(targetPanelId);
      const direction: SplitDirection = edge === 'left' || edge === 'right' ? 'horizontal' : 'vertical';
      const placement: SplitPlacement = edge === 'left' || edge === 'top' ? 'before' : 'after';
      
      // Remove tab from source layout
      if (sourceLayout === 'main') {
        setPanelLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
      } else {
        setAssistantDockLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
      }
      
      // Add tab to target layout via split
      if (targetLayout === 'main') {
        splitPanelCallback(targetPanelId, direction, draggedTab as FileTab, placement);
      } else {
        // Split in assistant layout
        const newPanelId = `assistant-panel-${Date.now()}`;
        setAssistantDockLayout((prev) => {
          const newPanel: Panel = {
            id: newPanelId,
            tabs: [draggedTab],
            activeTabId: draggedTab.id
          };
          
          const splitInLayout = (layout: PanelGroup): PanelGroup => {
            if (layout.type === 'panel' && layout.panel?.id === targetPanelId) {
              const existingPanelGroup: PanelGroup = { ...layout, size: 50 };
              const newPanelGroup: PanelGroup = {
                id: newPanelId,
                type: 'panel',
                panel: newPanel,
                size: 50
              };

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
                children: layout.children.map((child) => splitInLayout(child))
              };
            }
            return layout;
          };
          
          return splitInLayout(prev);
        });
        setActiveAssistantPanelId(newPanelId);
      }

      // Reset drag state after handling drop
      resetDragState();
    },
  });
};
