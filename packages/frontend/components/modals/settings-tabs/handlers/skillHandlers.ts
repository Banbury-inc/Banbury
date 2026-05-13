import { ApiService } from '../../../../../backend/api/apiService'
import type { Skill } from '../../../../../backend/api/skills/skills'

export interface SkillActionResult {
  success: boolean
  skill?: Skill
  skills?: Skill[]
  error?: string
}

export function createDefaultSkillContent() {
  return `---
name: New Skill
description: Describe when this skill should be used.
---

# New Skill

Use this skill when...

## Instructions

- Add concise, specific guidance here.
`
}

export async function loadSkills(): Promise<SkillActionResult> {
  const result = await ApiService.Skills.listSkills()
  return {
    success: result.success,
    skills: result.skills || [],
    error: result.error,
  }
}

export async function saveSkill(content: string, skillId?: string, enabled = true): Promise<SkillActionResult> {
  const trimmedContent = content.trim()
  if (!trimmedContent) {
    return {
      success: false,
      error: 'Skill content is required',
    }
  }

  const result = skillId
    ? await ApiService.Skills.updateSkill(skillId, { content: trimmedContent, enabled })
    : await ApiService.Skills.createSkill({ content: trimmedContent, enabled })

  return {
    success: result.success,
    skill: result.skill,
    error: result.error,
  }
}

export async function updateSkillEnabled(skillId: string, enabled: boolean): Promise<SkillActionResult> {
  const result = await ApiService.Skills.updateSkill(skillId, { enabled })
  return {
    success: result.success,
    skill: result.skill,
    error: result.error,
  }
}

export async function deleteSkill(skillId: string): Promise<SkillActionResult> {
  const result = await ApiService.Skills.deleteSkill(skillId)
  return {
    success: result.success,
    error: result.error,
  }
}
