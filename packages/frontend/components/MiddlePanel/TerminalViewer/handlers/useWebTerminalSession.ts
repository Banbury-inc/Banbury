import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { createTerminalSession, closeTerminalSession, ensureTerminalSocketServer } from './webTerminalApi'

type TerminalStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed'

interface UseWebTerminalSessionOptions {
  isActive: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  cwd?: string
}

interface UseWebTerminalSessionResult {
  status: TerminalStatus
  errorMessage: string | null
  reconnect: () => void
}

interface SessionState {
  sessionId: string
  sessionToken: string
}

function createTerminalTheme() {
  return {
    background: '#09090b',
    foreground: '#e4e4e7',
    cursor: '#e4e4e7',
    selectionBackground: '#27272a',
  }
}

export function useWebTerminalSession({
  isActive,
  containerRef,
  cwd,
}: UseWebTerminalSessionOptions): UseWebTerminalSessionResult {
  const [status, setStatus] = useState<TerminalStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const sessionRef = useRef<SessionState | null>(null)

  const reconnect = useCallback(() => {
    setConnectionAttempt((prev) => prev + 1)
  }, [])

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    let cancelled = false
    let authToken = ''

    async function initializeTerminal() {
      try {
        setStatus('connecting')
        setErrorMessage(null)

        authToken = localStorage.getItem('authToken') || ''
        if (!authToken) throw new Error('You need to sign in before opening a terminal.')

        await ensureTerminalSocketServer()
        const session = await createTerminalSession({ authToken, cwd })
        if (cancelled) return
        sessionRef.current = {
          sessionId: session.sessionId,
          sessionToken: session.sessionToken,
        }

        const xterm = new Terminal({
          cursorBlink: true,
          allowProposedApi: true,
          fontSize: 13,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          theme: createTerminalTheme(),
        })
        const fitAddon = new FitAddon()
        xterm.loadAddon(fitAddon)
        xterm.open(containerRef.current!)
        fitAddon.fit()

        xtermRef.current = xterm
        fitAddonRef.current = fitAddon

        const socket = io({
          path: '/api/terminal/socket',
          transports: ['websocket'],
        })
        socketRef.current = socket

        xterm.onData((data) => {
          const currentSession = sessionRef.current
          if (!currentSession) return
          socket.emit('terminal:input', {
            sessionId: currentSession.sessionId,
            data,
          })
        })

        socket.on('terminal:ready', () => {
          if (cancelled) return
          setStatus('connected')
        })

        socket.on('terminal:data', (payload: { data: string }) => {
          xterm.write(payload.data || '')
        })

        socket.on('terminal:exit', (payload: { exitCode: number }) => {
          xterm.writeln(`\r\n\x1b[33m[Process exited with code ${payload.exitCode}]\x1b[0m`)
          setStatus('closed')
        })

        socket.on('terminal:error', (payload: { message?: string }) => {
          const message = payload.message || 'Terminal connection failed'
          xterm.writeln(`\r\n\x1b[31m${message}\x1b[0m`)
          setErrorMessage(message)
          setStatus('error')
        })

        socket.on('connect', () => {
          const currentSession = sessionRef.current
          if (!currentSession) return
          socket.emit('terminal:join', {
            sessionId: currentSession.sessionId,
            sessionToken: currentSession.sessionToken,
            authToken,
          })
        })

        const sendResize = () => {
          const currentSession = sessionRef.current
          if (!currentSession || !fitAddonRef.current) return
          fitAddonRef.current.fit()
          const dimensions = fitAddonRef.current.proposeDimensions()
          if (!dimensions) return
          socket.emit('terminal:resize', {
            sessionId: currentSession.sessionId,
            cols: dimensions.cols,
            rows: dimensions.rows,
          })
        }

        resizeObserverRef.current = new ResizeObserver(sendResize)
        resizeObserverRef.current.observe(containerRef.current!)
        sendResize()
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Unable to initialize terminal'
        setErrorMessage(message)
        setStatus('error')
      }
    }

    initializeTerminal()

    return () => {
      cancelled = true
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null

      const currentSession = sessionRef.current
      if (currentSession) {
        const sessionId = currentSession.sessionId
        socketRef.current?.emit('terminal:close', { sessionId })
        if (authToken) {
          closeTerminalSession({
            authToken,
            sessionId,
            sessionToken: currentSession.sessionToken,
          }).catch(() => {})
        }
      }

      sessionRef.current = null
      socketRef.current?.disconnect()
      socketRef.current = null
      xtermRef.current?.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [isActive, containerRef, cwd, connectionAttempt])

  return {
    status,
    errorMessage,
    reconnect,
  }
}
