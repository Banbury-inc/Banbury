import React, { useEffect, useRef, useState } from 'react';
import { X as CloseIcon, Plus as AddIcon } from 'lucide-react';
import { draggable, monitorForElements, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { ElementDropTargetGetFeedbackArgs } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { createRoot } from 'react-dom/client';

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
}

const DragPreview = ({ label }: { label: string }) => (
  <div
    className="bg-[#1e1e1e] text-white w-24 h-8 px-3 py-2 rounded-md flex items-center gap-2 shadow-lg border border-[#333]"
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
        mt-4
        pl-2  
      h-8
      px-3 
      min-w-[140px]
      text-sm 
      font-medium 
      relative 
      mx-0.5
      rounded-[5px_5px_0_0]
      flex
      items-center
      justify-between
      gap-2
      ${isActive 
        ? 'text-white bg-[#171717] before:absolute before:top-0 before:left-0 before:right-0 before:h-[0px] before:bg-white' 
        : 'text-white/70 hover:bg-[#2a2a2a] hover:h-7 hover:rounded-[5px_5px_5px_5px]'}
      hover:text-white 
      focus:outline-none
      z-[9999]
      first:ml-2
    `}
  >
    <span className="truncate pl-2 select-none">{label}</span>
    {onClose && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        id={`tab-close-button-${label}`}
        className="rounded-sm hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
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
      height: '28px',
      top: '25px',
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
  dragContext
}) => {
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);
  const [indicatorPosition, setIndicatorPosition] = useState<number | null>(null);
  const [newTabId, setNewTabId] = useState<string | null>(null);
  const [closingTabId, setClosingTabId] = useState<string | null>(null);
  const [renderedTabs, setRenderedTabs] = useState(tabs);
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
      onDragLeave: () => setClosestEdge(null),
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
          getInitialData: () => ({ id: tab.id, index, type: 'tab', ...(dragContext || {}) }),
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
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
        }),
        dropTargetForElements({
          element,
          getData: (args: ElementDropTargetGetFeedbackArgs) => attachClosestEdge(
            { id: tab.id, index, type: 'tab' },
            {
              element,
              input: args.input,
              allowedEdges: ['left', 'right'],
            }
          ),
          onDrag(args) {
            const edge = extractClosestEdge(args.self.data);
            if (edge) {
              const rect = element.getBoundingClientRect();
              setClosestEdge(edge);
              setIndicatorPosition(edge === 'left' ? rect.left : rect.right);
            }
          },
          onDragLeave() {
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
    <div ref={containerRef} className="flex items-center group">
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
          className="h-7 mt-4 px-3 ml-1 text-white/70 hover:text-white hover:bg-[#2a2a2a] rounded-[5px_5px_0_0] transition-colors z-[9999]"
        >
          <AddIcon size={14} />
        </button>
      )}
      {closestEdge && indicatorPosition !== null && (
        <DropIndicator edge={closestEdge} gap="1px" left={indicatorPosition} />
      )}
    </div>
  );
};

export default Tabs;


