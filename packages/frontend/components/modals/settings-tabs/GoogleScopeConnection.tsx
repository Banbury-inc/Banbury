import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '../../common/ui/button'
import { Typography } from '../../common/ui/typography'
import { ApiService } from '../../../../backend/api/apiService'
import type { UserScopes } from '../../../../backend/api/scopes/scopes'
import { ConnectionIconFrame } from './ConnectionIconFrame'

type GoogleFeatureKey = keyof UserScopes['available_features']

interface GoogleScopeConnectionProps {
  featureKey: GoogleFeatureKey
  name: string
  icon: ReactNode
  cachedIsAvailable?: boolean
  shouldLoadStatus?: boolean
  onStatusChange?: (isAvailable: boolean) => void
}

export function GoogleScopeConnection({
  featureKey,
  name,
  icon,
  cachedIsAvailable,
  shouldLoadStatus = true,
  onStatusChange,
}: GoogleScopeConnectionProps) {
  const [isAvailable, setIsAvailable] = useState(cachedIsAvailable ?? false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(shouldLoadStatus && cachedIsAvailable === undefined)
  const [isActivating, setIsActivating] = useState(false)

  useEffect(() => {
    if (cachedIsAvailable !== undefined) {
      setIsAvailable(cachedIsAvailable)
      setIsCheckingAccess(false)
      return
    }

    async function checkAccess() {
      try {
        setIsCheckingAccess(true)
        const isFeatureAvailable = await ApiService.Scopes.isFeatureAvailable(featureKey)
        setIsAvailable(isFeatureAvailable)
        onStatusChange?.(isFeatureAvailable)
      } catch (error) {
        console.error(`Error checking ${name} access:`, error)
        setIsAvailable(false)
        onStatusChange?.(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    if (shouldLoadStatus) void checkAccess()
  }, [cachedIsAvailable, featureKey, name, shouldLoadStatus])

  async function handleActivate() {
    try {
      setIsActivating(true)
      await ApiService.Scopes.requestFeatureAccess([featureKey])
    } catch (error) {
      console.error(`Error activating ${name}:`, error)
      setIsActivating(false)
    }
  }

  if (isCheckingAccess) {
    return (
      <div className="flex items-center">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
        <Typography variant="small" className="text-muted-foreground">
          Checking {name} access...
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <ConnectionIconFrame isActive={isAvailable}>{icon}</ConnectionIconFrame>
        <div>
          <Typography variant="small" className="font-medium text-foreground">
            {name}
          </Typography>
        </div>
      </div>

      {featureKey === 'profile' ? (
        <Button variant="outline" size="sm" disabled>
          Required
        </Button>
      ) : isAvailable ? (
        <Button variant="outline" size="sm" disabled>
          Connected
        </Button>
      ) : (
        <Button onClick={handleActivate} disabled={isActivating} size="sm">
          {isActivating ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
              Activating...
            </>
          ) : (
            'Connect'
          )}
        </Button>
      )}
    </div>
  )
}
