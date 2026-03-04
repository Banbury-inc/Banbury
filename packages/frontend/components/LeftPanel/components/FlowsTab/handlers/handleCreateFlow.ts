import { ApiService } from '../../../../../../backend/api/apiService'

interface HandleCreateFlowParams {
  name: string
  onSuccess: () => void
  onError: (message: string) => void
}

export async function handleCreateFlow({ name, onSuccess, onError }: HandleCreateFlowParams) {
  try {
    await ApiService.Flows.createFlow(name)
    onSuccess()
  } catch {
    onError('Failed to create flow')
  }
}
