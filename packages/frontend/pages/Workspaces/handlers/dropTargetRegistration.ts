import React from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DragState } from '../types';

interface RegisterDropTargetsParams {
  panelLayout: any;
  assistantDockLayout: any;
  setDragState: React.Dispatch<React.SetStateAction<DragState>>;
}

export const registerDropTargets = ({
  panelLayout,
  assistantDockLayout,
  setDragState,
}: RegisterDropTargetsParams) => {
  const panelNodes = Array.from(document.querySelectorAll('[data-panel-id]')) as HTMLElement[];
  const cleanups: Array<() => void> = [];
  
  panelNodes.forEach((element) => {
    const panelId = element.getAttribute('data-panel-id');
    if (!panelId) return;
    
    const cleanup = dropTargetForElements({
      element,
      getData: (args: any) =>
        attachClosestEdge({ type: 'panel', panelId }, {
          element,
          input: args.input,
          allowedEdges: ['left', 'right', 'top', 'bottom'],
        }),
      onDrag: (args: any) => {
        if (!args?.source?.data || args.source.data.type !== 'tab') return;
        const edge = extractClosestEdge(args.self.data);
        setDragState((prev) => ({
          ...prev,
          dropTargetPanel: panelId,
          dropZone: edge as any,
        }));
      },
      onDragLeave: () => {
        setDragState((prev) => ({ ...prev, dropZone: null, dropTargetPanel: null }));
      },
      onDrop: () => {
        setDragState((prev) => ({ ...prev, dropZone: null, dropTargetPanel: null }));
      },
    });
    cleanups.push(cleanup);
  });

  return () => cleanups.forEach((fn) => fn());
};
