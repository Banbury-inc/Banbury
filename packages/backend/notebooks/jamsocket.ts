import axios from 'axios'
import { ApiService } from '../api/apiService'

export namespace Jamsocket {
  export type TerminationReason = 'swept' | 'external' | 'startuptimeout' | 'keyexpired' | 'lost'
  export interface Status {
    status: 'scheduled' | 'loading' | 'starting' | 'waiting' | 'ready' | 'terminating' | 'hard-terminated' | 'terminated'
    termination_reason?: TerminationReason
  }
  export interface Backend {
    backend_id: string
    url: string
    status: Status['status']
    spawned: boolean
  }
}

export class NotebookJamsocketApi {
  async getBackendStatus(backendId: string): Promise<Jamsocket.Status | undefined> {
    const originalAuthorization = (axios.defaults.headers.common as any)['Authorization']
    delete (axios.defaults.headers.common as any)['Authorization']
    try {
      const response = await axios.get(`https://api.jamsocket.com/v2/backend/${backendId}/status`, {
        headers: { 'content-type': 'application/json' }
      })
      return response?.data as Jamsocket.Status
    } finally {
      ;(axios.defaults.headers.common as any)['Authorization'] = originalAuthorization
    }
  }

  async createOrGetBackend(options: { docId: string }): Promise<Jamsocket.Backend | null> {
    try {
      const response = await ApiService.post<Jamsocket.Backend>('/jamsocket/create', { doc_id: options.docId })
      return response || null
    } catch {
      return null
    }
  }

  async waitUntilReady(backend: Jamsocket.Backend, control?: { abort: boolean }) {
    let status: Jamsocket.Status | undefined = { status: backend.status }
    while (status && ['scheduled', 'loading', 'starting', 'waiting'].includes(status.status)) {
      if (control?.abort) return
      await new Promise((r) => setTimeout(r, 500))
      status = await this.getBackendStatus(backend.backend_id)
    }
    if (!status || status.status !== 'ready') throw new Error('Notebook backend not ready')
  }
}


