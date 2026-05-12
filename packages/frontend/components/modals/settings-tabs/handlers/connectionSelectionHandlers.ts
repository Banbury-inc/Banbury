import type { Dispatch, KeyboardEvent, MouseEvent, SetStateAction } from 'react'
import type { ConnectionId } from '../connection-details'

interface SelectConnectionParams {
  connectionId: ConnectionId
  setSelectedConnectionId: Dispatch<SetStateAction<ConnectionId | null>>
}

interface ConnectionRowKeyDownParams extends SelectConnectionParams {
  event: KeyboardEvent<HTMLDivElement>
}

interface ConnectionRowClickParams extends SelectConnectionParams {
  event: MouseEvent<HTMLDivElement>
}

export function handleSelectConnection({
  connectionId,
  setSelectedConnectionId,
}: SelectConnectionParams) {
  setSelectedConnectionId(connectionId)
}

export function handleBackToConnectionsList(
  setSelectedConnectionId: Dispatch<SetStateAction<ConnectionId | null>>
) {
  setSelectedConnectionId(null)
}

export function handleConnectionRowClick({
  event,
  connectionId,
  setSelectedConnectionId,
}: ConnectionRowClickParams) {
  if ((event.target as HTMLElement).closest('button')) return

  handleSelectConnection({ connectionId, setSelectedConnectionId })
}

export function handleConnectionRowKeyDown({
  event,
  connectionId,
  setSelectedConnectionId,
}: ConnectionRowKeyDownParams) {
  if (event.key !== 'Enter' && event.key !== ' ') return

  event.preventDefault()
  handleSelectConnection({ connectionId, setSelectedConnectionId })
}
