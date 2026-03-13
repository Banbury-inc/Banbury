'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
  type Viewport,
  type NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Play, Square, CheckCircle, XCircle, Save, Loader2, X, CalendarClock } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Typography } from '../../common/ui/typography'
import { FlowItem } from '../../../pages/Workspaces/types'
import { runFlow, saveFlowGraph, RunStatus } from './handlers/flowExecution'
import { ApiService } from '../../../../backend/api/apiService'
import { StartNode } from './nodes/StartNode'
import { OutputNode } from './nodes/OutputNode'
import { DatabaseQueryNode } from './nodes/DatabaseQueryNode'
import { SlackSendMessageNode } from './nodes/SlackSendMessageNode'
import { GmailSendNode } from './nodes/GmailSendNode'
import { FormatTextNode } from './nodes/FormatTextNode'
import { FilterDataNode } from './nodes/FilterDataNode'
import { HttpRequestNode } from './nodes/HttpRequestNode'
import { GoogleCalendarNode } from './nodes/GoogleCalendarNode'
import { MicrosoftCalendarNode } from './nodes/MicrosoftCalendarNode'
import { GitHubNode } from './nodes/GitHubNode'
import { XApiNode } from './nodes/XApiNode'
import { GoogleDriveNode } from './nodes/GoogleDriveNode'
import { OneDriveNode } from './nodes/OneDriveNode'
import { PythonCodeNode } from './nodes/PythonCodeNode'
import { NodeToolbar } from './NodeToolbar'
import { NodeConfigPanel } from './NodeConfigPanel'
import { FlowSchedulePanel } from './FlowSchedulePanel'
import { NODE_REGISTRY_MAP } from './nodes/nodeRegistry'
import { getRunLogEntryPresentation } from './handlers/runLogPresentation'

interface FlowViewerProps {
  flow: FlowItem
  onFlowUpdated?: (flow: FlowItem) => void
}

const NODE_TYPES: NodeTypes = {
  start: StartNode,
  output: OutputNode,
  'database-query': DatabaseQueryNode,
  'slack-send-message': SlackSendMessageNode,
  'gmail-send': GmailSendNode,
  'format-text': FormatTextNode,
  'filter-data': FilterDataNode,
  'http-request': HttpRequestNode,
  'google-calendar': GoogleCalendarNode,
  'microsoft-calendar': MicrosoftCalendarNode,
  github: GitHubNode,
  'x-api': XApiNode,
  'google-drive': GoogleDriveNode,
  onedrive: OneDriveNode,
  'python-code': PythonCodeNode,
}

const DEFAULT_NODES: Node[] = [
  { id: 'start', type: 'start', data: {}, position: { x: 250, y: 60 } },
  { id: 'output', type: 'output', data: { label: 'Output' }, position: { x: 250, y: 300 } },
]

const DEFAULT_EDGES: Edge[] = [
  { id: 'start-output', source: 'start', target: 'output' },
]

function StatusBadge({ status }: { status: RunStatus }) {
  if (status === 'idle') return null
  if (status === 'running')
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running…
      </div>
    )
  if (status === 'success')
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium">
        <CheckCircle className="h-3 w-3" />
        Success
      </div>
    )
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
      <XCircle className="h-3 w-3" />
      Failed
    </div>
  )
}

function FlowViewerInner({ flow, onFlowUpdated }: FlowViewerProps) {
  const initialNodes = (flow.graph_json?.nodes as Node[]) ?? DEFAULT_NODES
  const initialEdges = (flow.graph_json?.edges as Edge[]) ?? DEFAULT_EDGES

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [runLogs, setRunLogs] = useState<string[]>([])
  const [showLogs, setShowLogs] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const viewportRef = useRef<Viewport | undefined>(flow.graph_json?.viewport ?? undefined)
  const reactFlow = useReactFlow()

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null

  useEffect(() => {
    const newNodes = (flow.graph_json?.nodes as Node[]) ?? DEFAULT_NODES
    const newEdges = (flow.graph_json?.edges as Edge[]) ?? DEFAULT_EDGES
    setNodes(newNodes)
    setEdges(newEdges)
    viewportRef.current = flow.graph_json?.viewport ?? undefined
    setIsDirty(false)
  }, [flow.id, flow.updated_at, setNodes, setEdges])

  useEffect(() => {
    if (flow.last_run_status === 'success') setRunStatus('success')
    else if (flow.last_run_status === 'failed') setRunStatus('failed')
    else if (flow.last_run_status === 'running') setRunStatus('running')
  }, [flow.last_run_status])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(eds => addEdge(connection, eds))
      setIsDirty(true)
    },
    [setEdges]
  )

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes)
      setIsDirty(true)
    },
    [onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes)
      setIsDirty(true)
    },
    [onEdgesChange]
  )

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      await saveFlowGraph({
        flowId: flow.id,
        nodes,
        edges,
        viewport: viewportRef.current,
      })
      setIsDirty(false)
      if (onFlowUpdated) {
        const updated = await ApiService.Flows.getFlow(flow.id)
        onFlowUpdated(updated)
      }
    } finally {
      setIsSaving(false)
    }
  }, [flow.id, nodes, edges, onFlowUpdated])

  const updateOutputNodes = useCallback((logs: string[]) => {
    setNodes(nds =>
      nds.map(n =>
        n.type === 'output'
          ? { ...n, data: { ...n.data, output: logs.join('\n') } }
          : n
      )
    )
    setShowLogs(true)
  }, [setNodes])

  const handleRun = useCallback(async () => {
    if (runStatus === 'running') {
      abortRef.current?.abort()
      setRunStatus('idle')
      return
    }
    if (isDirty) await handleSave()
    setShowLogs(false)
    await runFlow({
      flowId: flow.id,
      setRunStatus,
      setRunLogs,
      abortRef,
      onFlowUpdated,
      onLogsReceived: updateOutputNodes,
    })
  }, [flow.id, runStatus, isDirty, handleSave, onFlowUpdated, updateOutputNodes])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [])

  const handleNodeDataChange = useCallback((nodeId: string, data: Record<string, unknown>) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data } : n))
    setIsDirty(true)
  }, [setNodes])

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const nodeType = e.dataTransfer.getData('application/reactflow-nodetype')
      if (!nodeType) return

      const def = NODE_REGISTRY_MAP[nodeType]
      if (!def) return

      const position = reactFlow.screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: { ...def.defaultData, label: def.label },
      }

      setNodes(nds => [...nds, newNode])
      setIsDirty(true)
      setSelectedNodeId(newNode.id)
    },
    [reactFlow, setNodes]
  )

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
          <Typography variant="small" className="font-semibold text-foreground truncate">
            {flow.name}
          </Typography>
          {isDirty && (
            <span className="text-xs font-normal text-muted-foreground flex-shrink-0">unsaved</span>
          )}
        </div>
        <StatusBadge status={runStatus} />
        <Button
          size="xs"
          variant={isDirty ? 'secondary' : 'ghost'}
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          title={isDirty ? 'Save changes' : 'No unsaved changes'}
          className="gap-1"
        >
          {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save
        </Button>
        <Button
          size="xs"
          variant={showSchedule ? 'secondary' : (flow.schedule_enabled ? 'secondary' : 'ghost')}
          onClick={() => setShowSchedule(s => !s)}
          className="gap-1"
          title={flow.schedule_enabled ? 'Schedule active – click to configure' : 'Configure schedule'}
        >
          <CalendarClock className={`h-3.5 w-3.5 ${flow.schedule_enabled ? 'text-primary' : ''}`} />
          {flow.schedule_enabled ? 'Scheduled' : 'Schedule'}
        </Button>
        <Button
          size="xs"
          variant={runStatus === 'running' ? 'destructive' : 'default'}
          onClick={handleRun}
          className="gap-1"
        >
          {runStatus === 'running' ? (
            <>
              <Square className="h-3.5 w-3.5" />
              Stop
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Run
            </>
          )}
        </Button>
      </div>

      {/* Canvas + Config panel side-by-side */}
      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              onMoveEnd={(_, vp) => { viewportRef.current = vp }}
              onDragOver={onDragOver}
              onDrop={onDrop}
              defaultViewport={flow.graph_json?.viewport ?? undefined}
              fitView={!flow.graph_json?.viewport}
              colorMode="system"
            >
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
              <Controls />
              <MiniMap zoomable pannable />
              <NodeToolbar />
            </ReactFlow>
          </div>
          {showLogs && runLogs.length > 0 && (
            <div className="w-full border-t border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">Terminal output</span>
                  <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                    {runLogs.length} line{runLogs.length === 1 ? '' : 's'}
                  </span>
                </div>
                <button
                  onClick={() => setShowLogs(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss logs"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                {runLogs.map((log, i) => {
                  const presentation = getRunLogEntryPresentation(log)
                  return (
                    <div
                      key={`${log}-${i}`}
                      className={`mb-1 last:mb-0 w-full rounded border px-2 py-1 text-xs font-mono leading-relaxed ${presentation.rowClassName}`}
                    >
                      <div className="grid grid-cols-[auto_auto_1fr] items-start gap-2 whitespace-pre-wrap break-words">
                        <span className="text-[10px] text-muted-foreground/80">{String(i + 1).padStart(2, '0')}</span>
                        <span className={`text-[10px] font-semibold ${presentation.markerClassName}`} aria-hidden="true">
                          {presentation.marker}
                        </span>
                        <div className="min-w-0">
                          <span className={`mr-2 text-[10px] font-semibold ${presentation.levelClassName}`}>
                            [{presentation.levelLabel}]
                          </span>
                          <span className={presentation.textClassName}>{presentation.content}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onDataChange={handleNodeDataChange}
          />
        )}

        {showSchedule && (
          <FlowSchedulePanel
            flow={flow}
            onClose={() => setShowSchedule(false)}
            onFlowUpdated={onFlowUpdated}
          />
        )}
      </div>
    </div>
  )
}

export function FlowViewer(props: FlowViewerProps) {
  return (
    <ReactFlowProvider>
      <FlowViewerInner {...props} />
    </ReactFlowProvider>
  )
}
