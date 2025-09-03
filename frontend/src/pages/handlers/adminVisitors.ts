export interface GetTotalPagesArgs {
  totalItems: number
  pageSize: number
}

export function getTotalPages({ totalItems, pageSize }: GetTotalPagesArgs): number {
  if (pageSize <= 0) return 1
  if (totalItems <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

export interface ClampPageArgs {
  page: number
  totalPages: number
}

export function clampPage({ page, totalPages }: ClampPageArgs): number {
  if (totalPages <= 0) return 1
  if (page < 1) return 1
  if (page > totalPages) return totalPages
  return page
}

export interface GetPageSliceArgs<T> {
  items: T[]
  page: number
  pageSize: number
}

export function getPageSlice<T>({ items, page, pageSize }: GetPageSliceArgs<T>): T[] {
  if (pageSize <= 0) return items
  const start = (page - 1) * pageSize
  const end = start + pageSize
  return items.slice(start, end)
}

export interface CanNavigateArgs {
  page: number
  totalPages: number
}

export function canGoPrev({ page }: { page: number }): boolean {
  return page > 1
}

export function canGoNext({ page, totalPages }: CanNavigateArgs): boolean {
  return page < totalPages
}

export function prevPage({ page }: { page: number }): number {
  return Math.max(1, page - 1)
}

export function nextPage({ page, totalPages }: CanNavigateArgs): number {
  if (totalPages <= 0) return 1
  return Math.min(totalPages, page + 1)
}


