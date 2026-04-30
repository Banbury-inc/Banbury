import type { NextRouter } from 'next/router'
import type { Dispatch, SetStateAction } from 'react'

export function handleToggleDocsSidebarSection(
  sectionId: string,
  setExpandedSections: Dispatch<SetStateAction<Set<string>>>,
): void {
  setExpandedSections((prev) => {
    const next = new Set(prev)
    if (next.has(sectionId)) next.delete(sectionId)
    else next.add(sectionId)
    return next
  })
}

export interface HandleDocsSidebarItemNavigateArgs {
  href: string
  router: NextRouter
  onMobileOpenChange: (open: boolean) => void
}

export function handleDocsSidebarItemNavigate({
  href,
  router,
  onMobileOpenChange,
}: HandleDocsSidebarItemNavigateArgs): void {
  void router.push(href)
  onMobileOpenChange(false)
}
