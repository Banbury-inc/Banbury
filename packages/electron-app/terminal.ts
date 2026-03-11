// @ts-nocheck
import { ipcMain, WebContents } from 'electron'
import os from 'os'

interface TerminalSession {
  pty: any
  webContentsId: number
}

const sessions = new Map<string, TerminalSession>()

function getDefaultShell(): string {
  if (process.platform === 'win32') return 'powershell.exe'
  return process.env.SHELL || '/bin/bash'
}

function getDefaultCwd(): string {
  return os.homedir()
}

export function setupTerminalIPC(): void {
  ipcMain.handle('terminal:start', async (event, sessionId: string, cwd?: string) => {
    try {
      let nodePty: any
      try {
        nodePty = require('node-pty')
      } catch (ptyErr) {
        console.error('[Terminal] node-pty is not available:', ptyErr)
        return { success: false, error: 'node-pty is not installed. Run `npm install node-pty` in the packages directory.' }
      }

      const shell = getDefaultShell()
      const workingDir = cwd || getDefaultCwd()

      const ptyProcess = nodePty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 30,
        cwd: workingDir,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
        },
      })

      const webContentsId = event.sender.id

      sessions.set(sessionId, { pty: ptyProcess, webContentsId })

      ptyProcess.onData((data: string) => {
        try {
          if (!event.sender.isDestroyed()) {
            event.sender.send('terminal:data', sessionId, data)
          }
        } catch {
          // Renderer may have been destroyed; clean up silently
        }
      })

      ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
        try {
          if (!event.sender.isDestroyed()) {
            event.sender.send('terminal:exit', sessionId, exitCode)
          }
        } catch {
          // ignore
        }
        sessions.delete(sessionId)
      })

      return { success: true }
    } catch (error) {
      console.error('[Terminal] Failed to start PTY session:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.on('terminal:input', (_event, sessionId: string, data: string) => {
    const session = sessions.get(sessionId)
    if (session) {
      try {
        session.pty.write(data)
      } catch (error) {
        console.error('[Terminal] Failed to write to PTY:', error)
      }
    }
  })

  ipcMain.on('terminal:resize', (_event, sessionId: string, cols: number, rows: number) => {
    const session = sessions.get(sessionId)
    if (session) {
      try {
        session.pty.resize(cols, rows)
      } catch (error) {
        console.error('[Terminal] Failed to resize PTY:', error)
      }
    }
  })

  ipcMain.on('terminal:close', (_event, sessionId: string) => {
    const session = sessions.get(sessionId)
    if (session) {
      try {
        session.pty.kill()
      } catch {
        // already dead
      }
      sessions.delete(sessionId)
    }
  })
}

export function cleanupAllTerminalSessions(): void {
  for (const [sessionId, session] of sessions) {
    try {
      session.pty.kill()
    } catch {
      // ignore
    }
    sessions.delete(sessionId)
  }
}

export function cleanupTerminalSessionsForWebContents(webContentsId: number): void {
  for (const [sessionId, session] of sessions) {
    if (session.webContentsId === webContentsId) {
      try {
        session.pty.kill()
      } catch {
        // ignore
      }
      sessions.delete(sessionId)
    }
  }
}
