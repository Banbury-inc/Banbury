/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { 
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react'

import { Button } from '../../common/ui/button'
import { Typography } from '../../common/ui/typography'
import { ApiService } from '../../../../backend/api/apiService'
import { UserScopes, AvailableFeatures } from '../../../../backend/api/scopes/scopes'

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
        ApiService.Scopes.getUserScopes(),
        ApiService.Scopes.getAvailableFeatures()
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
      
      await ApiService.Scopes.requestFeatureAccess([featureKey])
      
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <Typography variant="small" className="ml-2 text-muted-foreground">Loading Google integration settings...</Typography>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-destructive/30 bg-destructive/10 p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-destructive mr-2" />
          <Typography variant="small" className="text-destructive">{error}</Typography>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadScopeData}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  if (!userScopes || !availableFeatures) {
    return (
      <div className={`rounded-lg border border-border bg-muted/50 p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-muted-foreground mr-2" />
          <Typography variant="small" className="text-muted-foreground">No Google integration data available</Typography>
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
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2 ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                <div className={isActive ? '[&_img]:brightness-110' : '[&_img]:opacity-60'}>
                  {getFeatureIcon(featureKey)}
                </div>
              </div>
              <div>
                <Typography variant="small" className="font-medium text-foreground">{feature.name}</Typography>
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
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
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
