import { Button } from '../../../../../ui/button'
import {
  Play,
  Share2,
  Save,
  Download,
  RefreshCw,
} from 'lucide-react'

interface SlideActionsToolbarProps {
  onSave: () => void
  onDownload: () => void
  onShare?: () => void
  onStartPresentation?: () => void
  saving: boolean
  hasUnsavedChanges: boolean
}

export function SlideActionsToolbar({
  onSave,
  onDownload,
  onShare,
  onStartPresentation,
  saving,
  hasUnsavedChanges,
}: SlideActionsToolbarProps) {
  return (
    <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap ml-2">
      <div className="w-px h-6 bg-border mx-2" />

      {/* Present Button */}
      {onStartPresentation && (
        <>
          <Button
            variant="default"
            size="xs"
            onClick={onStartPresentation}
            className="gap-1"
            title="Start Presentation"
          >
            <Play size={14} />
            Present
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
        </>
      )}

      {/* Share, Save & Download */}
      <div className="flex items-center gap-1">
        {onShare && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onShare}
            title="Share"
          >
            <Share2 size={16} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onSave}
          disabled={saving || !hasUnsavedChanges}
          title="Save"
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDownload}
          title="Download"
        >
          <Download size={16} />
        </Button>
      </div>
    </div>
  )
}
