import { ColumnOrderBy } from './loadDatabaseTableData'

export function handleSortChange(
  column: string,
  direction: 'asc' | 'desc',
  currentOrderBy: ColumnOrderBy | null,
): ColumnOrderBy | null {
  if (currentOrderBy?.column === column && currentOrderBy.direction === direction)
    return null
  return { column, direction }
}
