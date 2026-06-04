import type { Skill } from '../../../../../backend/api/skills/skills'

export interface PendingSkillContext {
  id: string
  name: string
  description: string
  content: string
}

const PENDING_SKILL_KEY = 'pendingSkillContext'

export function setPendingSkillContext(skill: Skill) {
  if (typeof window === 'undefined') return

  const pendingSkill: PendingSkillContext = {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    content: skill.content,
  }

  localStorage.setItem(PENDING_SKILL_KEY, JSON.stringify(pendingSkill))
  window.dispatchEvent(new CustomEvent('pending-skill-context-change', { detail: pendingSkill }))
}

export function peekPendingSkillContext(): PendingSkillContext | null {
  if (typeof window === 'undefined') return null

  try {
    const saved = localStorage.getItem(PENDING_SKILL_KEY)
    if (!saved) return null
    return JSON.parse(saved) as PendingSkillContext
  } catch {
    localStorage.removeItem(PENDING_SKILL_KEY)
    return null
  }
}

export function consumePendingSkillContext(): PendingSkillContext | null {
  const pendingSkill = peekPendingSkillContext()
  clearPendingSkillContext()
  return pendingSkill
}

export function clearPendingSkillContext() {
  if (typeof window === 'undefined') return

  localStorage.removeItem(PENDING_SKILL_KEY)
  window.dispatchEvent(new CustomEvent('pending-skill-context-change', { detail: null }))
}
