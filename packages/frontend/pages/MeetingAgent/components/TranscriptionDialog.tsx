import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { 
  Download, 
  Copy, 
  User, 
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { MeetingSession } from '../../../types/meeting-types'
import { ApiService } from '../../../../backend/api/apiService'
import { useToast } from '../../../components/ui/use-toast'

interface TranscriptionSegment {
  id: string
  speaker_name: string
  text: string
  start_time: number
  end_time: number
  confidence: number
}

interface TranscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: MeetingSession
}

// Parse various transcript formats from Recall AI
function parseRawTranscript(rawTranscript: any): { segments: TranscriptionSegment[], fullText: string } {
  const segments: TranscriptionSegment[] = []
  let fullText = ''

  try {
    // Helper to convert time values to float
    const toFloat = (val: any, defaultVal: number = 0): number => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        if (val.endsWith('s') && !isNaN(parseFloat(val.slice(0, -1)))) {
          return parseFloat(val.slice(0, -1))
        }
        const parts = val.split(':')
        if (parts.length === 3) {
          return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2])
        }
        if (parts.length === 2) {
          return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
        }
        const parsed = parseFloat(val)
        if (!isNaN(parsed)) return parsed
      }
      return defaultVal
    }

    // Strategy 1: Direct segments array
    if (rawTranscript.segments && Array.isArray(rawTranscript.segments)) {
      rawTranscript.segments.forEach((segment: any, idx: number) => {
        const text = segment.text || (segment.words && Array.isArray(segment.words) 
          ? segment.words.map((w: any) => w.text || w.word || '').join(' ') 
          : '')
        
        if (text.trim()) {
          const speakerName = segment.speaker || segment.speaker_name || segment.speaker_label || segment.spk || 'Unknown Speaker'
          const startTime = toFloat(segment.start ?? segment.start_time, idx * 5)
          const endTime = toFloat(segment.end ?? segment.end_time, startTime + 5)
          
          segments.push({
            id: `seg_${Math.floor(startTime * 1000)}`,
            speakerId: speakerName,
            speakerName,
            text: text.trim(),
            startTime,
            endTime,
            confidence: segment.confidence || 0
          })
          
          fullText += `${speakerName}: ${text.trim()}\n`
        }
      })
    }

    // Strategy 2: Results with alternatives
    if (segments.length === 0 && rawTranscript.results && Array.isArray(rawTranscript.results)) {
      rawTranscript.results.forEach((result: any, idx: number) => {
        const alt = result.alternatives?.[0]
        const text = alt?.transcript || ''
        
        if (text.trim()) {
          const speakerName = result.speaker || 'Unknown Speaker'
          const timestamps = alt?.timestamps
          const startTime = timestamps?.[0]?.[1] ? toFloat(timestamps[0][1]) : idx * 5
          const endTime = timestamps?.[timestamps.length - 1]?.[2] ? toFloat(timestamps[timestamps.length - 1][2]) : startTime + 5
          
          segments.push({
            id: `seg_${Math.floor(startTime * 1000)}`,
            speakerId: speakerName,
            speakerName,
            text: text.trim(),
            startTime,
            endTime,
            confidence: 0
          })
          
          fullText += `${speakerName}: ${text.trim()}\n`
        }
      })
    }

    // Strategy 3: Direct array with participant + words structure
    if (segments.length === 0 && Array.isArray(rawTranscript)) {
      rawTranscript.forEach((utterance: any) => {
        if (utterance.participant && utterance.words && Array.isArray(utterance.words)) {
          const speakerName = utterance.participant.name || 'Unknown Speaker'
          const words = utterance.words
          
          if (words.length > 0) {
            // Join all words to form the utterance text
            const text = words.map((w: any) => w.text || '').join(' ')
            
            // Get start time from first word and end time from last word
            const startTime = words[0].start_timestamp?.relative || 0
            const endTime = words[words.length - 1].end_timestamp?.relative || startTime + 1
            
            segments.push({
              id: `seg_${Math.floor(startTime * 1000)}`,
              speakerId: utterance.participant.id?.toString() || speakerName,
              speakerName,
              text: text.trim(),
              startTime,
              endTime,
              confidence: 1.0
            })
            
            fullText += `${speakerName}: ${text.trim()}\n`
          }
        }
      })
    }

    // Strategy 4: Look for any object with array properties containing text content
    if (segments.length === 0 && typeof rawTranscript === 'object' && !Array.isArray(rawTranscript)) {
      const arrays = ['utterances', 'paragraphs', 'entries', 'items', 'data', 'diarization', 'diarized', 'diarized_segments', 'speaker_segments', 'blocks']
      
      for (const key of arrays) {
        if (rawTranscript[key] && Array.isArray(rawTranscript[key])) {
          rawTranscript[key].forEach((item: any, idx: number) => {
            const text = item.text || item.transcript || ''
            
            if (text.trim()) {
              const speakerName = item.speaker || item.speaker_name || item.speaker_label || item.spk || 'Unknown Speaker'
              const startTime = toFloat(item.start ?? item.start_time, idx * 5)
              const endTime = toFloat(item.end ?? item.end_time, startTime + 5)
              
              segments.push({
                id: `seg_${Math.floor(startTime * 1000)}`,
                speakerId: speakerName,
                speakerName,
                text: text.trim(),
                startTime,
                endTime,
                confidence: item.confidence || 0
              })
              
              fullText += `${speakerName}: ${text.trim()}\n`
            }
          })
          
          if (segments.length > 0) break
        }
      }
    }

    // Sort segments by start time
    segments.sort((a, b) => a.startTime - b.startTime)
    
  } catch (e) {
    console.error('Error parsing transcript:', e)
  }

  return { segments, fullText }
}

// Helper function to format timestamps
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function TranscriptionDialog({ open, onOpenChange, session }: TranscriptionDialogProps) {
  const [transcription, setTranscription] = useState<TranscriptionSegment[]>([])
  const [fullText, setFullText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && session.id) {
      loadTranscription()
    }
  }, [open, session.id])

  const loadTranscription = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await ApiService.MeetingAgent.getTranscription(session.id)

      // Extract session info if available
      const sessionData = (result as any).session_info || (result as any).sessionInfo
      if (sessionData) {
        setSessionInfo(sessionData)
      }

      // Use pre-parsed segments from backend
      const segments = (result as any).segments || []
      const fullTextValue = (result as any).fullText || (result as any).full_text || ''

      if (segments && Array.isArray(segments) && segments.length > 0) {
        setTranscription(segments)
        setFullText(fullTextValue)
      } else {
        // Fallback: try to parse raw transcript if no segments available
        const rawTranscript = (result as any).raw_transcript || (result as any).rawTranscript
        if (rawTranscript) {
          const parsed = parseRawTranscript(rawTranscript)
          setTranscription(parsed.segments)
          setFullText(parsed.fullText)
        } else {
          setError('No transcription available for this meeting')
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transcription'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullText)
      toast({
        title: 'Copied',
        description: 'Transcription copied to clipboard'
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy transcription',
        variant: 'destructive'
      })
    }
  }

  const downloadTranscription = () => {
    const blob = new Blob([fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${session.title || 'meeting'}_transcription.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <User className="h-5 w-5" />
            Meeting Transcription
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {sessionInfo?.title || session.title || 'Untitled Meeting'} • {new Date(sessionInfo?.start_time || session.startTime).toLocaleString()}
            {sessionInfo?.participants && sessionInfo.participants.length > 0 && (
              <div className="mt-1 text-xs">
                Participants: {sessionInfo.participants.map((p: any) => p.name || p).join(', ')}
              </div>
            )}
            {sessionInfo?.duration && (
              <div className="text-xs">
                Duration: {Math.floor(sessionInfo.duration / 60)}m {sessionInfo.duration % 60}s
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={!fullText}
            className="text-white border-zinc-600"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTranscription}
            disabled={!fullText}
            className="text-white border-zinc-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {session.recallBot?.transcriptUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(session.recallBot!.transcriptUrl, '_blank')}
              className="text-white border-zinc-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Recall Transcript
            </Button>
          )}
        </div>

        <div className="flex-1 pr-4 max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <span className="ml-2 text-white">Loading transcription...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-400">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTranscription}
                  className="mt-4 text-white border-zinc-600"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !error && transcription.length === 0 && !fullText && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-zinc-400">
                <User className="h-8 w-8 mx-auto mb-2" />
                <p>No transcription segments available</p>
                <p className="text-sm text-zinc-500 mt-1">
                  The meeting may not have been transcribed or is still processing
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && transcription.length > 0 && (
            <div className="space-y-4">
              {transcription.map((segment, index) => (
                <div key={segment.id || index} className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimestamp(segment.startTime)} - {formatTimestamp(segment.endTime)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {segment.speakerName || 'Unknown Speaker'}
                    </Badge>
                    {segment.confidence && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          segment.confidence > 0.8 
                            ? 'border-green-500 text-green-400' 
                            : segment.confidence > 0.6 
                            ? 'border-yellow-500 text-yellow-400'
                            : 'border-red-500 text-red-400'
                        }`}
                      >
                        {Math.round(segment.confidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-white pl-4 border-l-2 border-zinc-700">
                    {segment.text}
                  </p>
                  {index < transcription.length - 1 && (
                    <hr className="border-zinc-700" />
                  )}
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && fullText && transcription.length === 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Meeting Transcription</h3>
              <div className="text-white whitespace-pre-wrap p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                {fullText}
              </div>
              {fullText.includes('available at:') && (
                <div className="text-sm text-zinc-400 italic">
                  💡 Tip: The transcript above contains a download link. We're working on displaying the formatted transcript directly.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
