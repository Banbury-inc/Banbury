import { Dispatch, SetStateAction } from 'react'

interface HandleRefreshFilesParams {
  setRefreshCounter: Dispatch<SetStateAction<number>>
  setIsRefreshing: Dispatch<SetStateAction<boolean>>
}

export function handleRefreshFiles({ setRefreshCounter, setIsRefreshing }: HandleRefreshFilesParams) {
  setIsRefreshing(true)
  setRefreshCounter(prev => prev + 1)
}

