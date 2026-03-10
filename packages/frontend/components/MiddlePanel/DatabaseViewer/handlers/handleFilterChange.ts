import { ColumnFilter } from './loadDatabaseTableData'

export function handleFilterApply(
  filters: ColumnFilter[],
  column: string,
  operator: string,
  value: string,
): ColumnFilter[] {
  const existing = filters.findIndex(f => f.column === column)
  const updated = [...filters]
  if (existing >= 0)
    updated[existing] = { column, operator, value }
  else
    updated.push({ column, operator, value })
  return updated
}

export function handleFilterRemove(filters: ColumnFilter[], column: string): ColumnFilter[] {
  return filters.filter(f => f.column !== column)
}

export function handleClearAll(): { filters: ColumnFilter[]; orderBy: null } {
  return { filters: [], orderBy: null }
}
