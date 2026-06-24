import { Save, Download, Share2 } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import type { DocumentAutosaveStatus } from '../handlers/use-document-autosave'

interface DocumentActionButtonsProps {
  onShare?: () => void
  onSave?: () => void
  onDownload?: () => void
  saving?: boolean
  canSave?: boolean
  autosaveStatus?: DocumentAutosaveStatus
  lastSavedAt?: Date | null
}

function getSaveStatusLabel(status?: DocumentAutosaveStatus, lastSavedAt?: Date | null) {
  if (status === 'saving') return 'Saving...'
  if (status === 'dirty') return 'Unsaved changes'
  if (status === 'error') return 'Unable to save'
  if (status !== 'saved') return null
  if (!lastSavedAt) return 'Saved'

  const secondsAgo = Math.max(0, Math.floor((Date.now() - lastSavedAt.getTime()) / 1000))
  if (secondsAgo < 5) return 'Saved just now'
  if (secondsAgo < 60) return `Saved ${secondsAgo}s ago`

  return 'Saved'
}

export function DocumentActionButtons({
  onShare,
  onSave,
  onDownload,
  saving = false,
  canSave = false,
  autosaveStatus,
  lastSavedAt,
}: DocumentActionButtonsProps) {
  if (!onShare && !onSave && !onDownload) {
    return null
  }

  const saveStatusLabel = getSaveStatusLabel(saving ? 'saving' : autosaveStatus, lastSavedAt)
  const statusClassName = autosaveStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'

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
        {saveStatusLabel && (
          <span className={`hidden sm:inline text-xs ${statusClassName}`} aria-live="polite">
            {saveStatusLabel}
          </span>
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
