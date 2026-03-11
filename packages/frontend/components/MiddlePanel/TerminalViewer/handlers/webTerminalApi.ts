interface CreateTerminalSessionInput {
  authToken: string
  cwd?: string
}

interface CreateTerminalSessionResponse {
  sessionId: string
  sessionToken: string
}

interface CloseTerminalSessionInput {
  authToken: string
  sessionId: string
  sessionToken: string
}

async function parseJsonResponse(response: Response) {
  const payload = await response.json().catch(() => ({} as { error?: string }))
  if (response.ok) return payload
  const message = payload?.error || `Request failed with ${response.status}`
  throw new Error(message)
}

export async function ensureTerminalSocketServer() {
  const response = await fetch('/api/terminal/socket', { method: 'GET' })
  await parseJsonResponse(response)
}

export async function createTerminalSession({
  authToken,
  cwd,
}: CreateTerminalSessionInput): Promise<CreateTerminalSessionResponse> {
  const response = await fetch('/api/terminal/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ cwd }),
  })
  return parseJsonResponse(response) as Promise<CreateTerminalSessionResponse>
}

export async function closeTerminalSession({
  authToken,
  sessionId,
  sessionToken,
}: CloseTerminalSessionInput) {
  const response = await fetch(`/api/terminal/session/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ sessionToken }),
  })
  await parseJsonResponse(response)
}
