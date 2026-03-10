import { ApiService } from '../../../../../../backend/api/apiService'

interface HandleDeleteFlowParams {
  flowId: string
  onSuccess: () => void
  onError: (message: string) => void
}

export async function handleDeleteFlow({ flowId, onSuccess, onError }: HandleDeleteFlowParams) {
  try {
    await ApiService.Flows.deleteFlow(flowId)
    onSuccess()
  } catch {
    onError('Failed to delete flow')
  }
}
