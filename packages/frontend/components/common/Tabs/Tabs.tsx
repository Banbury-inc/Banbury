import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable, monitorForElements, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { X as CloseIcon, Plus as AddIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SplitPreview } from '../SplitPreview';

import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';

export interface Tab {
  id: string;
  label: string;
  path?: string;
}

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  onClose?: () => void;
  style?: React.CSSProperties;
  isNew?: boolean;
  isClosing?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabAdd?: () => void;
  onReorder?: (sourceIndex: number, destinationIndex: number) => void;
  dragContext?: Record<string, any>;
  suppressReorderIndicator?: boolean;
  onSplitPreview?: (direction: 'horizontal' | 'vertical' | null, position: { x: number; y: number }) => void;
}

const DragPreview = ({ label }: { label: string }) => (
  <div
    className="bg-zinc-100 dark:bg-[#1e1e1e] text-zinc-900 dark:text-white w-24 h-8 px-3 py-2 rounded-md flex items-center gap-2 shadow-lg border border-zinc-300 dark:border-[#333]"
  >
    <div className="w-4 h-4 flex items-center justify-center">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M14 4v10H2V4h12zm0-1H2a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1zm-1-1V1H3v1h10z"/>
      </svg>
    </div>
    <span className="truncate">{label}</span>
  </div>
);

export const TabComponent = ({ label, isActive, onClick, onClose, style, isNew, isClosing }: TabProps) => (
  <div
    onClick={onClick}
    style={style}
    data-testid={`tab-${label}`}
    className={`
      tab
      ${isActive ? 'tab--active' : ''}
      ${isNew ? 'animate-tab-enter opacity-0' : ''}
      ${isClosing ? 'animate-tab-exit' : ''}
      px-4 
      py-2
      text-sm
      font-medium
      transition-colors 
      duration-150
      relative
      flex
      items-center
      justify-between
      gap-3
      min-w-[140px]
      max-w-[240px]
      border-r border-zinc-200/50 dark:border-zinc-800/50
      ${isActive 
        ? 'text-zinc-900 dark:text-white bg-accent' 
        : 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-[#2d2d2d] hover:bg-accent/50 dark:hover:bg-accent/50 hover:text-zinc-900 dark:hover:text-white'}
      focus:outline-none
      group
    `}
  >
    <span className="truncate select-none">{label}</span>
    {onClose && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        id={`tab-close-button-${label}`}
        className="rounded hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all duration-150 p-0.5 opacity-0 group-hover:opacity-100"
      >
        <CloseIcon size={14} />
      </button>
    )}
  </div>
);

const DropIndicator = ({ left }: { edge: Edge; gap: string; left: number }) => (
  <div
    style={{
      position: 'fixed',
      backgroundColor: 'white',
      width: '2px',
      height: '32px',
      top: '28px',
      left: `${left}px`,
      transform: 'translateY(-50%)',
      transition: 'left 150ms ease',
      boxShadow: '0 0 3px rgba(126, 107, 242, 0.8)',
      borderRadius: '1px',
      zIndex: 10000,
    }}
  />
);

export const Tabs: React.FC<TabsProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  onTabClose, 
  onTabAdd,
  onReorder,
  dragContext,
  suppressReorderIndicator = false,
  onSplitPreview
}) => {
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [indicatorPosition, setIndicatorPosition] = useState<number | null>(null);
  const [newTabId, setNewTabId] = useState<string | null>(null);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);
  const [renderedTabs, setRenderedTabs] = useState(tabs);
  const [splitPreviewState, setSplitPreviewState] = useState<{
    direction: 'horizontal' | 'vertical' | null;
    position: { x: number; y: number };
    isVisible: boolean;
  }>({
    direction: null,
    position: { x: 0, y: 0 },
    isVisible: false,
  });
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevTabsLength = useRef(tabs.length);

  const handleTabClose = (tabId: string) => {
    if (tabs.length <= 1) {
      if (onTabClose) onTabClose(tabId);
      return;
    }
    setClosingTabId(tabId);
    setTimeout(() => {
      if (onTabClose) onTabClose(tabId);
      setClosingTabId(null);
    }, 200);
  };

  useEffect(() => {
    if (tabs.length > prevTabsLength.current) {
      const newTab = tabs[tabs.length - 1];
      if (tabs.length > 1) {
        setNewTabId(newTab.id);
        setTimeout(() => setRenderedTabs(tabs), 0);
      } else {
        setRenderedTabs(tabs);
      }
    } else {
      setRenderedTabs(tabs);
    }
    prevTabsLength.current = tabs.length;
  }, [tabs]);

  useEffect(() => {
    if (!newTabId) return;
    const timer = setTimeout(() => setNewTabId(null), 200);
    return () => clearTimeout(timer);
  }, [newTabId]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      getData: () => ({ type: 'container' }),
      onDrag: () => {},
      onDragLeave: () => {
        // Only clear the tab reorder indicator when leaving container
        setClosestEdge(null);
      },
      onDrop: () => setClosestEdge(null),
    });
  }, []);

  useEffect(() => {
    const cleanups = tabs.map((tab, index) => {
      const element = tabRefs.current[index];
      if (!element) return () => {};

      return combine(
        draggable({
          element,
          getInitialData: () => {
            return { id: tab.id, index, type: 'tab', ...(dragContext || {}) };
          },
          onGenerateDragPreview: ({ nativeSetDragImage }: { nativeSetDragImage?: (element: Element, x: number, y: number) => void }) => {
            if (!nativeSetDragImage) return;
            const previewEl = document.createElement('div');
            previewEl.style.position = 'fixed';
            previewEl.style.top = '0';
            previewEl.style.left = '0';
            previewEl.style.width = '100px';
            previewEl.style.height = '100px';
            document.body.appendChild(previewEl);
            const root = createRoot(previewEl);
            root.render(<DragPreview label={tab.label} />);
            nativeSetDragImage(previewEl, 10, 10);
            setTimeout(() => {
              root.unmount();
              document.body.removeChild(previewEl);
            }, 0);
          },
          onDrag: ({ location }: { location: { current: { input: { clientX?: number; clientY?: number } } } }) => {
            // Handle split preview logic
            const mousePosition = location.current.input.clientX !== undefined && location.current.input.clientY !== undefined
              ? { x: location.current.input.clientX, y: location.current.input.clientY }
              : null;
            
            if (mousePosition) {
              // Check if mouse is within the main content area (middle panel)
              const mainElement = document.querySelector('main.h-full');
              let isInMiddlePanel = false;
              let direction: 'horizontal' | 'vertical' | null = null;
              let previewPosition = mousePosition;
              
              if (mainElement) {
                const rect = mainElement.getBoundingClientRect();
                isInMiddlePanel = mousePosition.x >= rect.left && mousePosition.x <= rect.right && 
                                 mousePosition.y >= rect.top && mousePosition.y <= rect.bottom;
                
                if (isInMiddlePanel) {
                  // Use panel dimensions instead of viewport dimensions
                  const panelWidth = rect.width;
                  const panelHeight = rect.height;
                  
                  // Check if mouse is near the edges of the panel
                  const edgeThreshold = Math.min(150, Math.min(panelWidth, panelHeight) * 0.25);
                  const relativeX = mousePosition.x - rect.left;
                  const relativeY = mousePosition.y - rect.top;
                  
                  const isNearLeftEdge = relativeX < edgeThreshold;
                  const isNearRightEdge = relativeX > panelWidth - edgeThreshold;
                  const isNearTopEdge = relativeY < edgeThreshold;
                  const isNearBottomEdge = relativeY > panelHeight - edgeThreshold;
                  
                  if (isNearLeftEdge || isNearRightEdge) direction = 'vertical';
                  else if (isNearTopEdge || isNearBottomEdge) direction = 'horizontal';
                  else direction = 'vertical'; // default to vertical split in the middle

                  // Center the preview in the middle of the panel
                  previewPosition = { x: rect.left + panelWidth / 2, y: rect.top + panelHeight / 2 };
                }
              }
              
              setSplitPreviewState({
                direction: isInMiddlePanel ? direction : null,
                position: isInMiddlePanel ? previewPosition : mousePosition,
                isVisible: isInMiddlePanel,
              });
              
              if (onSplitPreview) {
                onSplitPreview(
                  isInMiddlePanel ? direction : null,
                  isInMiddlePanel ? previewPosition : mousePosition
                );
              }
            }
          },
          onDrop: () => {
            setSplitPreviewState({
              direction: null,
              position: { x: 0, y: 0 },
              isVisible: false,
            });
            if (onSplitPreview) {
              onSplitPreview(null, { x: 0, y: 0 });
            }
          },
          onDropTargetChange: () => {
            // Clear split preview when dropping on a target
            setSplitPreviewState({
              direction: null,
              position: { x: 0, y: 0 },
              isVisible: false,
            });
            if (onSplitPreview) {
              onSplitPreview(null, { x: 0, y: 0 });
            }
          },
        }),
        dropTargetForElements({
          element,
          getData: (args: any) => attachClosestEdge(
            { id: tab.id, index, type: 'tab' },
            {
              element,
              input: args.input,
              allowedEdges: ['left', 'right'],
            }
          ),
          onDrag(args: { self: { data: unknown } }) {
            const edge = extractClosestEdge(args.self.data);
            if (edge) {
              const rect = element.getBoundingClientRect();
              setClosestEdge(edge);
              setIndicatorPosition(edge === 'left' ? rect.left : rect.right);
            }
          },
          onDragLeave() {
            // Only clear the tab reorder indicator, not the global drag state
            setClosestEdge(null);
            setIndicatorPosition(null);
          },
          onDrop() {
            setClosestEdge(null);
            setIndicatorPosition(null);
          },
        })
      );
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [tabs]);

  useEffect(() => {
    return monitorForElements({
      onDrop({ location, source }) {
        if (source.data.type !== 'tab') return;
        const target = location.current.dropTargets[0];
        if (!target) return;
        const sourceIndex = tabs.findIndex((t) => t.id === source.data.id);
        if (sourceIndex < 0) return;
        if (target.data.type === 'container') {
          if (onReorder) onReorder(sourceIndex, tabs.length);
        } else {
          const targetIndex = tabs.findIndex((t) => t.id === target.data.id);
          const edge = extractClosestEdge(target.data);
          if (targetIndex >= 0 && onReorder) {
            const finalIndex = edge === 'right' ? targetIndex + 1 : targetIndex;
            onReorder(sourceIndex, finalIndex);
          }
        }
      },
    });
  }, [tabs, onReorder]);

  return (
    <div ref={containerRef} className="flex items-stretch bg-accent">
      <style>
        {`
          .tab {
            -webkit-app-region: no-drag;
            cursor: grab;
            position: relative;
            transform-origin: left center;
          }
          .tab.dragging { opacity: 0.5; }
          @keyframes tabEnter { 0% { opacity: 0; transform: scaleX(0); } 100% { opacity: 1; transform: scaleX(1); } }
          @keyframes tabExit { 0% { opacity: 1; transform: scaleX(1); } 100% { opacity: 0; transform: scaleX(0); } }
          .animate-tab-enter { animation: tabEnter 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards; will-change: transform, opacity; }
          .animate-tab-exit { animation: tabExit 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards; will-change: transform, opacity; }
        `}
      </style>
      {renderedTabs.map((tab, index) => (
        <div ref={(el) => (tabRefs.current[index] = el)} key={tab.id} className="relative">
          <TabComponent
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            onClose={onTabClose ? () => handleTabClose(tab.id) : undefined}
            isNew={tab.id === newTabId}
            isClosing={tab.id === closingTabId}
          />
        </div>
      ))}
      {onTabAdd && (
        <button
          onClick={() => onTabAdd?.()}
          data-testid="new-tab-button"
          className="px-4 py-2 text-sm transition-colors duration-150 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#2d2d2d] bg-transparent"
        >
          <AddIcon size={14} />
        </button>
      )}
      {closestEdge && indicatorPosition !== null && !suppressReorderIndicator && (
        <DropIndicator edge={closestEdge} gap="1px" left={indicatorPosition} />
      )}
      
      {/* Split Preview (render internally only if no external handler is provided) */}
      {!onSplitPreview && (
        <SplitPreview
          direction={splitPreviewState.direction}
          position={splitPreviewState.position}
          isVisible={splitPreviewState.isVisible}
        />
      )}
    </div>
  );
};

export default Tabs;


