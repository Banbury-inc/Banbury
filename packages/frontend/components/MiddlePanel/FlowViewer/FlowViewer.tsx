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
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Play, Square, CheckCircle, XCircle, Save, Loader2 } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Typography } from '../../common/ui/typography'
import { FlowItem } from '../../../pages/Workspaces/types'
import { runFlow, saveFlowGraph, RunStatus } from './handlers/flowExecution'
import { ApiService } from '../../../../backend/api/apiService'

interface FlowViewerProps {
  flow: FlowItem
  onFlowUpdated?: (flow: FlowItem) => void
}

const DEFAULT_NODES: Node[] = [
  {
    id: 'start',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 80 },
  },
]

const DEFAULT_EDGES: Edge[] = []

function StatusBadge({ status }: { status: RunStatus }) {
  if (status === 'idle') return null
  if (status === 'running')
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 text-xs font-medium">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running…
      </div>
    )
  if (status === 'success')
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-500 text-xs font-medium">
        <CheckCircle className="h-3 w-3" />
        Success
      </div>
    )
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-500 text-xs font-medium">
      <XCircle className="h-3 w-3" />
      Failed
    </div>
  )
}

export function FlowViewer({ flow, onFlowUpdated }: FlowViewerProps) {
  const initialNodes = (flow.graph_json?.nodes as Node[]) ?? DEFAULT_NODES
  const initialEdges = (flow.graph_json?.edges as Edge[]) ?? DEFAULT_EDGES

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [runLogs, setRunLogs] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const viewportRef = useRef<Viewport | undefined>(flow.graph_json?.viewport)

  useEffect(() => {
    const newNodes = (flow.graph_json?.nodes as Node[]) ?? DEFAULT_NODES
    const newEdges = (flow.graph_json?.edges as Edge[]) ?? DEFAULT_EDGES
    setNodes(newNodes)
    setEdges(newEdges)
    viewportRef.current = flow.graph_json?.viewport
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

  const handleRun = useCallback(async () => {
    if (runStatus === 'running') {
      abortRef.current?.abort()
      setRunStatus('idle')
      return
    }
    await runFlow({
      flowId: flow.id,
      setRunStatus,
      setRunLogs,
      abortRef,
      onFlowUpdated,
    })
  }, [flow.id, runStatus, onFlowUpdated])

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card flex-shrink-0">
        <Typography variant="small" className="font-semibold text-foreground truncate flex-1">
          {flow.name}
        </Typography>
        <StatusBadge status={runStatus} />
        {isDirty && (
          <Button
            size="xs"
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            title="Save changes"
            className="gap-1"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        )}
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

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onMoveEnd={(_, vp) => { viewportRef.current = vp }}
          defaultViewport={flow.graph_json?.viewport}
          fitView={!flow.graph_json?.viewport}
          colorMode="system"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap zoomable pannable />
          {runLogs.length > 0 && (
            <Panel position="bottom-center">
              <div className="max-w-xl w-full bg-card border border-border rounded-md shadow-md p-3 max-h-32 overflow-y-auto">
                {runLogs.map((log, i) => (
                  <Typography key={i} variant="xs" className="text-muted-foreground font-mono leading-relaxed">
                    {log}
                  </Typography>
                ))}
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  )
}
