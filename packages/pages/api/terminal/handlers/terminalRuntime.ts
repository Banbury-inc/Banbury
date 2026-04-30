import crypto from 'crypto'
import path from 'path'
import pty, { type IPty } from 'node-pty'

const MAX_SESSIONS_PER_USER = 3
const IDLE_TIMEOUT_MS = 15 * 60 * 1000
const CLEANUP_INTERVAL_MS = 60 * 1000
const DEFAULT_COLS = 120
const DEFAULT_ROWS = 30
const SESSION_TOKEN_BYTES = 24

export interface TerminalSessionSummary {
  id: string
  userId: string
  cwd: string
  shell: string
  createdAt: string
  expiresAt: string
}

export interface CreateTerminalSessionInput {
  userId: string
  cwd?: string
  shell?: string
  cols?: number
  rows?: number
}

export interface TerminalSessionAccess {
  sessionId: string
  sessionToken: string
  summary: TerminalSessionSummary
}

interface TerminalSessionInternal {
  id: string
  userId: string
  sessionToken: string
  cwd: string
  shell: string
  ptyProcess: IPty
  createdAtMs: number
  lastActiveAtMs: number
  cols: number
  rows: number
}

interface TerminalOutputEvent {
  type: 'data' | 'exit'
  sessionId: string
  payload: string | number
}

// eslint-disable-next-line no-unused-vars
type TerminalListener = (...args: [TerminalOutputEvent]) => void

class TerminalRuntime {
  private sessions = new Map<string, TerminalSessionInternal>()
  private listeners = new Map<string, Set<TerminalListener>>()
  private cleanupTimer: NodeJS.Timeout

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanupExpiredSessions(), CLEANUP_INTERVAL_MS)
  }

  dispose() {
    clearInterval(this.cleanupTimer)
    const allSessions = [...this.sessions.values()]
    allSessions.forEach((session) => this.forceCloseSession(session.id))
  }

  createSession(input: CreateTerminalSessionInput): TerminalSessionAccess {
    this.assertUserSessionCapacity(input.userId)

    const cwd = this.resolveSafeCwd(input.cwd)
    const shell = this.resolveSafeShell(input.shell)
    const cols = this.normalizeCols(input.cols)
    const rows = this.normalizeRows(input.rows)
    const sessionId = crypto.randomUUID()
    const sessionToken = crypto.randomBytes(SESSION_TOKEN_BYTES).toString('hex')
    const createdAtMs = Date.now()

    const ptyProcess = pty.spawn(shell, [], {
      cwd,
      cols,
      rows,
      name: 'xterm-color',
      env: this.getSafeEnv(),
    })

    const session: TerminalSessionInternal = {
      id: sessionId,
      userId: input.userId,
      sessionToken,
      cwd,
      shell,
      ptyProcess,
      createdAtMs,
      lastActiveAtMs: createdAtMs,
      cols,
      rows,
    }

    ptyProcess.onData((chunk) => this.emitOutput({ type: 'data', sessionId, payload: chunk }))
    ptyProcess.onExit(({ exitCode }) => {
      this.emitOutput({ type: 'exit', sessionId, payload: exitCode })
      this.forceCloseSession(sessionId)
    })

    this.sessions.set(sessionId, session)

    return {
      sessionId,
      sessionToken,
      summary: this.toSummary(session),
    }
  }

  subscribe(sessionId: string, listener: TerminalListener): () => void {
    const existing = this.listeners.get(sessionId)
    if (existing) {
      existing.add(listener)
    } else {
      this.listeners.set(sessionId, new Set([listener]))
    }

    return () => {
      const listeners = this.listeners.get(sessionId)
      if (!listeners) return
      listeners.delete(listener)
      if (listeners.size === 0) this.listeners.delete(sessionId)
    }
  }

  authorizeSession(sessionId: string, sessionToken: string, userId: string): TerminalSessionSummary {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Terminal session not found')
    if (session.sessionToken !== sessionToken) throw new Error('Invalid terminal session token')
    if (session.userId !== userId) throw new Error('Terminal session ownership mismatch')
    this.touchSession(session)
    return this.toSummary(session)
  }

  writeToSession(sessionId: string, userId: string, data: string) {
    const session = this.getOwnedSession(sessionId, userId)
    session.ptyProcess.write(data)
    this.touchSession(session)
  }

  resizeSession(sessionId: string, userId: string, cols: number, rows: number) {
    const session = this.getOwnedSession(sessionId, userId)
    const nextCols = this.normalizeCols(cols)
    const nextRows = this.normalizeRows(rows)
    session.ptyProcess.resize(nextCols, nextRows)
    session.cols = nextCols
    session.rows = nextRows
    this.touchSession(session)
  }

  closeSession(sessionId: string, userId: string) {
    const session = this.getOwnedSession(sessionId, userId)
    this.forceCloseSession(session.id)
  }

  private getOwnedSession(sessionId: string, userId: string): TerminalSessionInternal {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Terminal session not found')
    if (session.userId !== userId) throw new Error('Terminal session ownership mismatch')
    return session
  }

  private touchSession(session: TerminalSessionInternal) {
    session.lastActiveAtMs = Date.now()
  }

  private toSummary(session: TerminalSessionInternal): TerminalSessionSummary {
    return {
      id: session.id,
      userId: session.userId,
      cwd: session.cwd,
      shell: session.shell,
      createdAt: new Date(session.createdAtMs).toISOString(),
      expiresAt: new Date(session.lastActiveAtMs + IDLE_TIMEOUT_MS).toISOString(),
    }
  }

  private emitOutput(event: TerminalOutputEvent) {
    const listeners = this.listeners.get(event.sessionId)
    if (!listeners || listeners.size === 0) return
    listeners.forEach((listener) => listener(event))
  }

  private forceCloseSession(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      session.ptyProcess.kill()
    } catch {}

    this.sessions.delete(sessionId)
    this.listeners.delete(sessionId)
  }

  private cleanupExpiredSessions() {
    const cutoff = Date.now() - IDLE_TIMEOUT_MS
    const expiredSessionIds = [...this.sessions.values()]
      .filter((session) => session.lastActiveAtMs < cutoff)
      .map((session) => session.id)

    expiredSessionIds.forEach((sessionId) => this.forceCloseSession(sessionId))
  }

  private assertUserSessionCapacity(userId: string) {
    const currentCount = [...this.sessions.values()].filter((session) => session.userId === userId).length
    if (currentCount >= MAX_SESSIONS_PER_USER) {
      throw new Error(`Session limit reached (${MAX_SESSIONS_PER_USER}). Close an existing terminal and retry.`)
    }
  }

  private resolveSafeCwd(requestedCwd?: string): string {
    const workspaceRoot = process.cwd()
    if (!requestedCwd) return workspaceRoot

    const normalized = requestedCwd.trim()
    if (!normalized) return workspaceRoot

    const absolutePath = path.isAbsolute(normalized)
      ? path.resolve(normalized)
      : path.resolve(workspaceRoot, normalized)

    if (!absolutePath.startsWith(workspaceRoot)) return workspaceRoot
    return absolutePath
  }

  private resolveSafeShell(requestedShell?: string): string {
    if (!requestedShell) return this.getDefaultShell()
    const shellName = path.basename(requestedShell)
    const allowList = this.getAllowedShells()
    if (allowList.includes(shellName)) return requestedShell
    return this.getDefaultShell()
  }

  private getDefaultShell(): string {
    if (process.platform === 'win32') return 'powershell.exe'
    return process.env.SHELL || '/bin/bash'
  }

  private getAllowedShells(): string[] {
    if (process.platform === 'win32') return ['powershell.exe', 'cmd.exe']
    return ['bash', 'zsh', 'sh', 'fish']
  }

  private getSafeEnv(): Record<string, string> {
    const envAllowlist = [
      'HOME',
      'PATH',
      'LANG',
      'TERM',
      'TMPDIR',
      'SHELL',
      'USER',
      'USERNAME',
      'LOGNAME',
      'PWD',
    ]
    const safeEnv: Record<string, string> = {}
    envAllowlist.forEach((envKey) => {
      const value = process.env[envKey]
      if (value) safeEnv[envKey] = value
    })
    safeEnv.TERM = 'xterm-256color'
    return safeEnv
  }

  private normalizeCols(value?: number): number {
    if (!value || Number.isNaN(value)) return DEFAULT_COLS
    return Math.max(20, Math.min(300, Math.floor(value)))
  }

  private normalizeRows(value?: number): number {
    if (!value || Number.isNaN(value)) return DEFAULT_ROWS
    return Math.max(10, Math.min(120, Math.floor(value)))
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __banburyTerminalRuntime: TerminalRuntime | undefined
}

export function getTerminalRuntime() {
  if (!global.__banburyTerminalRuntime) {
    global.__banburyTerminalRuntime = new TerminalRuntime()
  }
  return global.__banburyTerminalRuntime
}
