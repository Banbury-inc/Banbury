import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '../../../ui/button';

interface ToolbarProps {
  pageNumber: number;
  numPages: number;
  scale: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function Toolbar({
  pageNumber,
  numPages,
  scale,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="icon-xs"
          onClick={onPrevPage}
          disabled={pageNumber <= 1}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm font-medium">
            Page
          </span>
          <span className="text-muted-foreground text-sm font-medium min-w-[60px] text-center">
            {pageNumber} of {numPages}
          </span>
        </div>
        <Button
          variant="primary"
          size="icon-xs"
          onClick={onNextPage}
          disabled={pageNumber >= numPages}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="icon-xs"
          onClick={onZoomOut}
          disabled={scale <= 0.5}
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="primary"
          size="xs"
          onClick={onResetZoom}
          title="Reset zoom to 100%"
        >
          {Math.round(scale * 100)}%
        </Button>
        <Button
          variant="primary"
          size="icon-xs"
          onClick={onZoomIn}
          disabled={scale >= 3.0}
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
