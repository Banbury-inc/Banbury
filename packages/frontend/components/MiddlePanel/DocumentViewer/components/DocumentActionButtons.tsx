import { Save, Download, Share2 } from 'lucide-react'
import { Button } from '../../../ui/button'

interface DocumentActionButtonsProps {
  onShare?: () => void
  onSave?: () => void
  onDownload?: () => void
  saving?: boolean
  canSave?: boolean
}

export function DocumentActionButtons({
  onShare,
  onSave,
  onDownload,
  saving = false,
  canSave = false,
}: DocumentActionButtonsProps) {
  if (!onShare && !onSave && !onDownload) {
    return null
  }

  return (
    <div className="flex items-center gap-1 flex-shrink-0 whitespace-nowrap ml-2">
      <div className="w-px h-6 bg-border mx-2" />
      <div className="flex items-center gap-1">
        {onShare && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onShare}
            title="Share document"
          >
            <Share2 size={16} />
          </Button>
        )}
        {onSave && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onSave}
            disabled={saving || !canSave}
            title="Save document"
          >
            <Save size={16} />
          </Button>
        )}
        {onDownload && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={onDownload}
            title="Download document"
          >
            <Download size={16} />
          </Button>
        )}
      </div>
    </div>
  )
}
