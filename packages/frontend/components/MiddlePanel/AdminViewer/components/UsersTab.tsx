import { useState, useEffect, useMemo } from 'react'
import { Users, Settings2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../common/ui/card'
import { Button } from '../../../common/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../common/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../common/ui/tooltip'
import { GmailIcon, GoogleDriveIcon, GoogleCalendarIcon } from '../../../icons'
import { 
  buildUserGoogleIntegrationsMap, 
  getGoogleIntegrationsForUser,
  GoogleScopesAnalyticsData 
} from '../handlers/google-integrations'

interface User {
  _id: string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  auth_method?: string
  created_at?: string
  last_login?: string
  is_active?: boolean
  subscription?: string
  totalFiles?: number
  totalFileSize?: number
  lastFileUploadAt?: string
  aiMessageCount?: number
  lastAiMessageAt?: string
  loginCount?: number
  lastLoginDate?: string
  workspaceVisitCount?: number
  lastWorkspaceVisitDate?: string
  preferredAuthMethod?: string
  marketingEmailsOptOut?: boolean
}

interface GoogleScopesAnalytics {
  summary: {
    total_google_users: number
    users_with_scopes: number
    unique_scopes: number
    most_common_scope: string
    average_scopes_per_user: number
  }
  scope_stats: Array<{scope: string, count: number, percentage: number}>
  category_stats: Array<{category: string, count: number}>
  distribution_stats: Array<{scope_count: number, user_count: number}>
  users_with_scopes: Array<{user_id: string, username: string, email: string, scopes: string[], scope_count: number}>
}

interface UsersTabProps {
  users: User[]
  convertToEasternTime: (timestamp: string) => string
  formatBytes: (bytes: number, decimals?: number) => string
  scopesAnalytics: GoogleScopesAnalytics | null
}

interface ColumnConfig {
  key: string
  label: string
  defaultVisible: boolean
}

const COLUMNS: ColumnConfig[] = [
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'integrations', label: 'Google', defaultVisible: true },
  { key: 'plan', label: 'Plan', defaultVisible: true },
  { key: 'files', label: 'Files', defaultVisible: true },
  { key: 'storage', label: 'Storage', defaultVisible: true },
  { key: 'aiMessages', label: 'AI Messages', defaultVisible: true },
  { key: 'logins', label: 'Logins', defaultVisible: true },
  { key: 'lastLogin', label: 'Last Login', defaultVisible: true },
  { key: 'workspaceVisits', label: 'Workspace Visits', defaultVisible: true },
  { key: 'lastWorkspaceVisit', label: 'Last Workspace Visit', defaultVisible: true },
  { key: 'auth', label: 'Auth Method', defaultVisible: true },
  { key: 'marketingOptOut', label: 'Marketing Opt-Out', defaultVisible: true },
  { key: 'created', label: 'Created', defaultVisible: true },
]

const STORAGE_KEY = 'usersTab-visibleColumns'

type SortKey = 'user' | 'email' | 'integrations' | 'plan' | 'files' | 'storage' | 'aiMessages' | 'logins' | 'lastLogin' | 'workspaceVisits' | 'lastWorkspaceVisit' | 'auth' | 'marketingOptOut' | 'created' | null
type SortDirection = 'asc' | 'desc' | null

export function UsersTab({ users, convertToEasternTime, formatBytes, scopesAnalytics }: UsersTabProps) {
  // Build a lookup map from scopes analytics for quick access
  const integrationsMap = useMemo(
    () => buildUserGoogleIntegrationsMap(scopesAnalytics),
    [scopesAnalytics]
  )

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const defaultColumns = new Set(COLUMNS.filter(col => col.defaultVisible).map(col => col.key))
    
    if (stored) {
      const savedColumns = new Set<string>(JSON.parse(stored) as string[])
      // Merge: add any new default columns that aren't in saved preferences
      COLUMNS.forEach(col => {
        if (col.defaultVisible && !savedColumns.has(col.key)) {
          savedColumns.add(col.key)
        }
      })
      return savedColumns
    }
    return defaultColumns
  })

  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(visibleColumns)))
  }, [visibleColumns])

  function toggleColumn(columnKey: string) {
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey)
      } else {
        newSet.add(columnKey)
      }
      return newSet
    })
  }

  function isColumnVisible(columnKey: string) {
    return visibleColumns.has(columnKey)
  }

  function handleSort(columnKey: SortKey) {
    if (sortKey === columnKey) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortKey(null)
        setSortDirection(null)
      }
    } else {
      setSortKey(columnKey)
      setSortDirection('asc')
    }
  }

  function getSortIcon(columnKey: SortKey) {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 ml-1" />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-3 w-3 ml-1" />
    }
    return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />
  }

  const sortedUsers = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return users
    }

    return [...users].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortKey) {
        case 'user':
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.username
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.username
          break
        case 'email':
          aValue = a.email || ''
          bValue = b.email || ''
          break
        case 'integrations':
          const aFlags = getGoogleIntegrationsForUser(integrationsMap, a._id, a.email, a.username)
          const bFlags = getGoogleIntegrationsForUser(integrationsMap, b._id, b.email, b.username)
          aValue = aFlags?.scopeCount || 0
          bValue = bFlags?.scopeCount || 0
          break
        case 'plan':
          aValue = a.subscription || 'free'
          bValue = b.subscription || 'free'
          break
        case 'files':
          aValue = a.totalFiles || 0
          bValue = b.totalFiles || 0
          break
        case 'storage':
          aValue = a.totalFileSize || 0
          bValue = b.totalFileSize || 0
          break
        case 'aiMessages':
          aValue = a.aiMessageCount || 0
          bValue = b.aiMessageCount || 0
          break
        case 'logins':
          aValue = a.loginCount || 0
          bValue = b.loginCount || 0
          break
        case 'lastLogin':
          aValue = a.lastLoginDate ? new Date(a.lastLoginDate).getTime() : 0
          bValue = b.lastLoginDate ? new Date(b.lastLoginDate).getTime() : 0
          break
        case 'workspaceVisits':
          aValue = a.workspaceVisitCount || 0
          bValue = b.workspaceVisitCount || 0
          break
        case 'lastWorkspaceVisit':
          aValue = a.lastWorkspaceVisitDate ? new Date(a.lastWorkspaceVisitDate).getTime() : 0
          bValue = b.lastWorkspaceVisitDate ? new Date(b.lastWorkspaceVisitDate).getTime() : 0
          break
        case 'auth':
          aValue = a.auth_method || ''
          bValue = b.auth_method || ''
          break
        case 'marketingOptOut':
          aValue = a.marketingEmailsOptOut ? 1 : 0
          bValue = b.marketingEmailsOptOut ? 1 : 0
          break
        case 'created':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0
          break
        default:
          return 0
      }

      // Handle comparison
      let comparison = 0
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue)
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [users, sortKey, sortDirection, integrationsMap])
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
      </div>
      
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <CardTitle className="text-foreground">All Users</CardTitle>
              <CardDescription className="text-muted-foreground">Manage user accounts and view file statistics</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="sm:ml-auto border-zinc-200 dark:border-white/[0.06] hover:bg-accent dark:hover:bg-accent">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] max-w-sm sm:w-56">
                <DropdownMenuLabel className="text-muted-foreground">Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COLUMNS.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={isColumnVisible(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {sortedUsers.map((user) => {
              const flags = getGoogleIntegrationsForUser(
                integrationsMap,
                user._id,
                user.email,
                user.username
              )
              return (
                <Card key={user._id} className="bg-card border-zinc-200 dark:border-white/[0.06]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground font-medium text-sm truncate">
                          </div>
                          <div className="text-muted-foreground text-xs truncate">@{user.username}</div>
                          {user.email && (
                            <div className="text-muted-foreground text-xs truncate mt-0.5">{user.email}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.subscription === 'pro' 
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' 
                            : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        }`}>
                          {user.subscription === 'pro' ? 'Pro' : 'Free'}
                        </span>
                        {flags && (
                          <div className="flex items-center justify-center gap-0.5">
                            <div className={`rounded p-0.5 ${flags.hasGmail ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                              <GmailIcon size={12} />
                            </div>
                            <div className={`rounded p-0.5 ${flags.hasDrive ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                              <GoogleDriveIcon size={12} />
                            </div>
                            <div className={`rounded p-0.5 ${flags.hasCalendar ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                              <GoogleCalendarIcon size={12} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-white/[0.04]">
                      <div>
                        <div className="text-muted-foreground text-xs">Files</div>
                        <div className="text-foreground font-medium text-sm">{user.totalFiles?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Storage</div>
                        <div className="text-foreground font-medium text-sm">{user.totalFileSize ? formatBytes(user.totalFileSize) : '0 B'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">AI Messages</div>
                        <div className="text-foreground font-medium text-sm">{user.aiMessageCount?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Logins</div>
                        <div className="text-foreground font-medium text-sm">{user.loginCount?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Workspace Visits</div>
                        <div className="text-foreground font-medium text-sm">{user.workspaceVisitCount?.toLocaleString() || 0}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Last Login</div>
                        <div className="text-foreground text-xs">{user.lastLoginDate ? convertToEasternTime(user.lastLoginDate) : 'Never'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs">Marketing Opt-Out</div>
                        <div className="text-foreground font-medium text-sm">{user.marketingEmailsOptOut ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-zinc-200 dark:border-white/[0.04]">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.auth_method === 'google_oauth' 
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                            : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        }`}>
                          {user.auth_method === 'google_oauth' ? 'Google' : 'Email'}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          Created: {user.created_at ? convertToEasternTime(user.created_at) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {sortedUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found.
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block max-h-[calc(100vh-300px)] overflow-auto border border-zinc-200 dark:border-white/[0.06] rounded-lg">
            <table className="w-full min-w-full">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
                  {isColumnVisible('user') && (
                    <th 
                      className="text-left py-2 px-2 text-muted-foreground font-medium text-sm cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('user')}
                    >
                      <div className="flex items-center">
                        User
                        {getSortIcon('user')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('email') && (
                    <th 
                      className="text-left py-2 px-2 text-muted-foreground font-medium text-sm cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        {getSortIcon('email')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('integrations') && (
                    <th 
                      className="text-center py-2 px-2 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('integrations')}
                    >
                      <div className="flex items-center justify-center">
                        Google
                        {getSortIcon('integrations')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('plan') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('plan')}
                    >
                      <div className="flex items-center justify-center">
                        Plan
                        {getSortIcon('plan')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('files') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('files')}
                    >
                      <div className="flex items-center justify-center">
                        Files
                        {getSortIcon('files')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('storage') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('storage')}
                    >
                      <div className="flex items-center justify-center">
                        Storage
                        {getSortIcon('storage')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('aiMessages') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('aiMessages')}
                    >
                      <div className="flex items-center justify-center">
                        AI Msgs
                        {getSortIcon('aiMessages')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('logins') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('logins')}
                    >
                      <div className="flex items-center justify-center">
                        Logins
                        {getSortIcon('logins')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('lastLogin') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('lastLogin')}
                    >
                      <div className="flex items-center justify-center">
                        Last Login
                        {getSortIcon('lastLogin')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('workspaceVisits') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('workspaceVisits')}
                    >
                      <div className="flex items-center justify-center">
                        Workspace Visits
                        {getSortIcon('workspaceVisits')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('lastWorkspaceVisit') && (
                    <th 
                      className="text-center py-2 px-1 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('lastWorkspaceVisit')}
                    >
                      <div className="flex items-center justify-center">
                        Last Workspace Visit
                        {getSortIcon('lastWorkspaceVisit')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('auth') && (
                    <th 
                      className="text-center py-2 px-2 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('auth')}
                    >
                      <div className="flex items-center justify-center">
                        Auth
                        {getSortIcon('auth')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('marketingOptOut') && (
                    <th 
                      className="text-center py-2 px-2 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('marketingOptOut')}
                    >
                      <div className="flex items-center justify-center">
                        Marketing Opt-Out
                        {getSortIcon('marketingOptOut')}
                      </div>
                    </th>
                  )}
                  {isColumnVisible('created') && (
                    <th 
                      className="text-center py-2 px-2 text-muted-foreground font-medium text-xs cursor-pointer hover:bg-accent/50 transition-colors select-none"
                      onClick={() => handleSort('created')}
                    >
                      <div className="flex items-center justify-center">
                        Created
                        {getSortIcon('created')}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user) => (
                  <tr key={user._id} className="border-b border-zinc-200 dark:border-white/[0.04] hover:bg-accent/50 dark:hover:bg-accent/50 transition-colors">
                    {isColumnVisible('user') && (
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                            <Users className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-foreground font-medium text-sm truncate">
                              {user.first_name} {user.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('email') && (
                      <td className="py-2 px-2 text-muted-foreground text-sm truncate">{user.email}</td>
                    )}
                    {isColumnVisible('integrations') && (
                      <td className="py-2 px-2 text-center">
                        {(() => {
                          const flags = getGoogleIntegrationsForUser(
                            integrationsMap,
                            user._id,
                            user.email,
                            user.username
                          )
                          
                          if (!flags) {
                            return (
                              <span className="text-muted-foreground text-xs">—</span>
                            )
                          }
                          
                          const tooltipContent = `${flags.scopeCount} scope(s): ${flags.scopes.slice(0, 3).map(s => s.split('/').pop()).join(', ')}${flags.scopes.length > 3 ? '...' : ''}`
                          
                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center gap-1">
                                    <div className={`rounded p-0.5 ${flags.hasGmail ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                                      <GmailIcon size={14} />
                                    </div>
                                    <div className={`rounded p-0.5 ${flags.hasDrive ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                                      <GoogleDriveIcon size={14} />
                                    </div>
                                    <div className={`rounded p-0.5 ${flags.hasCalendar ? 'opacity-100' : 'opacity-25 grayscale'}`}>
                                      <GoogleCalendarIcon size={14} />
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <div className="text-xs">
                                    <div className="font-medium mb-1">Google Services</div>
                                    <div className={flags.hasGmail ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                      Gmail: {flags.hasGmail ? 'Connected' : 'Not connected'}
                                    </div>
                                    <div className={flags.hasDrive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                      Drive: {flags.hasDrive ? 'Connected' : 'Not connected'}
                                    </div>
                                    <div className={flags.hasCalendar ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                      Calendar: {flags.hasCalendar ? 'Connected' : 'Not connected'}
                                    </div>
                                    <div className="mt-1 text-muted-foreground text-[10px]">{tooltipContent}</div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )
                        })()}
                      </td>
                    )}
                    {isColumnVisible('plan') && (
                      <td className="py-2 px-1 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.subscription === 'pro' 
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' 
                            : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        }`}>
                          {user.subscription === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('files') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-foreground font-medium text-sm">{user.totalFiles?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('storage') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-foreground font-medium text-sm" title={user.lastFileUploadAt ? convertToEasternTime(user.lastFileUploadAt) : 'Never'}>
                          {user.totalFileSize ? formatBytes(user.totalFileSize) : '0 B'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('aiMessages') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-foreground font-medium text-sm">{user.aiMessageCount?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('logins') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-foreground font-medium text-sm">{user.loginCount?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('lastLogin') && (
                      <td className="py-2 px-1 text-center text-muted-foreground text-xs whitespace-nowrap">
                        {user.lastLoginDate ? convertToEasternTime(user.lastLoginDate) : 'Never'}
                      </td>
                    )}
                    {isColumnVisible('workspaceVisits') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-foreground font-medium text-sm">{user.workspaceVisitCount?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('lastWorkspaceVisit') && (
                      <td className="py-2 px-1 text-center text-muted-foreground text-xs whitespace-nowrap">
                        {user.lastWorkspaceVisitDate ? convertToEasternTime(user.lastWorkspaceVisitDate) : 'Never'}
                      </td>
                    )}
                    {isColumnVisible('auth') && (
                      <td className="py-2 px-2 text-center">
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          user.auth_method === 'google_oauth' 
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                            : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        }`}>
                          {user.auth_method === 'google_oauth' ? 'Google' : 'Email'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('marketingOptOut') && (
                      <td className="py-2 px-2 text-center">
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          user.marketingEmailsOptOut
                            ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {user.marketingEmailsOptOut ? 'Yes' : 'No'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('created') && (
                      <td className="py-2 px-2 text-center text-muted-foreground text-xs">
                        {user.created_at ? convertToEasternTime(user.created_at) : 'N/A'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sortedUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

