'use client'

import { ArrowDown, ArrowUp, Check, Filter, Key, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../common/ui/dropdown-menu'
import { Input } from '../../common/ui/input'
import { handleClearAll, handleFilterApply, handleFilterRemove } from './handlers/handleFilterChange'
import { handleSortChange } from './handlers/handleSortChange'
import { ColumnFilter, ColumnOrderBy } from './handlers/loadDatabaseTableData'

const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'contains'] as const
type Operator = (typeof OPERATORS)[number]

interface ColumnHeaderMenuProps {
  column: string
  orderBy: ColumnOrderBy | null
  filters: ColumnFilter[]
  primaryKeyColumns: string[]
  onOrderByChange: (orderBy: ColumnOrderBy | null) => void
  onFiltersChange: (filters: ColumnFilter[]) => void
}

export function ColumnHeaderMenu({
  column,
  orderBy,
  filters,
  primaryKeyColumns,
  onOrderByChange,
  onFiltersChange,
}: ColumnHeaderMenuProps) {
  const activeFilter = filters.find(f => f.column === column)
  const isActiveSort = orderBy?.column === column

  const [operator, setOperator] = useState<Operator>(
    (activeFilter?.operator as Operator) ?? '=',
  )
  const [filterValue, setFilterValue] = useState(activeFilter?.value ?? '')

  const isSortedAsc = isActiveSort && orderBy?.direction === 'asc'
  const isSortedDesc = isActiveSort && orderBy?.direction === 'desc'

  function onSortAsc() {
    onOrderByChange(handleSortChange(column, 'asc', orderBy))
  }

  function onSortDesc() {
    onOrderByChange(handleSortChange(column, 'desc', orderBy))
  }

  function onRemoveSort() {
    onOrderByChange(null)
  }

  function onApplyFilter() {
    if (!filterValue.trim()) return
    onFiltersChange(handleFilterApply(filters, column, operator, filterValue.trim()))
  }

  function onRemoveFilter() {
    setFilterValue('')
    onFiltersChange(handleFilterRemove(filters, column))
  }

  function onClearAll() {
    setFilterValue('')
    const cleared = handleClearAll()
    onOrderByChange(cleared.orderBy)
    onFiltersChange(cleared.filters)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1 w-full text-left font-medium text-foreground hover:text-foreground/80 focus:outline-none"
          type="button"
        >
          <span className="truncate">{column}</span>
          {primaryKeyColumns.includes(column) && (
            <Key className="h-2.5 w-2.5 shrink-0 text-muted-foreground" title="Primary key" />
          )}
          {isSortedAsc && <ArrowUp className="h-3 w-3 shrink-0 text-primary" />}
          {isSortedDesc && <ArrowDown className="h-3 w-3 shrink-0 text-primary" />}
          {activeFilter && <Filter className="h-3 w-3 shrink-0 text-primary" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 p-1">
        <DropdownMenuItem onClick={onSortAsc} className="cursor-pointer">
          <ArrowUp className="mr-2 h-3.5 w-3.5" />
          <span>Order by {column} ASC</span>
          {isSortedAsc && <Check className="ml-auto h-3.5 w-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSortDesc} className="cursor-pointer">
          <ArrowDown className="mr-2 h-3.5 w-3.5" />
          <span>Order by {column} DESC</span>
          {isSortedDesc && <Check className="ml-auto h-3.5 w-3.5" />}
        </DropdownMenuItem>
        {isActiveSort && (
          <DropdownMenuItem onClick={onRemoveSort} className="cursor-pointer text-muted-foreground">
            <X className="mr-2 h-3.5 w-3.5" />
            <span>Disable order by {column}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <div className="px-2 py-1.5 space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Filter by value</div>
          <select
            value={operator}
            onChange={e => setOperator(e.target.value as Operator)}
            className="w-full text-xs rounded border border-border bg-background text-foreground px-2 py-1 focus:outline-none"
          >
            {OPERATORS.map(op => (
              <option key={op} value={op}>
                {column} {op} ..
              </option>
            ))}
          </select>
          <Input
            className="h-7 text-xs"
            placeholder="Value..."
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onApplyFilter()}
          />
          <Button
            type="button"
            size="xs"
            variant="secondary"
            className="w-full"
            onClick={onApplyFilter}
            disabled={!filterValue.trim()}
          >
            Apply Filter
          </Button>
        </div>

        {activeFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemoveFilter} className="cursor-pointer text-muted-foreground">
              <X className="mr-2 h-3.5 w-3.5" />
              <span>Remove filter on {column}</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onClearAll} className="cursor-pointer text-muted-foreground">
          <X className="mr-2 h-3.5 w-3.5" />
          <span>Remove all filters/orderings</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
