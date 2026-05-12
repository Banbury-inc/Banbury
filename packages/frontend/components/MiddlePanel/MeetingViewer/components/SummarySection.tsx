import { Loader2, Save, RefreshCw, Sparkles } from "lucide-react"
import { RefObject } from "react"
import { Button } from "../../../common/ui/button"
import { Typography } from "../../../common/ui/typography"
import { MeetingSummaryEditor, MeetingSummaryEditorRef } from "../MeetingSummaryEditor"

interface SummarySectionProps {
  summaryEditorRef: RefObject<MeetingSummaryEditorRef>
  summaryHtml: string
  isGeneratingSummary: boolean
  isSavingSummary: boolean
  hasUnsavedChanges: boolean
  hasSummary: boolean
  hasTranscription: boolean
  meetingId?: string
  onSave: () => void
  onRegenerate: () => void
  onGenerate: () => void
  onContentChange: (content: string) => void
}

export function SummarySection({
  summaryEditorRef,
  summaryHtml,
  isGeneratingSummary,
  isSavingSummary,
  hasUnsavedChanges,
  hasSummary,
  hasTranscription,
  meetingId,
  onSave,
  onRegenerate,
  onGenerate,
  onContentChange
}: SummarySectionProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-shrink-0 flex-col gap-2 border-b border-border bg-muted/30 px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <Typography variant="h4" className="text-base font-semibold leading-none">
              Summary
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              size="xs"
              variant="primary"
              onClick={onSave}
              disabled={isSavingSummary || isGeneratingSummary}
              className="min-w-[72px]"
            >
              {isSavingSummary ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  <span className="text-xs">Saving…</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Save</span>
                </>
              )}
            </Button>
          )}
          {hasSummary && (
            <Button
              size="xs"
              variant="ghost"
              onClick={onRegenerate}
              disabled={isGeneratingSummary || isSavingSummary || !hasTranscription}
              className="min-w-[104px]"
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  <span className="text-xs">Regenerating…</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-xs">Regenerate</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Always render the editor so the ref is available for summary generation */}
      <div className={hasSummary || isGeneratingSummary ? "min-h-0 flex-1 p-3" : "hidden"}>
        <MeetingSummaryEditor
          key={meetingId}
          initialContent={summaryHtml}
          isReadOnly={isGeneratingSummary}
          isLoading={isGeneratingSummary}
          placeholder="Summary will appear here..."
          onContentChange={onContentChange}
          ref={summaryEditorRef}
        />
      </div>

      {!hasSummary && !isGeneratingSummary && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ring-1 ring-border">
            <Sparkles className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="max-w-md space-y-1">
            <Typography variant="p" className="text-sm font-semibold">
              No summary yet
            </Typography>
            <Typography variant="p" className="text-sm text-muted-foreground">
              {hasTranscription
                ? "Generate an AI summary from the meeting transcript."
                : "Upload a recording or wait for transcription to complete."}
            </Typography>
          </div>
          <Button
            size="sm"
            onClick={onGenerate}
            disabled={isGeneratingSummary || !hasTranscription}
            className="mt-5"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Summary
          </Button>
        </div>
      )}
    </section>
  )
}
