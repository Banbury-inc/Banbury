import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { RefreshCw, Calendar } from 'lucide-react'
import { JourneyFlowDiagram } from '../../components/AdminContent/components/JourneyFlowDiagram'
import type { JourneyAnalytics } from '../../components/AdminContent/types/adminTypes'

interface JourneysTabProps {
  journeyAnalytics: JourneyAnalytics | null
  journeyLoading: boolean
  journeyDays: number
  setJourneyDays: (days: number) => void
  journeyStartingEvent: string
  setJourneyStartingEvent: (event: string) => void
  loadJourneyAnalytics: (days: number, startingEvent: string) => void
}

export function JourneysTab({
  journeyAnalytics,
  journeyLoading,
  journeyDays,
  setJourneyDays,
  journeyStartingEvent,
  setJourneyStartingEvent,
  loadJourneyAnalytics
}: JourneysTabProps) {
  const [availableEvents, setAvailableEvents] = useState<string[]>([])

  useEffect(() => {
    // Load available starting events (common events from analytics)
    // For now, we'll use a predefined list, but this could be fetched from the API
    setAvailableEvents([
      'View Workspaces',
      'Log In',
      'Complete Trial',
      'Open File',
      'Create File',
      'Open Email',
      'Compose Email',
      'Open Calendar',
      'Create Task',
      'Join Meeting'
    ])
  }, [])

  const handleRefresh = () => {
    loadJourneyAnalytics(journeyDays, journeyStartingEvent)
  }

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      const secs = Math.round(seconds % 60)
      return `${minutes}m ${secs}s`
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours}h ${minutes}m`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Journeys</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore common user paths and navigation patterns
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          className="border-zinc-200 dark:border-white/[0.06]"
          disabled={journeyLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${journeyLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="days">Date Range (Days)</Label>
              <Input
                id="days"
                type="number"
                min="1"
                max="365"
                value={journeyDays}
                onChange={(e) => {
                  const days = parseInt(e.target.value) || 30
                  setJourneyDays(days)
                  loadJourneyAnalytics(days, journeyStartingEvent)
                }}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="starting-event">Starting Event</Label>
              <Select
                value={journeyStartingEvent || 'all'}
                onValueChange={(value) => {
                  const event = value === 'all' ? '' : value
                  setJourneyStartingEvent(event)
                  loadJourneyAnalytics(journeyDays, event)
                }}
              >
                <SelectTrigger id="starting-event" className="bg-background">
                  <SelectValue placeholder="Select starting event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {availableEvents.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      {journeyAnalytics && journeyAnalytics.result === 'success' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {journeyAnalytics.total_users.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm">Unique Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {journeyAnalytics.paths.length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground text-sm">Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {journeyAnalytics.period_days} days
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Flow Diagram */}
      {journeyLoading ? (
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading journey analytics...</p>
            </div>
          </CardContent>
        </Card>
      ) : journeyAnalytics && journeyAnalytics.result === 'success' && journeyAnalytics.paths.length > 0 ? (
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-foreground">
              User Journey Flow
              {journeyAnalytics.starting_event && (
                <span className="text-muted-foreground text-base font-normal ml-2">
                  (Starting from: {journeyAnalytics.starting_event})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JourneyFlowDiagram
              paths={journeyAnalytics.paths}
              startingEvent={journeyAnalytics.starting_event || 'All Events'}
            />
          </CardContent>
        </Card>
      ) : journeyAnalytics && journeyAnalytics.result === 'success' ? (
        <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No journey data found</p>
              <p className="text-muted-foreground text-sm mt-2">
                Try adjusting the date range or starting event filter
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
