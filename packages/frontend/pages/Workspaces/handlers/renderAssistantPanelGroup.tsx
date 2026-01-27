import React from 'react';
import { Allotment } from 'allotment';
import { Panel, PanelGroup } from '../types';

interface RenderAssistantPanelGroupParams {
  group: PanelGroup;
  renderAssistantPanelWrapper: (panel: Panel) => React.ReactNode;
}

export const renderAssistantPanelGroup = ({
  group,
  renderAssistantPanelWrapper,
}: RenderAssistantPanelGroupParams): React.ReactNode => {
  if (group.type === 'panel' && group.panel) {
    return renderAssistantPanelWrapper(group.panel);
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
            {renderAssistantPanelGroup({ group: child, renderAssistantPanelWrapper })}
          </Allotment.Pane>
        ))}
      </Allotment>
    );
  }
  
  return null;
};
