import { FlowItem } from '../../../../../pages/Workspaces/types'

interface HandleFlowSelectParams {
  flow: FlowItem
  setSelectedFlow: React.Dispatch<React.SetStateAction<FlowItem | null>>
  openFlowInTabCallback: (flow: FlowItem) => void
}

export function handleFlowSelect({ flow, setSelectedFlow, openFlowInTabCallback }: HandleFlowSelectParams) {
  setSelectedFlow(flow)
  openFlowInTabCallback(flow)
}
