import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CONFIG } from '../../../../config/config'

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
  sendInput: (data: string) => boolean
  isReady: boolean
}

function createTerminalTheme() {
  return {
    background: '#09090b',
    foreground: '#e4e4e7',
    cursor: '#e4e4e7',
    selectionBackground: '#27272a',
  }
}

function buildTerminalWsUrl(): string {
  const sessionId = crypto.randomUUID()
  const base = CONFIG.wsBaseUrl
  return `${base}/ws/terminal/${sessionId}/`
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
  const wsRef = useRef<WebSocket | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const isReadyRef = useRef(false)

  const reconnect = useCallback(() => {
    setConnectionAttempt((prev) => prev + 1)
  }, [])

  const sendInput = useCallback((data: string): boolean => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN || !isReadyRef.current) return false
    ws.send(JSON.stringify({ type: 'input', data }))
    return true
  }, [])

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    let cancelled = false

    function initializeTerminal() {
      try {
        setStatus('connecting')
        setErrorMessage(null)

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

        const wsUrl = buildTerminalWsUrl()
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (cancelled) return
          ws.send(JSON.stringify({ type: 'start', cwd }))
        }

        ws.onmessage = (event) => {
          if (cancelled) return
          let payload: { type: string; data?: string; exitCode?: number }
          try { payload = JSON.parse(event.data) } catch { return }

          if (payload.type === 'ready') {
            setStatus('connected')
            isReadyRef.current = true
            sendResize()
          } else if (payload.type === 'data') {
            xterm.write(payload.data || '')
          } else if (payload.type === 'exit') {
            xterm.writeln(`\r\n\x1b[33m[Process exited with code ${payload.exitCode ?? 0}]\x1b[0m`)
            setStatus('closed')
            isReadyRef.current = false
          }
        }

        ws.onerror = () => {
          if (cancelled) return
          setErrorMessage('Terminal WebSocket connection failed.')
          setStatus('error')
          isReadyRef.current = false
        }

        ws.onclose = () => {
          if (cancelled) return
          if (status !== 'error') setStatus('closed')
          isReadyRef.current = false
        }

        xterm.onData((data) => {
          sendInput(data)
        })

        const sendResize = () => {
          if (!fitAddonRef.current || !wsRef.current) return
          fitAddonRef.current.fit()
          const dims = fitAddonRef.current.proposeDimensions()
          if (!dims) return
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'resize', cols: dims.cols, rows: dims.rows }))
          }
        }

        resizeObserverRef.current = new ResizeObserver(sendResize)
        resizeObserverRef.current.observe(containerRef.current!)
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
      isReadyRef.current = false
      resizeObserverRef.current?.disconnect()
      resizeObserverRef.current = null

      wsRef.current?.close()
      wsRef.current = null
      xtermRef.current?.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [isActive, containerRef, cwd, connectionAttempt, sendInput])

  return {
    status,
    errorMessage,
    reconnect,
    sendInput,
    isReady: status === 'connected',
  }
}
