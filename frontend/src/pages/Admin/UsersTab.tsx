import { useState, useEffect } from 'react'
import { Users, Settings2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'

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
}

interface UsersTabProps {
  users: User[]
  convertToEasternTime: (timestamp: string) => string
  formatBytes: (bytes: number, decimals?: number) => string
}

interface ColumnConfig {
  key: string
  label: string
  defaultVisible: boolean
}

const COLUMNS: ColumnConfig[] = [
  { key: 'user', label: 'User', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'plan', label: 'Plan', defaultVisible: true },
  { key: 'files', label: 'Files', defaultVisible: true },
  { key: 'storage', label: 'Storage', defaultVisible: true },
  { key: 'aiMessages', label: 'AI Messages', defaultVisible: true },
  { key: 'logins', label: 'Logins', defaultVisible: true },
  { key: 'lastLogin', label: 'Last Login', defaultVisible: true },
  { key: 'workspaceVisits', label: 'Workspace Visits', defaultVisible: true },
  { key: 'lastWorkspaceVisit', label: 'Last Workspace Visit', defaultVisible: true },
  { key: 'auth', label: 'Auth Method', defaultVisible: true },
  { key: 'created', label: 'Created', defaultVisible: true },
]

const STORAGE_KEY = 'usersTab-visibleColumns'

export function UsersTab({ users, convertToEasternTime, formatBytes }: UsersTabProps) {
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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
      </div>
      
      <Card className="bg-zinc-900 border-zinc-700">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white">All Users</CardTitle>
              <CardDescription className="text-zinc-400">Manage user accounts and view file statistics</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-zinc-400">Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COLUMNS.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.key}
                    checked={isColumnVisible(column.key)}
                    onCheckedChange={() => toggleColumn(column.key)}
                    className="text-zinc-300"
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border border-zinc-700 rounded-lg">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-zinc-700">
                  {isColumnVisible('user') && (
                    <th className="text-left py-2 px-2 text-zinc-300 font-medium text-sm">User</th>
                  )}
                  {isColumnVisible('email') && (
                    <th className="text-left py-2 px-2 text-zinc-300 font-medium text-sm">Email</th>
                  )}
                  {isColumnVisible('plan') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Plan</th>
                  )}
                  {isColumnVisible('files') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Files</th>
                  )}
                  {isColumnVisible('storage') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Storage</th>
                  )}
                  {isColumnVisible('aiMessages') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">AI Msgs</th>
                  )}
                  {isColumnVisible('logins') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Logins</th>
                  )}
                  {isColumnVisible('lastLogin') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Last Login</th>
                  )}
                  {isColumnVisible('workspaceVisits') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Workspace Visits</th>
                  )}
                  {isColumnVisible('lastWorkspaceVisit') && (
                    <th className="text-center py-2 px-1 text-zinc-300 font-medium text-xs">Last Workspace Visit</th>
                  )}
                  {isColumnVisible('auth') && (
                    <th className="text-center py-2 px-2 text-zinc-300 font-medium text-xs">Auth</th>
                  )}
                  {isColumnVisible('created') && (
                    <th className="text-center py-2 px-2 text-zinc-300 font-medium text-xs">Created</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    {isColumnVisible('user') && (
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center">
                            <Users className="h-3 w-3 text-zinc-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-white font-medium text-sm truncate">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-zinc-400 text-xs truncate">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('email') && (
                      <td className="py-2 px-2 text-zinc-300 text-sm truncate">{user.email}</td>
                    )}
                    {isColumnVisible('plan') && (
                      <td className="py-2 px-1 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.subscription === 'pro' 
                            ? 'bg-purple-900/50 text-purple-300' 
                            : 'bg-green-900/50 text-green-300'
                        }`}>
                          {user.subscription === 'pro' ? 'Pro' : 'Free'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('files') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-white font-medium text-sm">{user.totalFiles?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('storage') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-white font-medium text-sm" title={user.lastFileUploadAt ? convertToEasternTime(user.lastFileUploadAt) : 'Never'}>
                          {user.totalFileSize ? formatBytes(user.totalFileSize) : '0 B'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('aiMessages') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-white font-medium text-sm">{user.aiMessageCount?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('logins') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-white font-medium text-sm">{user.loginCount?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('lastLogin') && (
                      <td className="py-2 px-1 text-center text-zinc-400 text-xs">
                        {user.lastLoginDate ? convertToEasternTime(user.lastLoginDate) : 'Never'}
                      </td>
                    )}
                    {isColumnVisible('workspaceVisits') && (
                      <td className="py-2 px-1 text-center">
                        <span className="text-white font-medium text-sm">{user.workspaceVisitCount?.toLocaleString() || 0}</span>
                      </td>
                    )}
                    {isColumnVisible('lastWorkspaceVisit') && (
                      <td className="py-2 px-1 text-center text-zinc-400 text-xs">
                        {user.lastWorkspaceVisitDate ? convertToEasternTime(user.lastWorkspaceVisitDate) : 'Never'}
                      </td>
                    )}
                    {isColumnVisible('auth') && (
                      <td className="py-2 px-2 text-center">
                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                          user.auth_method === 'google_oauth' 
                            ? 'bg-blue-900/50 text-blue-300' 
                            : 'bg-green-900/50 text-green-300'
                        }`}>
                          {user.auth_method === 'google_oauth' ? 'Google' : 'Email'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('created') && (
                      <td className="py-2 px-2 text-center text-zinc-400 text-xs">
                        {user.created_at ? convertToEasternTime(user.created_at) : 'N/A'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-8 text-zinc-400">
              No users found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

