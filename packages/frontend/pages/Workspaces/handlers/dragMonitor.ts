import React from 'react';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { Panel, PanelGroup, FileTab, SplitDirection, DragState } from '../types';
import { findTabInAllLayouts } from './findTabInAllLayouts';
import { removeTabFromPanel } from './panelUtils';

interface CreateDragMonitorParams {
  panelLayout: PanelGroup;
  assistantDockLayout: PanelGroup;
  dragStateRef: React.MutableRefObject<DragState>;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
  setPanelLayout: React.Dispatch<React.SetStateAction<PanelGroup>>;
  setAssistantDockLayout: React.Dispatch<React.SetStateAction<PanelGroup>>;
  setActiveAssistantPanelId: React.Dispatch<React.SetStateAction<string>>;
  splitPanelCallback: (panelId: string, direction: SplitDirection, newFileTab?: FileTab) => void;
}

export const createDragMonitor = ({
  panelLayout,
  assistantDockLayout,
  dragStateRef,
  setDragState,
  setPanelLayout,
  setAssistantDockLayout,
  setActiveAssistantPanelId,
  splitPanelCallback,
}: CreateDragMonitorParams) => {
  // Determine which dock root a panel belongs to
  const getTargetDockRoot = (panelId: string): 'main' | 'assistant' => {
    return panelId.startsWith('assistant-') ? 'assistant' : 'main';
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

      // Determine target panel and edge
      const target = location.current.dropTargets.find((t: any) => t.data && (t.data as any).type === 'panel');
      let edge = target ? (extractClosestEdge(target.data) as 'left' | 'right' | 'top' | 'bottom' | null) : null;
      let targetPanelId = target ? ((target.data as any).panelId as string) : '';

      // Fallback: compute panel and edge from mouse position when not detected (e.g., dropping over tab header)
      if (!target || !edge || !targetPanelId) {
        const pos = dragStateRef.current.currentPosition;
        if (!pos) {
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
          return;
        }
        const el = document.elementFromPoint(pos.x, pos.y) as HTMLElement | null;
        const panelEl = el ? (el.closest('[data-panel-id]') as HTMLElement | null) : null;
        if (!panelEl) {
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
          return;
        }
        const pid = panelEl.getAttribute('data-panel-id') || '';
        if (!pid) {
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
          return;
        }
        targetPanelId = pid;
        const rect = panelEl.getBoundingClientRect();
        const relX = Math.max(0, Math.min(pos.x - rect.left, rect.width));
        const relY = Math.max(0, Math.min(pos.y - rect.top, rect.height));
        const leftDist = relX;
        const rightDist = rect.width - relX;
        const topDist = relY;
        const bottomDist = rect.height - relY;
        const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);
        if (minDist === leftDist) edge = 'left';
        else if (minDist === rightDist) edge = 'right';
        else if (minDist === topDist) edge = 'top';
        else edge = 'bottom';
      }

      if (!edge || !targetPanelId) {
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
        return;
      }

      // Find the dragged tab and its real source (across both layouts)
      const { tab: draggedTab, sourceLayout, sourcePanelId } = findTabInAllLayouts(tabId, panelLayout, assistantDockLayout);
      if (!draggedTab || !sourcePanelId) {
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
        return;
      }

      const targetLayout = getTargetDockRoot(targetPanelId);
      const direction: SplitDirection = edge === 'left' || edge === 'right' ? 'horizontal' : 'vertical';
      
      // Remove tab from source layout
      if (sourceLayout === 'main') {
        setPanelLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
      } else {
        setAssistantDockLayout((prev) => removeTabFromPanel(prev, sourcePanelId, tabId));
      }
      
      // Add tab to target layout via split
      if (targetLayout === 'main') {
        splitPanelCallback(targetPanelId, direction, draggedTab as FileTab);
      } else {
        // Split in assistant layout
        setAssistantDockLayout((prev) => {
          const newPanelId = `assistant-panel-${Date.now()}`;
          const newPanel: Panel = {
            id: newPanelId,
            tabs: [draggedTab],
            activeTabId: draggedTab.id
          };
          
          const splitInLayout = (layout: PanelGroup): PanelGroup => {
            if (layout.type === 'panel' && layout.panel?.id === targetPanelId) {
              return {
                id: `group-${Date.now()}`,
                type: 'group',
                direction,
                children: [
                  { ...layout, size: 50 },
                  {
                    id: newPanelId,
                    type: 'panel',
                    panel: newPanel,
                    size: 50
                  }
                ]
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
        setActiveAssistantPanelId(`assistant-panel-${Date.now()}`);
      }

      // Reset drag state after handling drop
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
    },
  });
};
