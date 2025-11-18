import React, { useEffect, useMemo, useState } from 'react'
import { Play, Save, Plus, Type } from 'lucide-react'
import { FileSystemItem } from '../../../utils/fileTreeUtils'
import { useToast } from '../../ui/use-toast'
import { loadNotebookFile } from './handlers/loadNotebook'
import { saveNotebookFile } from './handlers/saveNotebook'
import { runCodeCell } from './handlers/runCell'

export interface NotebookViewerProps {
  file: FileSystemItem
  userInfo?: { username: string; email?: string } | null
  onSaveComplete?: () => void
}

interface NotebookCellBase {
  cell_type: 'code' | 'markdown'
  metadata?: Record<string, any>
}

interface CodeOutputStream {
  output_type: 'stream'
  name: 'stdout' | 'stderr'
  text: string | string[]
}

interface CodeOutputError {
  output_type: 'error'
  ename: string
  evalue: string
  traceback?: string[]
}

type CodeOutput = CodeOutputStream | CodeOutputError

interface CodeCell extends NotebookCellBase {
  cell_type: 'code'
  source: string[]
  execution_count: number | null
  outputs: CodeOutput[]
}

interface MarkdownCell extends NotebookCellBase {
  cell_type: 'markdown'
  source: string[]
}

interface NotebookDocument {
  nbformat: number
  nbformat_minor: number
  metadata?: Record<string, any>
  cells: Array<CodeCell | MarkdownCell>
}

function toSourceString(lines: string[] | string | undefined): string {
  if (!lines) return ''
  if (Array.isArray(lines)) return lines.join('')
  return String(lines)
}

function fromSourceString(text: string): string[] {
  return text.endsWith('\n') ? [text] : [text + '\n']
}

export function NotebookViewer({ file, userInfo, onSaveComplete }: NotebookViewerProps) {
  const { toast } = useToast()
  const [notebook, setNotebook] = useState<NotebookDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runningCellIndex, setRunningCellIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSave = useMemo(() => !!notebook && !!userInfo?.username, [notebook, userInfo?.username])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadNotebookFile(file)
      .then((doc) => {
        if (cancelled) return
        setNotebook(doc)
      })
      .catch(() => {
        if (cancelled) return
        setError('Failed to load notebook')
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [file.file_id, file.name])

  const handleSave = async () => {
    if (!notebook || !userInfo?.username) return
    setSaving(true)
    try {
      await saveNotebookFile({ notebook, file, username: userInfo.username })
      toast({ title: 'Notebook saved', description: `${file.name} has been saved.`, variant: 'success' })
      onSaveComplete?.()
    } catch (e) {
      toast({ title: 'Failed to save notebook', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleRunCell = async (index: number) => {
    if (!notebook) return
    const cell = notebook.cells[index]
    if (!cell || cell.cell_type !== 'code') return
    setRunningCellIndex(index)
    try {
      const source = toSourceString(cell.source)
      const { stdout, stderr, error: execErr } = await runCodeCell({ code: source })
      const outputs: CodeOutput[] = []
      if (stdout) outputs.push({ output_type: 'stream', name: 'stdout', text: stdout })
      if (stderr) outputs.push({ output_type: 'stream', name: 'stderr', text: stderr })
      if (execErr) outputs.push({ output_type: 'error', ename: execErr.name || 'Error', evalue: execErr.message || String(execErr) })
      const next: NotebookDocument = {
        ...notebook,
        cells: notebook.cells.map((c, i) => i === index ? ({ ...(c as CodeCell), outputs, execution_count: (c as CodeCell).execution_count == null ? 1 : ((c as CodeCell).execution_count as number) + 1 }) : c)
      }
      setNotebook(next)
    } catch (e) {
      toast({ title: 'Execution failed', description: 'Error while running cell.', variant: 'destructive' })
    } finally {
      setRunningCellIndex(null)
    }
  }

  const handleRunAll = async () => {
    if (!notebook) return
    for (let i = 0; i < notebook.cells.length; i += 1) {
      if (notebook.cells[i].cell_type === 'code') {
        // eslint-disable-next-line no-await-in-loop
        await handleRunCell(i)
      }
    }
  }

  const handleAddCell = (type: 'code' | 'markdown') => {
    if (!notebook) return
    const newCell: CodeCell | MarkdownCell = type === 'code'
      ? { cell_type: 'code', source: ['\n'], execution_count: null, outputs: [], metadata: {} }
      : { cell_type: 'markdown', source: ['\n'], metadata: {} }
    setNotebook({ ...notebook, cells: [...notebook.cells, newCell] })
  }

  const handleEditCellSource = (index: number, text: string) => {
    if (!notebook) return
    const cell = notebook.cells[index]
    if (!cell) return
    const updated = { ...cell, source: fromSourceString(text) } as CodeCell | MarkdownCell
    setNotebook({ ...notebook, cells: notebook.cells.map((c, i) => i === index ? updated : c) })
  }

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-300">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          <span>Loading notebook...</span>
        </div>
      </div>
    )
  }

  if (error || !notebook) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">{error || 'Notebook failed to load'}</div>
          <div className="text-gray-400 text-sm">{file.name}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full flex flex-col bg-black">
      <div className="border-b border-zinc-700 px-3 py-2 flex items-center gap-2">
        <button
          onClick={handleRunAll}
          className="h-8 px-3 text-white hover:bg-zinc-700 bg-black border border-zinc-600 rounded-md flex items-center gap-2"
          title="Run all cells"
        >
          <Play className="h-3 w-3" /> Run All
        </button>
        <button
          onClick={() => handleAddCell('code')}
          className="h-8 px-3 text-white hover:bg-zinc-700 bg-black border border-zinc-600 rounded-md flex items-center gap-2"
          title="Add code cell"
        >
          <Plus className="h-3 w-3" /> Code Cell
        </button>
        <button
          onClick={() => handleAddCell('markdown')}
          className="h-8 px-3 text-white hover:bg-zinc-700 bg-black border border-zinc-600 rounded-md flex items-center gap-2"
          title="Add markdown cell"
        >
          <Type className="h-3 w-3" /> Markdown
        </button>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="h-8 px-3 text-white disabled:opacity-50 hover:bg-zinc-700 bg-black border border-zinc-600 rounded-md flex items-center gap-2"
          title="Save notebook"
        >
          <Save className="h-3 w-3" /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {notebook.cells.map((cell, idx) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-700 rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                {cell.cell_type === 'code' ? 'Code' : 'Markdown'} {cell.cell_type === 'code' && (cell as CodeCell).execution_count != null ? `• ${String((cell as CodeCell).execution_count)}` : ''}
              </div>
              {cell.cell_type === 'code' && (
                <button
                  onClick={() => handleRunCell(idx)}
                  disabled={runningCellIndex === idx}
                  className="h-7 px-2 text-white disabled:opacity-50 hover:bg-zinc-700 bg-black border border-zinc-600 rounded-md flex items-center gap-1"
                >
                  <Play className="h-3 w-3" /> Run
                </button>
              )}
            </div>
            <textarea
              value={toSourceString(cell.source)}
              onChange={(e) => handleEditCellSource(idx, e.target.value)}
              className="w-full bg-black text-white border border-zinc-700 rounded-md p-2 font-mono text-sm min-h-[100px]"
            />
            {cell.cell_type === 'code' && (cell as CodeCell).outputs && (cell as CodeCell).outputs.length > 0 && (
              <div className="mt-3 bg-black border border-zinc-800 rounded-md p-2 text-sm">
                {(cell as CodeCell).outputs.map((out, i) => {
                  if (out.output_type === 'stream') {
                    const text = Array.isArray(out.text) ? out.text.join('') : out.text
                    const color = out.name === 'stderr' ? 'text-red-300' : 'text-gray-200'
                    return (
                      <pre key={i} className={`whitespace-pre-wrap ${color}`}>{text}</pre>
                    )
                  }
                  if (out.output_type === 'error') {
                    return (
                      <div key={i} className="text-red-400">
                        {out.ename}: {out.evalue}
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotebookViewer


