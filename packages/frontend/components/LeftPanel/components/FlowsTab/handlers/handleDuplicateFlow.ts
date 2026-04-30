import { ApiService } from '../../../../../../backend/api/apiService'
import { FlowItem } from '../../../../../pages/Workspaces/types'

interface HandleDuplicateFlowParams {
  flow: FlowItem
  existingFlowNames: string[]
  onSuccess: (duplicatedFlow: FlowItem) => void
  onError: (message: string) => void
}

function buildDuplicateName(sourceName: string, existingFlowNames: string[]) {
  const normalizedNames = new Set(existingFlowNames.map(name => name.toLowerCase()))
  const baseName = `${sourceName} Copy`
  if (!normalizedNames.has(baseName.toLowerCase())) return baseName

  let index = 2
  while (normalizedNames.has(`${baseName} ${index}`.toLowerCase())) index += 1
  return `${baseName} ${index}`
}

export async function handleDuplicateFlow({
  flow,
  existingFlowNames,
  onSuccess,
  onError,
}: HandleDuplicateFlowParams) {
  try {
    const duplicateName = buildDuplicateName(flow.name, existingFlowNames)
    const sourceFlow = await ApiService.Flows.getFlow(flow.id)
    const createdFlow = await ApiService.Flows.createFlow(duplicateName)
    const { nodes, edges, viewport } = sourceFlow.graph_json
    const duplicatedFlow = await ApiService.Flows.updateFlow(createdFlow.id, { nodes, edges, viewport })
    onSuccess(duplicatedFlow)
  } catch {
    onError('Failed to duplicate flow')
  }
}
