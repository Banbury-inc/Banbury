import { useState, useEffect, useCallback, useRef } from 'react'
import { CONFIG } from '../config/config'
import { TranscriptionSegment } from '../types/meeting-types'

interface LiveTranscriptionSegment {
  id: string
  speaker_id: string | number
  speaker_name: string
  text: string
  start_time: number
  end_time: number
  confidence: number
  is_final: boolean
  timestamp: string
}

interface UseLiveTranscriptionOptions {
  sessionId: string | null
  enabled?: boolean
  onSegment?: (segment: TranscriptionSegment) => void
  onError?: (error: string) => void
  onConnectionChange?: (connected: boolean) => void
}

interface UseLiveTranscriptionReturn {
  segments: TranscriptionSegment[]
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnect: () => void
  clearSegments: () => void
}

function getTranscriptionWsUrl(sessionId: string): string {
  // Build WebSocket URL for transcription based on CONFIG
  let baseWsUrl: string
  
  if (CONFIG.prod) {
    baseWsUrl = 'wss://api.dev.banbury.io'
  } else if (CONFIG.dev) {
    baseWsUrl = 'wss://www.api.dev.banbury.io'
  } else if (CONFIG.semi_local) {
    baseWsUrl = 'ws://10.123.1.90:8082'
  } else {
    baseWsUrl = 'ws://localhost:8082'
  }
  
  return `${baseWsUrl}/ws/transcription/${sessionId}/`
}

export function useLiveTranscription({
  sessionId,
  enabled = true,
  onSegment,
  onError,
  onConnectionChange
}: UseLiveTranscriptionOptions): UseLiveTranscriptionReturn {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Convert backend segment format to frontend TranscriptionSegment
  const convertSegment = useCallback((segment: LiveTranscriptionSegment): TranscriptionSegment => {
    return {
      id: segment.id || `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      speakerId: String(segment.speaker_id || 0),
      speakerName: segment.speaker_name || 'Speaker',
      text: segment.text || '',
      startTime: segment.start_time || 0,
      endTime: segment.end_time || 0,
      confidence: segment.confidence || 1.0
    }
  }, [])
  
  const connect = useCallback(() => {
    if (!sessionId || !enabled) return
    
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnecting(true)
    setError(null)
    
    try {
      const wsUrl = getTranscriptionWsUrl(sessionId)
      console.log('[useLiveTranscription] Connecting to:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('[useLiveTranscription] WebSocket connected')
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        onConnectionChange?.(true)
        
        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
          }
        }, 30000)
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[useLiveTranscription] Received message:', data)
          
          if (data.type === 'transcription_segment') {
            const segment = convertSegment(data.segment)
            
            setSegments(prev => {
              // Check if segment already exists (by id or approximate time/text match)
              const exists = prev.some(s => 
                s.id === segment.id || 
                (Math.abs(s.startTime - segment.startTime) < 0.5 && s.text === segment.text)
              )
              
              if (exists) {
                // Update existing segment if it's a final version
                return prev.map(s => 
                  s.id === segment.id ? segment : s
                )
              }
              
              return [...prev, segment]
            })
            
            onSegment?.(segment)
          } else if (data.type === 'existing_segments') {
            // Load existing segments on connection
            const existingSegments = (data.segments || []).map(convertSegment)
            setSegments(existingSegments)
          } else if (data.type === 'recording_status') {
            console.log('[useLiveTranscription] Recording status:', data.status)
            // Could emit this to parent if needed
          } else if (data.type === 'connection_established') {
            console.log('[useLiveTranscription] Connection established for session:', data.session_id)
          } else if (data.type === 'pong') {
            // Heartbeat response, connection is alive
          }
        } catch (err) {
          console.error('[useLiveTranscription] Error parsing message:', err)
        }
      }
      
      ws.onerror = (event) => {
        console.error('[useLiveTranscription] WebSocket error:', event)
        setError('WebSocket connection error')
        onError?.('WebSocket connection error')
      }
      
      ws.onclose = (event) => {
        console.log('[useLiveTranscription] WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        onConnectionChange?.(false)
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        // Attempt reconnection if not a normal close and still enabled
        if (enabled && event.code !== 1000 && event.code !== 1001) {
          console.log('[useLiveTranscription] Scheduling reconnection...')
          reconnectTimeoutRef.current = setTimeout(() => {
            if (enabled && sessionId) {
              connect()
            }
          }, 3000)
        }
      }
    } catch (err) {
      console.error('[useLiveTranscription] Error creating WebSocket:', err)
      setIsConnecting(false)
      setError('Failed to create WebSocket connection')
      onError?.('Failed to create WebSocket connection')
    }
  }, [sessionId, enabled, convertSegment, onSegment, onError, onConnectionChange])
  
  const disconnect = useCallback(() => {
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
      pingIntervalRef.current = null
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
  }, [])
  
  const reconnect = useCallback(() => {
    disconnect()
    connect()
  }, [disconnect, connect])
  
  const clearSegments = useCallback(() => {
    setSegments([])
  }, [])
  
  // Connect when sessionId changes or enabled changes
  useEffect(() => {
    if (sessionId && enabled) {
      connect()
    } else {
      disconnect()
    }
    
    return () => {
      disconnect()
    }
  }, [sessionId, enabled, connect, disconnect])
  
  return {
    segments,
    isConnected,
    isConnecting,
    error,
    reconnect,
    clearSegments
  }
}

export type { LiveTranscriptionSegment, UseLiveTranscriptionOptions, UseLiveTranscriptionReturn }
