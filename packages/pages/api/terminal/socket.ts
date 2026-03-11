import type { NextApiRequest, NextApiResponse } from 'next'
import type { Server as HttpServer } from 'http'
import type { Socket as NetSocket } from 'net'
import { Server as SocketIOServer } from 'socket.io'
import { authenticateTerminalToken } from './handlers/authenticateTerminalUser'
import { getTerminalRuntime } from './handlers/terminalRuntime'

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NetSocket & {
    server: HttpServer & {
      io?: SocketIOServer
    }
  }
}

interface JoinPayload {
  sessionId?: string
  sessionToken?: string
  authToken?: string
}

interface InputPayload {
  sessionId?: string
  data?: string
}

interface ResizePayload {
  sessionId?: string
  cols?: number
  rows?: number
}

interface ClosePayload {
  sessionId?: string
}

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    res.status(200).json({ ok: true })
    return
  }

  const io = new SocketIOServer(res.socket.server, {
    path: '/api/terminal/socket',
    addTrailingSlash: false,
  })
  res.socket.server.io = io

  io.on('connection', (socket) => {
    const runtime = getTerminalRuntime()
    const unsubs = new Map<string, () => void>()
    const sessionOwners = new Map<string, string>()

    socket.on('terminal:join', async (payload: JoinPayload) => {
      try {
        const sessionId = payload.sessionId || ''
        const sessionToken = payload.sessionToken || ''
        const authToken = payload.authToken || ''
        const userId = await authenticateTerminalToken(authToken)
        const sessionSummary = runtime.authorizeSession(sessionId, sessionToken, userId)

        const unsubscribe = runtime.subscribe(sessionId, (event) => {
          if (event.type === 'data') {
            socket.emit('terminal:data', { sessionId, data: event.payload })
            return
          }

          if (event.type === 'exit') {
            socket.emit('terminal:exit', { sessionId, exitCode: event.payload })
          }
        })

        unsubs.set(sessionId, unsubscribe)
        sessionOwners.set(sessionId, userId)
        socket.emit('terminal:ready', { sessionId, summary: sessionSummary })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to join terminal session'
        socket.emit('terminal:error', { message })
      }
    })

    socket.on('terminal:input', (payload: InputPayload) => {
      try {
        const sessionId = payload.sessionId || ''
        const data = payload.data || ''
        const userId = sessionOwners.get(sessionId)
        if (!userId) throw new Error('Session is not joined')
        runtime.writeToSession(sessionId, userId, data)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to write to terminal'
        socket.emit('terminal:error', { message })
      }
    })

    socket.on('terminal:resize', (payload: ResizePayload) => {
      try {
        const sessionId = payload.sessionId || ''
        const userId = sessionOwners.get(sessionId)
        if (!userId) throw new Error('Session is not joined')
        runtime.resizeSession(sessionId, userId, payload.cols || 80, payload.rows || 24)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to resize terminal'
        socket.emit('terminal:error', { message })
      }
    })

    socket.on('terminal:close', (payload: ClosePayload) => {
      try {
        const sessionId = payload.sessionId || ''
        const userId = sessionOwners.get(sessionId)
        if (!userId) return
        runtime.closeSession(sessionId, userId)
      } catch {}
    })

    socket.on('disconnect', () => {
      unsubs.forEach((unsubscribe) => unsubscribe())
      unsubs.clear()
      sessionOwners.clear()
    })
  })

  res.status(200).json({ ok: true })
}
