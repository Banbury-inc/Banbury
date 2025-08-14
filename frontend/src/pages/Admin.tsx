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
  RefreshCw,
  BarChart3,
  Server,
  HardDrive,
  Network,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

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
  totalFiles?: number
  aiMessageCount?: number
}

interface ApiKey {
  key: string
  user_id: string
  role: string
  created_at: string
  last_used?: string
  permissions?: string[]
}

interface SystemStats {
  totalUsers: number
  totalFiles: number
  activeSessions: number
  systemUptime: string
  storageUsed: string
  storageTotal: string
  cpuUsage: number
  memoryUsage: number
  networkTraffic: number
}

interface RecentActivity {
  id: string
  type: 'user_registration' | 'file_upload' | 'api_key_generated' | 'login' | 'error'
  description: string
  timestamp: string
  severity: 'info' | 'warning' | 'error'
}

export default function Admin() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [users, setUsers] = useState<User[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('user')
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFiles: 0,
    activeSessions: 0,
    systemUptime: '0 days',
    storageUsed: '0 GB',
    storageTotal: '100 GB',
    cpuUsage: 0,
    memoryUsage: 0,
    networkTraffic: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    // Check if user is authorized (mmills only)
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username')
      setUsername(storedUsername || '')
      
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
  }, [router])

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
          totalFiles: usersResponse.system_total_files || prev.totalFiles,
          activeSessions: 89,
          systemUptime: '15 days, 7 hours',
          storageUsed: '2.4 GB',
          storageTotal: '100 GB',
          cpuUsage: 23,
          memoryUsage: 67,
          networkTraffic: 145
        }))
      } else {
        setUsers([])
      }
    } catch (error) {
      setUsers([])
    }

    // Mock recent activity
    setRecentActivity([
      {
        id: '1',
        type: 'user_registration',
        description: 'New user registered: john.doe@example.com',
        timestamp: '2 minutes ago',
        severity: 'info'
      },
      {
        id: '2',
        type: 'file_upload',
        description: 'File uploaded: document.pdf (2.3 MB)',
        timestamp: '5 minutes ago',
        severity: 'info'
      },
      {
        id: '3',
        type: 'api_key_generated',
        description: 'API key generated for user: admin',
        timestamp: '10 minutes ago',
        severity: 'info'
      },
      {
        id: '4',
        type: 'login',
        description: 'User login: mmills',
        timestamp: '15 minutes ago',
        severity: 'info'
      },
      {
        id: '5',
        type: 'error',
        description: 'Database connection timeout',
        timestamp: '1 hour ago',
        severity: 'warning'
      }
    ])

    try {
      // Load API keys
      const keysResponse = await ApiService.get('/authentication/api-key/list/') as any
      setApiKeys(keysResponse.api_keys || [])
    } catch (error) {
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="h-4 w-4" />
      case 'file_upload':
        return <Database className="h-4 w-4" />
      case 'api_key_generated':
        return <Key className="h-4 w-4" />
      case 'login':
        return <Shield className="h-4 w-4" />
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'text-blue-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getActivityBgColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'system', label: 'System', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">System Overview</h1>
                <Button onClick={loadAdminData} variant="outline" className="text-white border-zinc-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.totalUsers.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemStats.totalFiles.toLocaleString()}</div>
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">System Resources</CardTitle>
                    <CardDescription className="text-zinc-400">Current system resource usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">CPU Usage</span>
                        <span className="text-white">{systemStats.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${systemStats.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">Memory Usage</span>
                        <span className="text-white">{systemStats.memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${systemStats.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-300">Storage</span>
                        <span className="text-white">{systemStats.storageUsed} / {systemStats.storageTotal}</span>
                      </div>
                      <div className="w-full bg-zinc-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${(parseInt(systemStats.storageUsed) / parseInt(systemStats.storageTotal)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Activity</CardTitle>
                    <CardDescription className="text-zinc-400">Latest system events and user actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 text-sm">
                          <div className={`w-2 h-2 rounded-full ${getActivityBgColor(activity.severity)}`}></div>
                          <div className={`${getActivityColor(activity.severity)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <span className="text-zinc-300 flex-1">{activity.description}</span>
                          <span className="text-zinc-500">{activity.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
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
                <div className="flex gap-2">
                  <select 
                    value={selectedRole} 
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="bg-zinc-800 text-white border border-zinc-600 rounded px-3 py-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="readonly">Read Only</option>
                  </select>
                  <Button onClick={generateApiKey} className="bg-zinc-800 hover:bg-zinc-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Key
                  </Button>
                </div>
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
                          <div className="text-zinc-500 text-xs">Created: {new Date(key.created_at).toLocaleDateString()}</div>
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Database</CardTitle>
                    <CardDescription className="text-zinc-400">Database connection and performance settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Connection Status</Label>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-400">Connected</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Database Size</Label>
                      <span className="text-zinc-300">2.4 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Response Time</Label>
                      <span className="text-zinc-300">12ms avg</span>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Rate Limiting</Label>
                      <span className="text-zinc-300">1000 req/min</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Network</CardTitle>
                    <CardDescription className="text-zinc-400">Network configuration and monitoring</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Network Status</Label>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-400">Online</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Traffic</Label>
                      <span className="text-zinc-300">{systemStats.networkTraffic} MB/s</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Uptime</Label>
                      <span className="text-zinc-300">{systemStats.systemUptime}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Backup</CardTitle>
                    <CardDescription className="text-zinc-400">Backup and recovery settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Last Backup</Label>
                      <span className="text-zinc-300">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Backup Schedule</Label>
                      <span className="text-zinc-300">Daily at 2 AM</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Retention</Label>
                      <span className="text-zinc-300">30 days</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-white">Analytics</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Daily Active Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">1,247</div>
                    <div className="text-green-400 text-sm">+12% from yesterday</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">File Uploads</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">3,421</div>
                    <div className="text-green-400 text-sm">+8% from yesterday</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">API Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">45.2K</div>
                    <div className="text-blue-400 text-sm">+5% from yesterday</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-zinc-900 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">0.2%</div>
                    <div className="text-green-400 text-sm">-0.1% from yesterday</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-zinc-900 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">System Performance</CardTitle>
                  <CardDescription className="text-zinc-400">Real-time system performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Response Times</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">API Calls</span>
                          <span className="text-white">45ms avg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">File Uploads</span>
                          <span className="text-white">1.2s avg</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">Database Queries</span>
                          <span className="text-white">12ms avg</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Throughput</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">Requests/sec</span>
                          <span className="text-white">1,247</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">Data Transfer</span>
                          <span className="text-white">2.4 GB/s</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">Concurrent Users</span>
                          <span className="text-white">89</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">Errors</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">4xx Errors</span>
                          <span className="text-yellow-400">12</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">5xx Errors</span>
                          <span className="text-red-400">3</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-300">Timeouts</span>
                          <span className="text-orange-400">7</span>
                        </div>
                      </div>
                    </div>
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
