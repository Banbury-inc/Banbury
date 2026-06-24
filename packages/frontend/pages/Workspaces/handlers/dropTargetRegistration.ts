import React from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DragState } from '../types';
import { getPanelDropZoneFromElement } from './panelDropIntent';

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
        const input = args?.location?.current?.input || args?.input;
        if (input && typeof input.clientX === 'number' && typeof input.clientY === 'number') {
          const hoveredElement = document.elementFromPoint(input.clientX, input.clientY);
          if (hoveredElement?.closest('[data-tab-strip-panel-id]')) {
            setDragState((prev) => ({ ...prev, dropZone: null, dropTargetPanel: null }));
            return;
          }
        }

        const point = input && typeof input.clientX === 'number' && typeof input.clientY === 'number'
          ? { x: input.clientX, y: input.clientY }
          : null;
        const dropZone = point ? getPanelDropZoneFromElement(element, point) : null;
        setDragState((prev) => ({
          ...prev,
          dropTargetPanel: panelId,
          dropZone,
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
