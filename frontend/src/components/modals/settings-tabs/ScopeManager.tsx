/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { 
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react'

import { Button } from '../../ui/button'
import { ScopeService, UserScopes, AvailableFeatures } from '../../../services/scopeService'

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
      {Object.entries(availableFeatures.features).map(([featureKey, feature]) => {
        const status = getFeatureStatus(featureKey)
        const isActivating = activatingFeatures.includes(featureKey)
        const isActive = status === 'active' || status === 'required'
        
        return (
          <div 
            key={featureKey}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-green-900/20' : 'bg-zinc-800'}`}>
                <div className={isActive ? '[&_img]:brightness-110' : '[&_img]:opacity-60'}>
                  {getFeatureIcon(featureKey)}
                </div>
              </div>
              <div>
                <h3 className="text-white text-sm font-medium">{feature.name}</h3>
                <p className="text-zinc-400 text-xs">
                  {isActive 
                    ? status === 'required' ? 'Required - Active' : 'Connected'
                    : 'Not connected'}
                </p>
              </div>
            </div>

            {status === 'inactive' && !feature.required ? (
              <Button
                onClick={() => handleActivateFeature(featureKey)}
                disabled={isActivating}
                size="sm"
              >
                {isActivating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Activating…
                  </>
                ) : (
                  'Activate'
                )}
              </Button>
            ) : isActive && !feature.required ? (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Connected
              </Button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
