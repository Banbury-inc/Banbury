import { Loader2, Save, RefreshCw, Sparkles } from "lucide-react"
import { RefObject } from "react"
import { Button } from "../../../common/ui/button"
import { Typography } from "../../../common/ui/typography"
import { MeetingSummaryEditor } from "../MeetingSummaryEditor"

interface SummarySectionProps {
  summaryEditorRef: RefObject<any>
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h4" className="text-base font-semibold">
          Summary
        </Typography>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <Button
              size="xs"
              variant="primary"
              onClick={onSave}
              disabled={isSavingSummary || isGeneratingSummary}
            >
              {isSavingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <Typography variant="xs">Saving...</Typography>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  <Typography variant="xs">Save</Typography>
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
            >
              {isGeneratingSummary ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <Typography variant="xs">Regenerating...</Typography>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <Typography variant="xs">Regenerate</Typography>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      {/* Always render the editor so the ref is available for summary generation */}
      <div className={hasSummary || isGeneratingSummary ? "min-h-[200px]" : "hidden"}>
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
        <div className="flex flex-col items-center justify-center py-12">
          <Typography variant="h4" className="text-lg font-semibold mb-2">
            No Summary Available
          </Typography>
          <Typography variant="p" className="text-sm text-muted-foreground mb-6 text-center max-w-md">
            Generate an AI-powered summary based on the meeting transcription
          </Typography>
          <Button
            onClick={onGenerate}
            disabled={isGeneratingSummary || !hasTranscription}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Summary
          </Button>
        </div>
      )}
    </div>
  )
}
