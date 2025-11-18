import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { 
  Bot, 
  Play, 
  Square, 
  Clock, 
  Mic, 
  Video,
  FileText,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react'
import { RecallBot } from '../../../types/meeting-types'

interface RecallBotCardProps {
  bot: RecallBot
  onStop?: () => void
  onRefresh?: () => void
}

export function RecallBotCard({ bot, onStop, onRefresh }: RecallBotCardProps) {
  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'joining':
        return { 
          variant: 'outline' as const, 
          icon: <Activity className="h-4 w-4" />,
          color: 'text-yellow-400'
        }
      case 'active':
        return { 
          variant: 'default' as const, 
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-green-400'
        }
      case 'recording':
        return { 
          variant: 'destructive' as const, 
          icon: <Video className="h-4 w-4" />,
          color: 'text-red-400'
        }
      case 'leaving':
        return { 
          variant: 'outline' as const, 
          icon: <Activity className="h-4 w-4" />,
          color: 'text-orange-400'
        }
      case 'completed':
        return { 
          variant: 'secondary' as const, 
          icon: <CheckCircle className="h-4 w-4" />,
          color: 'text-blue-400'
        }
      case 'failed':
        return { 
          variant: 'destructive' as const, 
          icon: <AlertCircle className="h-4 w-4" />,
          color: 'text-red-400'
        }
      default:
        return { 
          variant: 'outline' as const, 
          icon: <Clock className="h-4 w-4" />,
          color: 'text-gray-400'
        }
    }
  }

  const statusInfo = getStatusInfo(bot.status)

  const formatDuration = (start: Date, end?: Date) => {
    const startTime = new Date(start)
    const endTime = end ? new Date(end) : new Date()
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60)
    return `${duration}m`
  }

  return (
    <Card className="bg-zinc-900 border-zinc-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-5 w-5 text-blue-400" />
            <div>
              <CardTitle className="text-white text-base">
                {bot.metadata.bot_name || 'Recall Bot'}
              </CardTitle>
              <CardDescription className="text-zinc-400 text-sm">
                Bot ID: {bot.id.slice(0, 12)}...
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            {statusInfo.icon}
            {bot.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bot Status Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recording Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-3 w-3 text-zinc-400" />
              <span className="text-zinc-300">Recording</span>
            </div>
            <Badge 
              variant={bot.recordingStatus === 'recording' ? 'destructive' : 'outline'} 
              className="text-xs"
            >
              {bot.recordingStatus}
            </Badge>
          </div>

          {/* Transcription Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-3 w-3 text-zinc-400" />
              <span className="text-zinc-300">Transcription</span>
            </div>
            <Badge 
              variant={bot.transcriptionStatus === 'completed' ? 'default' : 'outline'} 
              className="text-xs"
            >
              {bot.transcriptionStatus}
            </Badge>
          </div>
        </div>

        {/* Timing Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-zinc-400">Created:</span>
            <div className="text-white">{new Date(bot.createdAt).toLocaleTimeString()}</div>
          </div>
          {bot.joinedAt && (
            <div>
              <span className="text-zinc-400">Joined:</span>
              <div className="text-white">{new Date(bot.joinedAt).toLocaleTimeString()}</div>
            </div>
          )}
        </div>

        {/* Duration (if active) */}
        {bot.joinedAt && !bot.leftAt && (
          <div className="text-sm">
            <span className="text-zinc-400">Duration:</span>
            <span className="text-white ml-2">{formatDuration(bot.joinedAt)}</span>
          </div>
        )}

        {/* Recording Mode */}
        <div className="text-sm">
          <span className="text-zinc-400">Mode:</span>
          <Badge variant="outline" className="ml-2 text-xs">
            {bot.metadata.recording_mode.replace('_', ' ')}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {(bot.status === 'active' || bot.status === 'recording') && onStop && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={onStop}
              className="flex items-center gap-1"
            >
              <Square className="h-3 w-3" />
              Stop Bot
            </Button>
          )}
          
          {bot.videoUrl && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex items-center gap-1 text-white border-zinc-600"
              onClick={() => window.open(bot.videoUrl, '_blank')}
            >
              <Play className="h-3 w-3" />
              Video
            </Button>
          )}

          {bot.transcriptUrl && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex items-center gap-1 text-white border-zinc-600"
              onClick={() => window.open(bot.transcriptUrl, '_blank')}
            >
              <FileText className="h-3 w-3" />
              Transcript
            </Button>
          )}

          {onRefresh && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onRefresh}
              className="ml-auto text-white hover:bg-zinc-800"
            >
              <Activity className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Real-time status for active bots */}
        {(bot.status === 'recording' || bot.status === 'active') && (
          <div className="flex items-center gap-2 p-2 bg-blue-600/10 border border-blue-500/20 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-300">
              Live monitoring active
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
