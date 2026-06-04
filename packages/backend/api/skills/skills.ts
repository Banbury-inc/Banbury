import { ApiService } from "../apiService"

export interface Skill {
  _id: string
  id: string
  name: string
  description: string
  content: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface SkillRequest {
  content: string
  enabled?: boolean
}

export interface SkillResponse {
  success: boolean
  skill?: Skill
  skills?: Skill[]
  message?: string
  error?: string
}

export default class Skills {
  static async listSkills(): Promise<SkillResponse> {
    try {
      return await ApiService.get<SkillResponse>("/skills/")
    } catch (error) {
      console.error("Error loading skills:", error)
      return {
        success: false,
        error: "Failed to load skills",
      }
    }
  }

  static async createSkill(data: SkillRequest): Promise<SkillResponse> {
    try {
      return await ApiService.post<SkillResponse>("/skills/", data)
    } catch (error) {
      console.error("Error creating skill:", error)
      return {
        success: false,
        error: "Failed to create skill",
      }
    }
  }

  static async updateSkill(skillId: string, data: Partial<SkillRequest>): Promise<SkillResponse> {
    try {
      return await ApiService.put<SkillResponse>(`/skills/${skillId}/`, data)
    } catch (error) {
      console.error("Error updating skill:", error)
      return {
        success: false,
        error: "Failed to update skill",
      }
    }
  }

  static async deleteSkill(skillId: string): Promise<SkillResponse> {
    try {
      return await ApiService.delete<SkillResponse>(`/skills/${skillId}/`)
    } catch (error) {
      console.error("Error deleting skill:", error)
      return {
        success: false,
        error: "Failed to delete skill",
      }
    }
  }
}
