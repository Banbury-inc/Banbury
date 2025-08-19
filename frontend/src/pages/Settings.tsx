import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  FolderOpen, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Link
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { ScopeManager } from '../components/ScopeManager'
import { ApiService } from '../services/apiService'
import { NavSidebar } from '../components/nav-sidebar'

const Settings = (): JSX.Element => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [scopeActivated, setScopeActivated] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Manage your account information'
    },
    {
      id: 'connections',
      label: 'Connections',
      icon: Link,
      description: 'Manage your Google integrations'
    }
  ]

  useEffect(() => {
    // Check if user just activated a scope
    if (router.query.scopeActivated === 'true') {
      setScopeActivated(true)
      // Remove the query parameter
      router.replace('/settings', undefined, { shallow: true })
    }

    loadUserInfo()
  }, [router.query.scopeActivated])

  const loadUserInfo = async () => {
    try {
      setLoading(true)
      // Get username from localStorage for now
      const username = localStorage.getItem('username')
      const email = localStorage.getItem('userEmail')
      setUserInfo({
        username: username || 'Unknown',
        email: email || 'Not provided',
        first_name: 'Not provided',
        last_name: 'Not provided'
      })
    } catch (error) {
      console.error('Error loading user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black">
        <NavSidebar onLogout={handleLogout} />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

    return (
    <div className="flex h-screen bg-black">
      <NavSidebar onLogout={handleLogout} />
      <div className="flex-1 ml-16 flex">
        {/* Settings Sidebar */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-700 p-4">
          <h2 className="text-white text-lg font-semibold mb-6">Settings</h2>
          <nav className="space-y-2">
            {settingsTabs.map((tab) => {
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
                  <div>
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-zinc-500">{tab.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              {settingsTabs.find(tab => tab.id === activeTab)?.label}
            </h1>
            <p className="text-gray-400">
              {settingsTabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>

                  {/* Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Scope Activation Success Message */}
              {scopeActivated && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-400">
                      Google integration features activated successfully!
                    </span>
                  </div>
                </div>
              )}

              {/* User Info */}
              {userInfo && (
                <div className="p-6 bg-zinc-900 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <User className="h-5 w-5 mr-2" />
                    Account Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Username</label>
                      <p className="text-white">{userInfo.username}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white">{userInfo.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">First Name</label>
                      <p className="text-white">{userInfo.first_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Last Name</label>
                      <p className="text-white">{userInfo.last_name || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile Update Form - Coming Soon */}
              <div className="p-6 bg-zinc-900 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-white">Update Profile</h3>
                <p className="text-gray-400 mb-4">Profile update functionality coming soon.</p>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="space-y-8">
              {/* Google Integration */}
              <div className="p-6 bg-zinc-900 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Link className="h-5 w-5 mr-2" />
                  Google Integration
                </h2>
                <ScopeManager 
                  onFeatureActivated={(feature) => {
                    console.log(`Feature activated: ${feature}`)
                    // You could show a success message or refresh the page
                  }}
                />
              </div>


            </div>
          )}


        </div>
      </div>
    </div>
  )
}

export default Settings
