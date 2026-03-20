import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { DiffEditor, Editor } from '@monaco-editor/react'
import type { CodeEditProposal } from '../../../assistant/ClaudeRuntimeProvider/types/codeEdit'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { ApiService } from '../../../../backend/api/apiService'
import { getMonacoThemeId, registerMonacoThemes, type MonacoThemeRegistry } from './ideThemes'
import { getIDESettings } from '../../modals/settings-tabs/handlers/ideSettingsHandlers'
import { formatRelative } from './handlers/formatRelative'
import { getLanguageMonacoId, getLanguageDisplayName } from './languageUtils'
import { runPythonFile, type RunPythonFileResult } from './handlers/runPythonFile'
import { saveCodeFileToS3 } from './handlers/saveCodeFileToS3'
import { setCurrentCodeFileContext, clearCurrentCodeFileContext } from './handlers/currentCodeFileContext'
import { registerCodeEditor, unregisterCodeEditor } from '../../RightPanel/handlers/handle-code-edit-ai-response'
import { CodeHeader } from './CodeHeader'
import { Check, CheckCheck, Play, Save, X } from 'lucide-react'
import { matchCodeEditProposalToIdeFile } from './handlers/matchCodeEditProposalToIdeFile'
import {
  computeReviewDiffModified,
  tryAcceptAllRemainingReviewHunks,
  tryAcceptReviewHunk,
  type IdeCodeEditReviewSession,
} from './handlers/ideCodeEditReviewHandlers'

interface IDEProps {
  file: FileSystemItem
  userInfo?: {
    username: string
    email?: string
  } | null
  onSaveComplete?: () => void
}

interface PythonRunOutput {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  interpreter: string
  timedOut: boolean
  truncated: boolean
}

const IDE: React.FC<IDEProps> = ({ file, userInfo, onSaveComplete }) => {
  const [content, setContent] = useState('')
  const [isModified, setIsModified] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [currentFile, setCurrentFile] = useState<FileSystemItem>(file)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunningFile, setIsRunningFile] = useState(false)
  const [runOutput, setRunOutput] = useState<PythonRunOutput | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [codeEditStatus, setCodeEditStatus] = useState<string | null>(null)
  const [language, setLanguage] = useState<string>('plaintext')
  const [ideSettings, setIdeSettings] = useState(() => getIDESettings())

  const editorRef = useRef<Parameters<NonNullable<React.ComponentProps<typeof Editor>['onMount']>>[0] | null>(null)
  const appliedChangeIdsRef = useRef<Set<string>>(new Set())
  const [reviewSession, setReviewSession] = useState<IdeCodeEditReviewSession | null>(null)
  const reviewSessionRef = useRef<IdeCodeEditReviewSession | null>(null)
  const isModifiedAtReviewStartRef = useRef(false)
  const isModifiedRef = useRef(isModified)
  isModifiedRef.current = isModified
  reviewSessionRef.current = reviewSession

  const reviewDiffPreview = useMemo(() => {
    if (!reviewSession) return null
    return computeReviewDiffModified(reviewSession)
  }, [reviewSession])

  const handleRunActiveFile = useCallback(async () => {
    if (!currentFile) return

    try {
      setIsRunningFile(true)
      setRunError(null)

      const currentContent = editorRef.current?.getValue() || content
      const runResult: RunPythonFileResult = await runPythonFile({
        file: currentFile,
        content: currentContent,
      })

      setRunOutput({
        success: runResult.success,
        stdout: runResult.stdout,
        stderr: runResult.stderr,
        exitCode: runResult.exitCode,
        interpreter: runResult.interpreter,
        timedOut: runResult.timedOut,
        truncated: runResult.truncated,
      })
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Failed to run active file'
      setRunError(message)
    } finally {
      setIsRunningFile(false)
    }
  }, [content, currentFile])

  const loadFileContent = useCallback(async (fileItem: FileSystemItem) => {
    try {
      setLoading(true)
      setError(null)

      const downloadResult = await ApiService.Files.downloadS3File(fileItem.file_id || '', fileItem.name)

      if (!downloadResult.success) {
        throw new Error('Failed to download file')
      }

      const fileContent = await downloadResult.blob.text()
      const detectedLanguage = getLanguageMonacoId(fileItem.name)

      setLanguage(detectedLanguage)
      setCurrentFile(fileItem)
      setContent(fileContent)
      setIsModified(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file content')
    } finally {
      setLoading(false)
    }
  }, [])

  const saveFile = useCallback(async () => {
    if (!isModified || isSaving) return

    try {
      setIsSaving(true)
      const currentContent = editorRef.current?.getValue() || content
      await saveCodeFileToS3({
        file: currentFile,
        content: currentContent,
        username: userInfo?.username,
      })

      setContent(currentContent)
      setIsModified(false)
      setLastSavedAt(new Date())
      onSaveComplete?.()
    } catch {
      setError('Failed to save file')
    } finally {
      setIsSaving(false)
    }
  }, [content, currentFile, isModified, isSaving, userInfo, onSaveComplete])

  const handleEditorChange = useCallback((value: string | undefined) => {
    setContent(value || '')
    setIsModified(true)
  }, [])

  const dismissCodeEditReview = useCallback(() => {
    const session = reviewSessionRef.current
    if (!session) return
    setContent(session.baselineContent)
    setIsModified(isModifiedAtReviewStartRef.current)
    setReviewSession(null)
    setCodeEditStatus('AI code review dismissed.')
  }, [])

  const handleAcceptReviewHunk = useCallback(() => {
    const session = reviewSessionRef.current
    if (!session) return
    const outcome = tryAcceptReviewHunk(session)
    if (!outcome.ok) {
      setCodeEditStatus(outcome.error)
      return
    }
    setContent(outcome.nextWorking)
    setIsModified(true)
    const total = session.proposal.edits.length
    if (outcome.finished) {
      if (session.proposal.changeId) appliedChangeIdsRef.current.add(session.proposal.changeId)
      setCodeEditStatus(`Applied all ${total} AI edit${total === 1 ? '' : 's'}.`)
      setReviewSession(null)
      return
    }
    setCodeEditStatus(`Accepted hunk ${session.hunkIndex + 1} of ${total}. Review the next change.`)
    setReviewSession({
      ...session,
      workingContent: outcome.nextWorking,
      hunkIndex: outcome.nextIndex,
    })
  }, [])

  const handleAcceptAllReviewHunks = useCallback(() => {
    const session = reviewSessionRef.current
    if (!session) return
    const result = tryAcceptAllRemainingReviewHunks(session)
    if (!result.success) {
      setCodeEditStatus(result.error || 'Failed to apply AI edits.')
      return
    }
    if (session.proposal.changeId) appliedChangeIdsRef.current.add(session.proposal.changeId)
    setContent(result.updatedContent)
    setIsModified(true)
    setCodeEditStatus(
      `Applied ${result.appliedCount} AI edit${result.appliedCount === 1 ? '' : 's'}.`,
    )
    setReviewSession(null)
  }, [])

  useEffect(() => {
    loadFileContent(file)
  }, [file, loadFileContent])

  useEffect(() => {
    if (!currentFile?.path || !currentFile?.name) return
    const liveContent =
      reviewSession?.workingContent ?? editorRef.current?.getValue() ?? content
    setCurrentCodeFileContext({
      filePath: currentFile.path,
      fileName: currentFile.name,
      content: liveContent,
    })

    return () => {
      clearCurrentCodeFileContext(currentFile.path)
    }
  }, [content, currentFile?.path, currentFile?.name, reviewSession])

  useEffect(() => {
    const filePath = currentFile.path || ''
    if (!filePath) return

    registerCodeEditor({
      filePath,
      getContent: () => {
        const rs = reviewSessionRef.current
        if (rs) return rs.workingContent
        return editorRef.current?.getValue() || content
      },
      setContent,
      setIsModified,
      setStatus: setCodeEditStatus,
      appliedChangeIds: appliedChangeIdsRef.current,
    })

    return () => unregisterCodeEditor(filePath)
  }, [content, currentFile.path])

  useEffect(() => {
    if (!codeEditStatus) return
    const timeoutId = window.setTimeout(() => setCodeEditStatus(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [codeEditStatus])

  useEffect(() => {
    const idePath = currentFile.path || ''
    if (!idePath) return

    const onProposed = (event: Event) => {
      const detail = (event as CustomEvent<CodeEditProposal>).detail
      if (!detail?.filePath || !detail.edits?.length) return
      if (!matchCodeEditProposalToIdeFile(detail.filePath, idePath)) return
      if (appliedChangeIdsRef.current.has(detail.changeId)) {
        setCodeEditStatus('This AI code change was already applied.')
        return
      }
      const baseline = editorRef.current?.getValue() ?? content
      isModifiedAtReviewStartRef.current = isModifiedRef.current
      setReviewSession({
        proposal: detail,
        baselineContent: baseline,
        workingContent: baseline,
        hunkIndex: 0,
      })
      const n = detail.edits.length
      setCodeEditStatus(`Reviewing ${n} AI code edit${n === 1 ? '' : 's'}…`)
    }

    window.addEventListener('assistant-code-edit-proposed', onProposed as EventListener)
    return () => window.removeEventListener('assistant-code-edit-proposed', onProposed as EventListener)
  }, [content, currentFile.path])

  useEffect(() => {
    const idePath = currentFile.path || ''
    setReviewSession((session) => {
      if (!session) return null
      if (!idePath || !matchCodeEditProposalToIdeFile(session.proposal.filePath, idePath)) return null
      return session
    })
  }, [currentFile.path])

  useEffect(() => {
    const filePath = currentFile.path || ''
    if (!filePath) return

    const onCodeEditFailed = (event: Event) => {
      const detail = (event as CustomEvent<{ reason?: string; filePath?: string }>).detail
      if (!detail?.reason) return
      if (detail.reason === 'wrong-target-file') {
        setCodeEditStatus(
          'Could not apply AI edit: this proposal targets a different file than the one open here. Open the correct file, then accept again.'
        )
        return
      }
      if (detail.reason === 'no-matching-editor') {
        if (!detail.filePath || detail.filePath !== filePath) return
        setCodeEditStatus(
          'Could not apply AI edit: editor was not ready for this file. Keep this file open in the IDE and try again.'
        )
      }
    }

    window.addEventListener('assistant-code-edit-failed', onCodeEditFailed as EventListener)
    return () => window.removeEventListener('assistant-code-edit-failed', onCodeEditFailed as EventListener)
  }, [currentFile.path])

  useEffect(() => {
    const handleSettingsUpdate = () => setIdeSettings(getIDESettings())
    window.addEventListener('ide-settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('ide-settings-updated', handleSettingsUpdate)
  }, [])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isModified) saveFile()
    }, 30000)
    return () => clearInterval(interval)
  }, [isModified, saveFile])

  // Cmd/Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveFile()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveFile])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background" aria-busy="true">
        <div className="text-center" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4 motion-reduce:animate-none" aria-hidden />
          <p className="text-muted-foreground">Loading IDE...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h3 className="text-xl font-semibold text-foreground mb-2">Error loading IDE</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-muted-foreground text-sm">Try opening another file or refreshing.</p>
        </div>
      </div>
    )
  }

  const headerActions = (
    <>
      {currentFile && (
        <button
          type="button"
          onClick={saveFile}
          disabled={!isModified || isSaving}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[2rem] inline-flex items-center justify-center gap-1.5"
          title={isModified ? `Save ${currentFile.name}` : `${currentFile.name} is already saved`}
          aria-label={isModified ? `Save ${currentFile.name}` : `${currentFile.name} is already saved`}
        >
          <Save size={14} aria-hidden />
          <span className="hidden md:inline">{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      )}
      {currentFile && (
        <button
          type="button"
          onClick={handleRunActiveFile}
          disabled={isRunningFile}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-h-[2rem] inline-flex items-center justify-center gap-1.5"
          title={`Run ${currentFile.name}`}
          aria-label={`Run ${currentFile.name}`}
        >
          <Play size={14} aria-hidden />
          <span className="hidden md:inline">{isRunningFile ? 'Running...' : 'Run'}</span>
        </button>
      )}
      {(runOutput || runError) && (
        <button
          type="button"
          onClick={() => {
            setRunOutput(null)
            setRunError(null)
          }}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Clear output
        </button>
      )}
    </>
  )

  return (
    <div className="h-full bg-background flex flex-col">
      <CodeHeader
        fileName={currentFile?.name ?? file.name}
        language={getLanguageDisplayName(currentFile?.name ?? file.name)}
        mode="edit"
        actions={headerActions}
      />

      {reviewSession && (
        <div
          className="border-b border-border bg-muted/40 px-3 py-2 flex flex-col gap-2 shrink-0"
          role="region"
          aria-label="AI code edit review"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-foreground font-medium truncate min-w-0 flex-1">
              {reviewSession.proposal.summary}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {Math.min(reviewSession.hunkIndex + 1, reviewSession.proposal.edits.length)} of{' '}
              {reviewSession.proposal.edits.length}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleAcceptReviewHunk}
                disabled={
                  reviewSession.hunkIndex >= reviewSession.proposal.edits.length ||
                  Boolean(reviewDiffPreview?.error)
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Check size={14} aria-hidden />
                Accept
              </button>
              <button
                type="button"
                onClick={handleAcceptAllReviewHunks}
                disabled={Boolean(reviewDiffPreview?.error)}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CheckCheck size={14} aria-hidden />
                Accept all
              </button>
              <button
                type="button"
                onClick={dismissCodeEditReview}
                className="border border-border bg-background hover:bg-muted px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X size={14} aria-hidden />
                Reject all
              </button>
            </div>
          </div>
          {reviewDiffPreview?.error ? (
            <p className="text-xs text-destructive" role="alert">
              {reviewDiffPreview.error} Dismiss review to edit the file, then retry from the assistant if needed.
            </p>
          ) : null}
        </div>
      )}

      {/* Main IDE Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          {currentFile && reviewSession && reviewDiffPreview ? (
            <DiffEditor
              height="100%"
              language={language}
              original={reviewSession.workingContent}
              modified={reviewDiffPreview.modified}
              keepCurrentOriginalModel
              keepCurrentModifiedModel
              theme={getMonacoThemeId(ideSettings.theme)}
              beforeMount={(monaco) => registerMonacoThemes(monaco as MonacoThemeRegistry)}
              options={{
                readOnly: true,
                minimap: { enabled: ideSettings.showMinimap },
                fontSize: ideSettings.fontSize,
                lineNumbers: ideSettings.showLineNumbers ? 'on' : 'off',
                wordWrap: ideSettings.wordWrap,
                automaticLayout: true,
                renderWhitespace: 'selection',
                renderControlCharacters: false,
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
              }}
            />
          ) : currentFile ? (
            <Editor
              height="100%"
              defaultLanguage={getLanguageMonacoId(currentFile.name)}
              value={content}
              theme={getMonacoThemeId(ideSettings.theme)}
              beforeMount={(monaco) => registerMonacoThemes(monaco as MonacoThemeRegistry)}
              onChange={handleEditorChange}
              onMount={editor => {
                editorRef.current = editor
              }}
              options={{
                readOnly: false,
                minimap: { enabled: ideSettings.showMinimap },
                fontSize: ideSettings.fontSize,
                lineNumbers: ideSettings.showLineNumbers ? 'on' : 'off',
                wordWrap: ideSettings.wordWrap,
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
                folding: true,
                renderWhitespace: 'selection',
                renderControlCharacters: false,
                guides: {
                  bracketPairs: true,
                  indentation: true,
                },
              }}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 px-4 text-center">
              <p className="text-muted-foreground">No file open</p>
              <p className="text-sm text-muted-foreground">Select a file from the file tree to edit.</p>
            </div>
          )}
        </div>

        {(runOutput || runError) && (
          <div className="h-56 bg-card border-t border-border flex flex-col flex-shrink-0">
            <div className="px-3 py-1.5 border-b border-border flex items-center justify-between bg-card">
              <span className="text-xs text-foreground font-medium">Output</span>
              {runOutput && (
                <span className="text-xs text-muted-foreground">
                  Exit {runOutput.exitCode} • {runOutput.interpreter}
                  {runOutput.timedOut ? ' • timed out' : ''}
                  {runOutput.truncated ? ' • truncated' : ''}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-2">
              {runError && (
                <pre className="text-xs whitespace-pre-wrap font-mono text-destructive">{runError}</pre>
              )}
              {runOutput?.stdout && (
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">{runOutput.stdout}</pre>
              )}
              {runOutput?.stderr && (
                <pre className="text-xs whitespace-pre-wrap font-mono text-destructive">{runOutput.stderr}</pre>
              )}
              {!runError && runOutput && !runOutput.stdout && !runOutput.stderr && (
                <p className="text-xs text-muted-foreground">Program finished with no output.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-background border-t border-border px-4 py-1 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{currentFile ? `${getLanguageDisplayName(currentFile.name)} • ${currentFile.name}` : 'No file'}</span>
          {isModified ? (
            <span className="text-chart-4">Modified</span>
          ) : lastSavedAt ? (
            <span>Saved {formatRelative(lastSavedAt)}</span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          {reviewSession ? (
            <span className="text-foreground">AI diff review</span>
          ) : (
            <>
              <span>Line {editorRef.current?.getPosition()?.lineNumber || 1}</span>
              <span>Column {editorRef.current?.getPosition()?.column || 1}</span>
            </>
          )}
          <span>{ideSettings.fontSize}px</span>
          {codeEditStatus && <span className="text-foreground">{codeEditStatus}</span>}
        </div>
      </div>

    </div>
  )
}

export default IDE
