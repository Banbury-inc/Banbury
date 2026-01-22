interface HandleFileSidebarRefreshParams {
  triggerSidebarRefresh: () => void
}

export function createFileSidebarRefreshHandler({
  triggerSidebarRefresh
}: HandleFileSidebarRefreshParams): () => void {
  return () => {
    triggerSidebarRefresh()
  }
}

export const FILE_SIDEBAR_REFRESH_EVENT = 'file-sidebar-refresh'
