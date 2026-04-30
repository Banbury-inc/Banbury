import { ApiService } from '../../../../../../backend/api/apiService'
import { FlowItem } from '../../../../../pages/Workspaces/types'

interface HandleRenameFlowParams {
  flow: FlowItem
  nextName: string
  onSuccess: (updatedFlow: FlowItem) => void
  onError: (message: string) => void
}

export async function handleRenameFlow({ flow, nextName, onSuccess, onError }: HandleRenameFlowParams) {
  try {
    const { nodes, edges, viewport } = flow.graph_json
    const updatedFlow = await ApiService.Flows.updateFlow(flow.id, { nodes, edges, viewport, name: nextName })
    onSuccess(updatedFlow)
  } catch {
    onError('Failed to rename flow')
  }
}
