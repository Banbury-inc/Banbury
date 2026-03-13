import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Editor } from '@monaco-editor/react'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { ApiService } from '../../../../backend/api/apiService'
import { getMonacoThemeId, registerMonacoThemes, type MonacoThemeRegistry } from './ideThemes'
import { getIDESettings } from '../../modals/settings-tabs/handlers/ideSettingsHandlers'
import { formatRelative } from './handlers/formatRelative'
import { getLanguageMonacoId, getLanguageDisplayName } from './languageUtils'
import { runPythonFile, type RunPythonFileResult } from './handlers/runPythonFile'
import { setCurrentCodeFileContext, clearCurrentCodeFileContext } from './handlers/currentCodeFileContext'
import { createCodeEditApplyHandler } from './handlers/createCodeEditApplyHandler'
import { CodeHeader } from './CodeHeader'
import { Play, Save } from 'lucide-react'

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
      const blob = new Blob([currentContent], { type: 'text/plain' })

      await ApiService.Files.uploadToS3(
        blob,
        currentFile.name,
        userInfo?.username || 'web-editor',
        currentFile.path,
        ''
      )

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

  useEffect(() => {
    loadFileContent(file)
  }, [file, loadFileContent])

  useEffect(() => {
    if (!currentFile?.path || !currentFile?.name) return
    setCurrentCodeFileContext({
      filePath: currentFile.path,
      fileName: currentFile.name,
      content: editorRef.current?.getValue() || content,
    })

    return () => {
      clearCurrentCodeFileContext(currentFile.path)
    }
  }, [content, currentFile?.path, currentFile?.name])

  useEffect(() => {
    const handler = createCodeEditApplyHandler({
      getCurrentContent: () => editorRef.current?.getValue() || content,
      currentFilePath: currentFile.path || '',
      setContent,
      setIsModified,
      setCodeEditStatus,
      appliedChangeIdsRef,
    })

    window.addEventListener('assistant-code-edit-apply', handler)
    return () => window.removeEventListener('assistant-code-edit-apply', handler)
  }, [content, currentFile.path])

  useEffect(() => {
    if (!codeEditStatus) return
    const timeoutId = window.setTimeout(() => setCodeEditStatus(null), 5000)
    return () => window.clearTimeout(timeoutId)
  }, [codeEditStatus])

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

      {/* Main IDE Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative overflow-hidden">
          {currentFile ? (
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
          <span>Line {editorRef.current?.getPosition()?.lineNumber || 1}</span>
          <span>Column {editorRef.current?.getPosition()?.column || 1}</span>
          <span>{ideSettings.fontSize}px</span>
          {codeEditStatus && <span>{codeEditStatus}</span>}
        </div>
      </div>

    </div>
  )
}

export default IDE
