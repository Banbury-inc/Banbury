export function handleRefreshTasks({
  setRefreshCounter,
  setIsRefreshing
}: {
  setRefreshCounter: (fn: (prev: number) => number) => void
  setIsRefreshing: (value: boolean) => void
}) {
  setIsRefreshing(true)
  setRefreshCounter(prev => prev + 1)
}

