import { Dispatch, SetStateAction } from 'react'

interface HandleRefreshCompleteParams {
  setIsRefreshing: Dispatch<SetStateAction<boolean>>
  onRefreshComplete?: () => void
}

export function handleRefreshComplete({ setIsRefreshing, onRefreshComplete }: HandleRefreshCompleteParams) {
  setIsRefreshing(false)
  if (onRefreshComplete) onRefreshComplete()
}

