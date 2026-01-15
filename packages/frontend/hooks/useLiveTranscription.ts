import { useState, useEffect, useCallback, useRef } from 'react'
import { CONFIG } from '../config/config'
import { TranscriptionSegment } from '../types/meeting-types'
import { ApiService } from '../../backend/api/apiService'

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
  isPolling: boolean
  error: string | null
  reconnect: () => void
  clearSegments: () => void
}

function getTranscriptionWsUrl(sessionId: string, useSecure: boolean = true): string {
  // Build WebSocket URL for transcription
  // Try secure (wss) first, then fall back to non-secure (ws) if needed
  let baseUrl: string
  
  if (CONFIG.prod) {
    baseUrl = useSecure ? 'wss://api.dev.banbury.io' : 'ws://api.dev.banbury.io'
  } else if (CONFIG.dev) {
    baseUrl = useSecure ? 'wss://www.api.dev.banbury.io' : 'ws://www.api.dev.banbury.io'
  } else if (CONFIG.semi_local) {
    baseUrl = 'ws://10.123.1.90:8082'
  } else {
    baseUrl = 'ws://localhost:8082'
  }
  
  const wsUrl = `${baseUrl}/ws/transcription/${sessionId}/`
  
  return wsUrl
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
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const useSecureProtocolRef = useRef(true) // Start with wss://, fall back to ws:// if needed
  const usePollingRef = useRef(false) // Fall back to HTTP polling if WebSocket fails
  const lastSegmentCountRef = useRef(0) // Track segments to detect new ones during polling
  const maxReconnectAttempts = 5
  const pollingIntervalMs = 3000 // Poll every 3 seconds for faster updates
  
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
  
  // HTTP polling fallback for when WebSocket is unavailable
  const pollTranscription = useCallback(async () => {
    if (!sessionId) return
    
    try {
      const result = await ApiService.MeetingAgent.getTranscription(sessionId)
      
      if (result.segments && result.segments.length > 0) {
        // Check if we have new segments
        if (result.segments.length > lastSegmentCountRef.current) {
          // Notify about new segments
          const newSegments = result.segments.slice(lastSegmentCountRef.current)
          newSegments.forEach((segment: TranscriptionSegment) => {
            onSegment?.(segment)
          })
          
          lastSegmentCountRef.current = result.segments.length
        }
        
        setSegments(result.segments)
      }
    } catch (err) {
      console.error('[useLiveTranscription] Polling error:', err)
      // Don't set error state for polling failures, just log them
    }
  }, [sessionId, onSegment])
  
  // Start HTTP polling as fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return // Already polling
    
    usePollingRef.current = true
    setIsPolling(true)
    setIsConnected(true) // Consider polling as "connected"
    setError(null) // Clear error since we have a fallback
    onConnectionChange?.(true)
    
    // Initial poll
    pollTranscription()
    
    // Set up polling interval
    pollingIntervalRef.current = setInterval(pollTranscription, pollingIntervalMs)
  }, [pollTranscription, onConnectionChange])
  
  // Stop HTTP polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    usePollingRef.current = false
    setIsPolling(false)
    lastSegmentCountRef.current = 0
  }, [])
  
  const connect = useCallback(() => {
    if (!sessionId || !enabled) {
      return
    }
    
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnecting(true)
    setError(null)
    
    try {
      const wsUrl = getTranscriptionWsUrl(sessionId, useSecureProtocolRef.current)
      
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0 // Reset reconnect attempts on successful connection
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
            // Could emit this to parent if needed
          } else if (data.type === 'connection_established') {
            // Connection established
          } else if (data.type === 'pong') {
            // Heartbeat response, connection is alive
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[useLiveTranscription] Error parsing message:', err)
        }
      }
      
      ws.onerror = (event) => {
        // eslint-disable-next-line no-console
        console.error('[useLiveTranscription] WebSocket error:', event)
        const errorMsg = `WebSocket connection error (readyState: ${ws.readyState})`
        setError(errorMsg)
        onError?.(errorMsg)
      }
      
      ws.onclose = (event) => {
        const closeReasonMap: Record<number, string> = {
          1000: 'Normal closure',
          1001: 'Going away',
          1002: 'Protocol error',
          1003: 'Unsupported data',
          1006: 'Abnormal closure (connection failed or server unavailable)',
          1007: 'Invalid frame payload data',
          1008: 'Policy violation',
          1009: 'Message too big',
          1011: 'Unexpected condition',
          1015: 'TLS handshake failure'
        }
        const closeReason = closeReasonMap[event.code] || `Unknown close code: ${event.code}`
        
        setIsConnected(false)
        setIsConnecting(false)
        onConnectionChange?.(false)
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
          pingIntervalRef.current = null
        }
        
        // Attempt reconnection if not a normal close and still enabled
        // Limit reconnection attempts to avoid infinite loops
        if (enabled && event.code !== 1000 && event.code !== 1001) {
          reconnectAttemptsRef.current += 1
          
          // After 2 failed attempts with secure protocol, try non-secure
          // This handles cases where the server doesn't have WSS configured
          if (reconnectAttemptsRef.current === 2 && useSecureProtocolRef.current) {
            useSecureProtocolRef.current = false
            reconnectAttemptsRef.current = 0 // Reset attempts for the new protocol
          }
          
          if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
            const delay = Math.min(2000 * (reconnectAttemptsRef.current + 1), 15000) // Faster retry, max 15s
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (enabled && sessionId) {
                connect()
              }
            }, delay)
          } else {
            // eslint-disable-next-line no-console
            console.warn(`[useLiveTranscription] Max WebSocket reconnection attempts (${maxReconnectAttempts}) reached. Connection failed.`)
            const errorMsg = 'Failed to connect to live transcription after multiple attempts'
            setError(errorMsg)
            onError?.(errorMsg)
          }
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
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
    
    // Stop polling
    stopPolling()
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting')
      wsRef.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
  }, [stopPolling])
  
  const reconnect = useCallback(() => {
    stopPolling()
    lastSegmentCountRef.current = 0
    reconnectAttemptsRef.current = 0
    useSecureProtocolRef.current = true
    // Try WebSocket connection
    connect()
  }, [stopPolling, connect])
  
  const clearSegments = useCallback(() => {
    setSegments([])
  }, [])
  
  // Connect when sessionId changes or enabled changes
  useEffect(() => {
    // Reset reconnection attempts, protocol, and polling state when session changes
    reconnectAttemptsRef.current = 0
    useSecureProtocolRef.current = true // Start with secure protocol for new sessions
    usePollingRef.current = false
    lastSegmentCountRef.current = 0
    
    if (sessionId && enabled) {
      // Try WebSocket connection first
      connect()
    } else {
      disconnect()
    }
    
    return () => {
      disconnect()
    }
  }, [sessionId, enabled, disconnect, connect])
  
  return {
    segments,
    isConnected,
    isConnecting,
    isPolling,
    error,
    reconnect,
    clearSegments
  }
}

export type { LiveTranscriptionSegment, UseLiveTranscriptionOptions, UseLiveTranscriptionReturn }
