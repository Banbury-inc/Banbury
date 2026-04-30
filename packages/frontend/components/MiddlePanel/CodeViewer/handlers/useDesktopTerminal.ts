import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

declare global {
  interface Window {
    desktopApp?: {
      terminal?: {
        start: (sessionId: string, cwd?: string) => Promise<{ success: boolean; error?: string }>
        write: (sessionId: string, data: string) => void
        resize: (sessionId: string, cols: number, rows: number) => void
        close: (sessionId: string) => void
        onData: (callback: (sessionId: string, data: string) => void) => () => void
        onExit: (callback: (sessionId: string, exitCode: number) => void) => () => void
      }
    }
  }
}

export function isDesktopTerminalAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.desktopApp?.terminal
}

interface UseDesktopTerminalOptions {
  sessionId: string
  containerRef: React.RefObject<HTMLDivElement | null>
  isOpen: boolean
  cwd?: string
}

export function useDesktopTerminal({
  sessionId,
  containerRef,
  isOpen,
  cwd,
}: UseDesktopTerminalOptions) {
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const cleanupDataRef = useRef<(() => void) | null>(null)
  const cleanupExitRef = useRef<(() => void) | null>(null)
  const startedRef = useRef(false)
  const readyRef = useRef(false)
  const pendingWritesRef = useRef<string[]>([])

  const fitTerminal = useCallback(() => {
    if (!fitAddonRef.current || !terminalRef.current) return
    try {
      fitAddonRef.current.fit()
      const dims = fitAddonRef.current.proposeDimensions()
      if (dims && window.desktopApp?.terminal) {
        window.desktopApp.terminal.resize(sessionId, dims.cols, dims.rows)
      }
    } catch {
      // fit may fail if container is not yet visible
    }
  }, [sessionId])

  const writeToTerminal = useCallback((data: string) => {
    if (!window.desktopApp?.terminal) return
    if (!readyRef.current) {
      pendingWritesRef.current.push(data)
      return
    }

    window.desktopApp.terminal.write(sessionId, data)
  }, [sessionId])

  useEffect(() => {
    if (!isOpen || !containerRef.current || startedRef.current) return
    if (!isDesktopTerminalAvailable()) return

    startedRef.current = true
    readyRef.current = false

    const xterm = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      // Theme aligned with zinc palette for consistency with app UI
      theme: {
        background: '#18181b',
        foreground: '#d4d4d8',
        cursor: '#a1a1aa',
        selectionBackground: '#3f3f46',
        black: '#18181b',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#34d399',
        white: '#d4d4d8',
        brightBlack: '#52525b',
        brightRed: '#fca5a5',
        brightGreen: '#86efac',
        brightYellow: '#fde047',
        brightBlue: '#93c5fd',
        brightMagenta: '#d8b4fe',
        brightCyan: '#6ee7b7',
        brightWhite: '#f4f4f5',
      },
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.open(containerRef.current)
    fitAddonRef.current = fitAddon
    terminalRef.current = xterm

    // Small delay to allow DOM to settle before fitting
    const fitTimer = setTimeout(() => {
      fitAddon.fit()
    }, 50)

    // Forward user keystrokes to PTY
    xterm.onData((data) => {
      writeToTerminal(data)
    })

    // Listen for PTY output
    const unsubData = window.desktopApp!.terminal!.onData((sid, data) => {
      if (sid === sessionId) {
        xterm.write(data)
      }
    })
    cleanupDataRef.current = unsubData

    // Listen for PTY exit
    const unsubExit = window.desktopApp!.terminal!.onExit((sid, exitCode) => {
      if (sid === sessionId) {
        xterm.writeln(`\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m`)
      }
    })
    cleanupExitRef.current = unsubExit

    // Start the PTY session
    window.desktopApp!.terminal!.start(sessionId, cwd).then((result) => {
      if (!result.success) {
        xterm.writeln(`\r\n\x1b[31mFailed to start terminal: ${result.error ?? 'unknown error'}\x1b[0m`)
        return
      }

      readyRef.current = true
      for (const pendingWrite of pendingWritesRef.current) {
        window.desktopApp?.terminal?.write(sessionId, pendingWrite)
      }
      pendingWritesRef.current = []
    })

    // Resize observer to auto-fit on container resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
      const dims = fitAddon.proposeDimensions()
      if (dims && window.desktopApp?.terminal) {
        window.desktopApp.terminal.resize(sessionId, dims.cols, dims.rows)
      }
    })
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(fitTimer)
      resizeObserver.disconnect()
      cleanupDataRef.current?.()
      cleanupExitRef.current?.()
      window.desktopApp?.terminal?.close(sessionId)
      xterm.dispose()
      pendingWritesRef.current = []
      readyRef.current = false
      terminalRef.current = null
      fitAddonRef.current = null
      startedRef.current = false
    }
  }, [isOpen, sessionId, cwd, containerRef, writeToTerminal])

  return { fitTerminal, writeToTerminal }
}
