'use client'

import { Loader2, PlusCircle, RefreshCw, Save, X } from 'lucide-react'

import { Button } from '../../../common/ui/button'

interface DatabaseViewerToolbarProps {
  tableName: string
  provider: string
  database: string
  schema?: string
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  onRefresh: () => void
  onSave: () => void
  onCancel: () => void
  onAddRow: () => void
}

export function DatabaseViewerToolbar({
  tableName,
  provider,
  database,
  schema,
  isDirty,
  isSaving,
  isLoading,
  onRefresh,
  onSave,
  onCancel,
  onAddRow,
}: DatabaseViewerToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-shrink-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">{tableName}</div>
        <div className="text-xs text-muted-foreground">
          {provider} • {database}{schema ? `.${schema}` : ''}
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={onAddRow}
          disabled={isLoading || isSaving}
          title="Add new row"
          className="gap-1"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Add Row
        </Button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={onRefresh}
          disabled={isLoading || isSaving}
          title="Refresh data"
          className="gap-1"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>

        <div className="w-px h-4 bg-border mx-0.5" />

        <Button
          type="button"
          size="xs"
          variant="default"
          onClick={onSave}
          disabled={!isDirty || isSaving || isLoading}
          title="Save changes"
          className="gap-1"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Save
        </Button>

        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={onCancel}
          disabled={!isDirty || isSaving}
          title="Discard changes"
          className="gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
