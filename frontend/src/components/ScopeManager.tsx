/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react'

import { Button } from './ui/button'
import { ScopeService, UserScopes, AvailableFeatures, GoogleFeature } from '../services/scopeService'

interface ScopeManagerProps {
  onFeatureActivated?: (feature: string) => void
  className?: string
}

export function ScopeManager({ onFeatureActivated, className = '' }: ScopeManagerProps) {
  const [userScopes, setUserScopes] = useState<UserScopes | null>(null)
  const [availableFeatures, setAvailableFeatures] = useState<AvailableFeatures | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activatingFeatures, setActivatingFeatures] = useState<string[]>([])

  // Load user scopes and available features
  useEffect(() => {
    loadScopeData()
  }, [])

  const loadScopeData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [scopes, features] = await Promise.all([
        ScopeService.getUserScopes(),
        ScopeService.getAvailableFeatures()
      ])
      
      setUserScopes(scopes)
      setAvailableFeatures(features)
    } catch (err) {
      console.error('Error loading scope data:', err)
      setError('Failed to load Google integration settings')
    } finally {
      setLoading(false)
    }
  }

  const handleActivateFeature = async (featureKey: string) => {
    try {
      setActivatingFeatures(prev => [...prev, featureKey])
      
      await ScopeService.requestFeatureAccess([featureKey])
      
      // The user will be redirected to Google OAuth
      // When they return, the callback will handle the scope update
    } catch (err) {
      console.error(`Error activating feature ${featureKey}:`, err)
      setError(`Failed to activate ${featureKey}. Please try again.`)
      setActivatingFeatures(prev => prev.filter(f => f !== featureKey))
    }
  }

  const getFeatureIcon = (featureKey: string) => {
    switch (featureKey) {
      case 'profile':
        return (
          <div className="bg-white rounded p-1">
            <img
              src="https://cdn.simpleicons.org/google"
              alt="Google"
              className="h-5 w-5"
            />
          </div>
        )
      case 'drive':
        return (
          <div className="bg-white rounded p-1">
            <img
              src="https://cdn.simpleicons.org/googledrive"
              alt="Google Drive"
              className="h-5 w-5"
            />
          </div>
        )
      case 'gmail':
        return (
          <div className="bg-white rounded p-1">
            <img
              src="https://cdn.simpleicons.org/gmail"
              alt="Gmail"
              className="h-5 w-5"
            />
          </div>
        )
      case 'calendar':
        return (
          <div className="bg-white rounded p-1">
            <img
              src="https://cdn.simpleicons.org/googlecalendar"
              alt="Google Calendar"
              className="h-5 w-5"
            />
          </div>
        )
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const getFeatureStatus = (featureKey: string) => {
    if (!userScopes || !availableFeatures) return 'unknown'
    
    const isAvailable = userScopes.available_features[featureKey as keyof typeof userScopes.available_features]
    const feature = availableFeatures.features[featureKey as keyof typeof availableFeatures.features]
    
    if (feature.required) return 'required'
    if (isAvailable) return 'active'
    return 'inactive'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />
      case 'required':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'inactive':
        return 'Inactive'
      case 'required':
        return 'Required'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-6 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading Google integration settings...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-900/20 border border-red-700 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-400">{error}</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadScopeData}
          className="mt-2 border-red-600 text-red-400 hover:bg-red-900/20"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!userScopes || !availableFeatures) {
    return (
      <div className={`p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
          <span className="text-yellow-400">No Google integration data available</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Google Integration</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadScopeData}
          disabled={loading}
          className="border-zinc-600 text-gray-300 hover:bg-zinc-700 hover:text-white"
        >
          <Settings className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {Object.entries(availableFeatures.features).map(([featureKey, feature]) => {
          const status = getFeatureStatus(featureKey)
          const isActivating = activatingFeatures.includes(featureKey)
          
          return (
            <div 
              key={featureKey}
              className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getFeatureIcon(featureKey)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-medium text-white">{feature.name}</h4>
                    {getStatusIcon(status)}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      status === 'active' ? 'bg-green-900/30 text-green-400 border border-green-700' :
                      status === 'inactive' ? 'bg-zinc-700 text-gray-300 border border-zinc-600' :
                      'bg-blue-900/30 text-blue-400 border border-blue-700'
                    }`}>
                      {getStatusText(status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                {status === 'inactive' && !feature.required && (
                  <Button
                    size="sm"
                    onClick={() => handleActivateFeature(featureKey)}
                    disabled={isActivating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isActivating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Activating...
                      </>
                    ) : (
                      'Activate'
                    )}
                  </Button>
                )}
                {status === 'active' && (
                  <div className="text-xs text-green-400 font-medium">
                    ✓ Available
                  </div>
                )}
                {status === 'required' && (
                  <div className="text-xs text-blue-400 font-medium">
                    ✓ Required
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
