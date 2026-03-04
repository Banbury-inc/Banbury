import { ApiService } from '../../../../../backend/api/apiService'
import { FlowItem } from '../../../../pages/Workspaces/types'

export type RunStatus = 'idle' | 'running' | 'success' | 'failed'

interface RunFlowParams {
  flowId: string
  setRunStatus: (status: RunStatus) => void
  setRunLogs: (logs: string[]) => void
  abortRef: { current: AbortController | null }
  onFlowUpdated?: (flow: FlowItem) => void
}

export async function runFlow({ flowId, setRunStatus, setRunLogs, abortRef, onFlowUpdated }: RunFlowParams) {
  const controller = new AbortController()
  abortRef.current = controller

  setRunStatus('running')
  setRunLogs([])

  try {
    const result = await ApiService.Flows.runFlow(flowId)
    if (controller.signal.aborted) return

    const logs = result.logs ?? ['Flow completed successfully']
    setRunLogs(logs)
    setRunStatus(result.success ? 'success' : 'failed')

    if (onFlowUpdated) {
      const updated = await ApiService.Flows.getFlow(flowId)
      onFlowUpdated(updated)
    }
  } catch (err: unknown) {
    if (controller.signal.aborted) return
    const message = err instanceof Error ? err.message : 'Run failed'
    setRunLogs([message])
    setRunStatus('failed')
  } finally {
    abortRef.current = null
  }
}

interface SaveFlowGraphParams {
  flowId: string
  nodes: unknown[]
  edges: unknown[]
  viewport?: { x: number; y: number; zoom: number }
}

export async function saveFlowGraph({ flowId, nodes, edges, viewport }: SaveFlowGraphParams) {
  await ApiService.Flows.updateFlow(flowId, { nodes, edges, viewport })
}
