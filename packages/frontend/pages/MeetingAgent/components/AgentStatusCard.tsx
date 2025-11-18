import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Progress } from '../../../components/ui/progress'
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react'
import { MeetingAgentStatus } from '../../../types/meeting-types'

interface AgentStatusCardProps {
  status: MeetingAgentStatus | null
  onRefresh?: () => void
}

export function AgentStatusCard({ status, onRefresh }: AgentStatusCardProps) {
  // Handle null status
  if (!status) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading agent status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (status.systemHealth) {
      case 'healthy':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          badge: <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>,
          description: 'All systems operational'
        }
      case 'degraded':
        return {
          icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
          badge: <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Degraded</Badge>,
          description: 'Some features may be limited'
        }
      case 'offline':
        return {
          icon: <XCircle className="h-5 w-5 text-red-500" />,
          badge: <Badge variant="destructive">Offline</Badge>,
          description: 'Agent is not available'
        }
      default:
        return {
          icon: <Activity className="h-5 w-5 text-gray-500" />,
          badge: <Badge variant="outline">Unknown</Badge>,
          description: 'Status unknown'
        }
    }
  }

  const statusDisplay = getStatusDisplay()
  const isOnline = status.isOnline

  // Format last activity time
  const getLastActivityText = () => {
    if (!status.lastActivity) return 'Never'
    
    const now = new Date()
    const lastActivity = new Date(status.lastActivity)
    const diffMs = now.getTime() - lastActivity.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  // Format recording time
  const formatRecordingTime = () => {
    const totalMinutes = Math.floor(status.totalRecordingTime / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusDisplay.icon}
            <div>
              <CardTitle className="text-xl">Meeting Agent Status</CardTitle>
              <CardDescription>{statusDisplay.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusDisplay.badge}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="font-medium">Connection</span>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {status.activeConnections}
            </div>
            <div className="text-sm text-muted-foreground">
              Active Sessions
            </div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {status.totalMeetingsToday}
            </div>
            <div className="text-sm text-muted-foreground">
              Today&apos;s Meetings
            </div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {formatRecordingTime()}
            </div>
            <div className="text-sm text-muted-foreground">
              Recording Time
            </div>
          </div>

          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium text-orange-600">
              {getLastActivityText()}
            </div>
            <div className="text-sm text-muted-foreground">
              Last Activity
            </div>
          </div>
        </div>

        {/* System Health Details */}
        {status.systemHealth === 'degraded' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">System Degraded</span>
            </div>
            <p className="text-sm text-yellow-700">
              Some meeting platforms may experience connectivity issues. 
              Recording and transcription services are still available.
            </p>
          </div>
        )}

        {status.systemHealth === 'offline' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-800">System Offline</span>
            </div>
            <p className="text-sm text-red-700">
              The meeting agent is currently offline. Please check your connection 
              and try again later.
            </p>
          </div>
        )}

        {/* Active Sessions Progress */}
        {status.activeConnections > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Active Sessions</span>
              <span>{status.activeConnections} / 10</span>
            </div>
            <Progress value={(status.activeConnections / 10) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Maximum concurrent sessions: 10
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            View Logs
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Test Connection
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Restart Agent
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
