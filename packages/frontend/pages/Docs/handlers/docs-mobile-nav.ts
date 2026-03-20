import type { Dispatch, SetStateAction } from 'react'

export function handleDocsMobileOpenToggle(
  setMobileOpen: Dispatch<SetStateAction<boolean>>,
): void {
  setMobileOpen((prev) => !prev)
}

export function handleDocsMobileSheetOpenChange(
  open: boolean,
  setMobileOpen: Dispatch<SetStateAction<boolean>>,
): void {
  setMobileOpen(open)
}
