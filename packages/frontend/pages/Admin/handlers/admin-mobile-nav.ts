export function handleTabSelect(
  tabId: string,
  setActiveTab: (tab: string) => void,
  onClose?: () => void
) {
  setActiveTab(tabId)
  if (onClose) {
    onClose()
  }
}

