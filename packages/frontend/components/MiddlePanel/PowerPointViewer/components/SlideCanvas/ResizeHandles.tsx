interface ResizeHandlesProps {
  onResizeStart: (e: React.MouseEvent, handle: string) => void
  scaleFactor: number
}

export function ResizeHandles({ 
  onResizeStart, 
  scaleFactor 
}: ResizeHandlesProps) {
  const baseHandleSize = 8
  const handleSize = baseHandleSize * scaleFactor
  const handleOffset = handleSize / 2
  const scaledBorderWidth = 2 * scaleFactor

  const baseClass = "resize-handle absolute bg-primary rounded-full pointer-events-auto z-20"

  return (
    <>
      {/* Corner handles */}
      <div
        className={`${baseClass} cursor-nwse-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: `-${handleOffset}px`,
          top: `-${handleOffset}px`,
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'top-left')}
      />
      <div
        className={`${baseClass} cursor-nesw-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          right: `-${handleOffset}px`,
          top: `-${handleOffset}px`,
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'top-right')}
      />
      <div
        className={`${baseClass} cursor-nwse-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          right: `-${handleOffset}px`,
          bottom: `-${handleOffset}px`,
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'bottom-right')}
      />
      <div
        className={`${baseClass} cursor-nesw-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: `-${handleOffset}px`,
          bottom: `-${handleOffset}px`,
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'bottom-left')}
      />
      {/* Edge handles */}
      <div
        className={`${baseClass} cursor-ns-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: '50%',
          top: `-${handleOffset}px`,
          transform: 'translateX(-50%)',
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'top')}
      />
      <div
        className={`${baseClass} cursor-ns-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: '50%',
          bottom: `-${handleOffset}px`,
          transform: 'translateX(-50%)',
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'bottom')}
      />
      <div
        className={`${baseClass} cursor-ew-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          left: `-${handleOffset}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'left')}
      />
      <div
        className={`${baseClass} cursor-ew-resize`}
        style={{
          width: `${handleSize}px`,
          height: `${handleSize}px`,
          right: `-${handleOffset}px`,
          top: '50%',
          transform: 'translateY(-50%)',
          border: `${scaledBorderWidth}px solid hsl(var(--background))`,
        }}
        onMouseDown={(e) => onResizeStart(e, 'right')}
      />
    </>
  )
}
