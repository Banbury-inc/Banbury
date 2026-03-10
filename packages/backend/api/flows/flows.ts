import { ApiService } from '../apiService'
import { FlowItem, FlowSchedule } from '../../../frontend/pages/Workspaces/types'

const BASE = '/flows'

export default class Flows {
  static async listFlows(): Promise<FlowItem[]> {
    const response = await ApiService.get<{ flows: FlowItem[] }>(`${BASE}/`)
    return response.flows ?? []
  }

  static async getFlow(flowId: string): Promise<FlowItem> {
    return ApiService.get<FlowItem>(`${BASE}/${flowId}/`)
  }

  static async createFlow(name: string): Promise<FlowItem> {
    return ApiService.post<FlowItem>(`${BASE}/`, { name })
  }

  static async updateFlow(
    flowId: string,
    graphData: { nodes: unknown[]; edges: unknown[]; viewport?: { x: number; y: number; zoom: number }; name?: string }
  ): Promise<FlowItem> {
    return ApiService.put<FlowItem>(`${BASE}/${flowId}/`, graphData)
  }

  static async deleteFlow(flowId: string): Promise<{ success: boolean; message: string }> {
    return ApiService.delete<{ success: boolean; message: string }>(`${BASE}/${flowId}/`)
  }

  static async runFlow(flowId: string): Promise<{ success: boolean; logs?: string[]; message?: string }> {
    return ApiService.post<{ success: boolean; logs?: string[]; message?: string }>(`${BASE}/${flowId}/run/`, {})
  }

  static async getSchedule(flowId: string): Promise<FlowSchedule> {
    return ApiService.get<FlowSchedule>(`${BASE}/${flowId}/schedule/`)
  }

  static async updateSchedule(flowId: string, schedule: Partial<FlowSchedule>): Promise<FlowItem> {
    return ApiService.put<FlowItem>(`${BASE}/${flowId}/schedule/`, schedule)
  }
}
