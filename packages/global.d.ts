declare module '@atlaskit/pragmatic-drag-and-drop/element/adapter' {
  export const dropTargetForElements: any
  export const monitorForElements: (args: {
    onDragStart?: (args: any) => void
    onDrag?: (args: any) => void
    onDrop?: (args: any) => void
    onDropTargetChange?: (args: any) => void
  }) => () => void
  export const draggable: any
}

declare module '@atlaskit/pragmatic-drag-and-drop/combine' {
  export const combine: any
}

declare module '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge' {
  export const attachClosestEdge: any
  export const extractClosestEdge: any
}

declare module '@atlaskit/pragmatic-drag-and-drop-hitbox/types' {
  export type Edge = 'left' | 'right' | 'top' | 'bottom'
}

