import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { NavSidebar } from '../components/nav-sidebar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { ApiService } from '../services/apiService'
import { 
  Users, 
  Settings, 
  Database, 
  Activity, 
  Shield, 
  Key, 
  Trash2, 
  Plus,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'

interface User {
  _id: string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  auth_method?: string
  created_at?: string
  totalFiles?: number
  aiMessageCount?: number
}

interface ApiKey {
  key: string
  user_id: string
  role: string
  created_at: string
  last_used?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('user')
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalFiles: 0,
    activeSessions: 0,
    systemUptime: '0 days'
  })

  useEffect(() => {
    // Check if user is authorized (mmills or mmills6060@gmail.com)
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username')
      
      if (storedUsername !== 'mmills' && storedUsername !== 'mmills6060@gmail.com') {
        router.push('/dashboard')
        return
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    if (!token) {
      router.push('/login')
      return
    }
    
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    
    try {
      // Load real users data
      const usersResponse = await ApiService.get('/users/list_all_users/') as any
      if (usersResponse.result === 'success') {
        setUsers(usersResponse.users || [])
        setSystemStats(prev => ({
          ...prev,
          totalUsers: usersResponse.total_count || 0,
          totalFiles: usersResponse.system_total_files || 0,
          activeSessions: 23,
          systemUptime: '15 days'
        }))
      } else {
        // Fallback
        setUsers([])
      }
    } catch (error) {
      setUsers([])
    }

    try {
      // Try to load API keys, but don't fail if it doesn't work
      const keysResponse = await ApiService.get('/authentication/api-key/list/') as any
      setApiKeys(keysResponse.api_keys || [])
    } catch (error) {
      // Set empty array for API keys if the request fails
      setApiKeys([])
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    try {
      const response = await ApiService.post('/authentication/api-key/generate/', {
        role: selectedRole
      }) as any
      setNewApiKey(response.api_key)
      await loadAdminData() // Refresh the list
    } catch (error) {
      // Handle error silently
    }
  }

  const deleteApiKey = async (key: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return
    
    try {
      await ApiService.post('/authentication/api-key/delete/', { api_key: key })
      await loadAdminData() // Refresh the list
    } catch (error) {
      // Handle error silently
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'system', label: 'System', icon: Settings }
  ]

  if (loading) {
    return (
      <div className="flex h-screen bg-black">
        <NavSidebar />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-black">
      <NavSidebar />
      <div className="flex-1 ml-16 flex">
        {/* Sidebar */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-700 p-4">
          <h2 className="text-white text-lg font-semibold mb-6">Admin Panel</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">System Overview</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.totalUsers}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.totalFiles}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.activeSessions}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">System Uptime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.systemUptime}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-zinc-400">Latest system events and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-zinc-300">New user registered: john.doe@example.com</span>
                      <span className="text-zinc-500 ml-auto">2 minutes ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-zinc-300">File uploaded: document.pdf</span>
                      <span className="text-zinc-500 ml-auto">5 minutes ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-zinc-300">API key generated for user: admin</span>
                      <span className="text-zinc-500 ml-auto">10 minutes ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Debug info */}
              <div className="bg-red-500 text-white p-4 rounded">
                Debug: Active tab = {activeTab}, Users count = {users.length}, Loading = {loading.toString()}
              </div>
              
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">User Management</h1>
                <Button className="bg-zinc-800 hover:bg-zinc-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              

              
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">All Users</CardTitle>
                  <CardDescription className="text-zinc-400">Manage user accounts and view file statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto border border-zinc-700 rounded-lg">
                    <table className="w-full min-w-full">
                      <thead>
                        <tr className="border-b border-zinc-700">
                          <th className="text-left py-3 px-4 text-zinc-300 font-medium">User</th>
                          <th className="text-left py-3 px-4 text-zinc-300 font-medium">Email</th>
                          <th className="text-left py-3 px-4 text-zinc-300 font-medium">Total Files</th>
                          <th className="text-left py-3 px-4 text-zinc-300 font-medium">AI Messages</th>
                          <th className="text-left py-3 px-4 text-zinc-300 font-medium">Auth Method</th>
                          <th className="text-left py-3 px-4 text-zinc-300 font-medium">Created</th>
                          <th className="text-left py-3 px-4 text-zinc-300 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-zinc-400" />
                                </div>
                                <div>
                                  <div className="text-white font-medium">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-zinc-400 text-sm">@{user.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-zinc-300">{user.email}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-blue-400" />
                                <span className="text-white font-medium">{user.totalFiles?.toLocaleString() || 0}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-white font-medium">{user.aiMessageCount?.toLocaleString() || 0}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.auth_method === 'Google OAuth' 
                                  ? 'bg-blue-900/50 text-blue-300' 
                                  : 'bg-green-900/50 text-green-300'
                              }`}>
                                {user.auth_method}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-sm">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                                  <Database className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
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
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">API Key Management</h1>
                <Button onClick={generateApiKey} className="bg-zinc-800 hover:bg-zinc-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </div>

              {newApiKey && (
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">New API Key Generated</CardTitle>
                    <CardDescription className="text-zinc-400">Copy this key now - it won't be shown again</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={newApiKey} 
                        readOnly 
                        className="bg-zinc-800 text-white border-zinc-600"
                      />
                      <Button 
                        onClick={() => navigator.clipboard.writeText(newApiKey)}
                        className="bg-zinc-800 hover:bg-zinc-700"
                      >
                        Copy
                      </Button>
                      <Button 
                        onClick={() => setNewApiKey(null)}
                        variant="ghost"
                        className="text-zinc-400 hover:text-white"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">API Keys</CardTitle>
                  <CardDescription className="text-zinc-400">Manage API keys for external integrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.key} className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                        <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                          <Key className="h-4 w-4 text-zinc-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{key.key.substring(0, 8)}...</div>
                          <div className="text-zinc-400 text-sm">Role: {key.role}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowApiKey(showApiKey === key.key ? null : key.key)}
                            className="text-zinc-400 hover:text-white"
                          >
                            {showApiKey === key.key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(key.key)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {showApiKey === key.key && (
                          <div className="mt-2 p-2 bg-zinc-700 rounded text-sm font-mono text-white">
                            {key.key}
                          </div>
                        )}
                      </div>
                    ))}
                    {apiKeys.length === 0 && (
                      <div className="text-center py-8 text-zinc-400">
                        No API keys found. Generate one to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">System Settings</h1>
              
              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Database</CardTitle>
                  <CardDescription className="text-zinc-400">Database connection and performance settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Connection Status</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-400">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Database Size</Label>
                    <span className="text-zinc-300">2.4 GB</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Security</CardTitle>
                  <CardDescription className="text-zinc-400">Security and authentication settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Two-Factor Authentication</Label>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Session Timeout</Label>
                    <span className="text-zinc-300">7 days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
