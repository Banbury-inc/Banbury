import { useEffect, useState } from 'react'
import { Edit3, Plus, Trash2, X } from 'lucide-react'

import { Button } from '../../common/ui/button'
import { Badge } from '../../common/ui/badge'
import { Label } from '../../common/ui/label'
import { Switch } from '../../common/ui/switch'
import { Textarea } from '../../common/ui/textarea'
import { Typography } from '@/components/common/ui/typography'
import { useToast } from '../../common/ui/use-toast'
import type { Skill } from '../../../../backend/api/skills/skills'
import {
  createDefaultSkillContent,
  deleteSkill,
  loadSkills,
  saveSkill,
  updateSkillEnabled,
} from './handlers/skillHandlers'
import {
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabCardFooter,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabLabel,
  SettingsTabRow,
  SettingsTabSection,
} from './settings-tab-layout'

export function SkillsTab() {
  const { toast } = useToast()
  const [skills, setSkills] = useState<Skill[]>([])
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [draftContent, setDraftContent] = useState(createDefaultSkillContent())
  const [draftEnabled, setDraftEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    refreshSkills()
  }, [])

  async function refreshSkills() {
    setIsLoading(true)
    const result = await loadSkills()
    setIsLoading(false)

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to load skills',
        variant: 'destructive',
      })
      return
    }

    setSkills(result.skills || [])
  }

  function handleCreateNew() {
    setSelectedSkill(null)
    setDraftContent(createDefaultSkillContent())
    setDraftEnabled(true)
  }

  function handleEditSkill(skill: Skill) {
    setSelectedSkill(skill)
    setDraftContent(skill.content)
    setDraftEnabled(skill.enabled)
  }

  async function handleSaveSkill() {
    setIsSaving(true)
    const result = await saveSkill(draftContent, selectedSkill?.id, draftEnabled)
    setIsSaving(false)

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to save skill',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Skill Saved',
      description: 'Your skill has been saved.',
    })
    window.dispatchEvent(new CustomEvent('skills-updated'))

    await refreshSkills()
    if (result.skill) handleEditSkill(result.skill)
  }

  async function handleToggleSkill(skill: Skill, enabled: boolean) {
    const result = await updateSkillEnabled(skill.id, enabled)
    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update skill',
        variant: 'destructive',
      })
      return
    }

    setSkills(currentSkills =>
      currentSkills.map(currentSkill =>
        currentSkill.id === skill.id ? { ...currentSkill, enabled } : currentSkill
      )
    )
    window.dispatchEvent(new CustomEvent('skills-updated'))

    if (selectedSkill?.id === skill.id) {
      setSelectedSkill(currentSkill => currentSkill ? { ...currentSkill, enabled } : null)
      setDraftEnabled(enabled)
    }
  }

  async function handleDeleteSkill(skill: Skill) {
    const confirmed = window.confirm(`Delete "${skill.name}"? This cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    const result = await deleteSkill(skill.id)
    setIsDeleting(false)

    if (!result.success) {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete skill',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Skill Deleted',
      description: 'The skill has been deleted.',
    })
    window.dispatchEvent(new CustomEvent('skills-updated'))

    if (selectedSkill?.id === skill.id) handleCreateNew()
    await refreshSkills()
  }

  return (
    <SettingsTabLayout>
      <div>
        <SettingsTabHeader title="Skills" />
        <Typography variant="small" className="mt-2 text-muted-foreground">
          Create reusable SKILL.md instructions and apply them from the composer with `/`.
        </Typography>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <SettingsTabSection title="Your Skills">
          <Button type="button" variant="outline" onClick={handleCreateNew} className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            New Skill
          </Button>

          <SettingsTabCard>
            <SettingsTabCardBody>
              {isLoading ? (
                <div className="px-4 py-3.5">
                  <Typography variant="small" className="text-muted-foreground">
                    Loading skills...
                  </Typography>
                </div>
              ) : skills.length === 0 ? (
                <div className="px-4 py-3.5">
                  <Typography variant="small" className="text-muted-foreground">
                    No skills yet. Create one to make it available from the composer.
                  </Typography>
                </div>
              ) : (
                skills.map(skill => (
                  <div key={skill.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditSkill(skill)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <SettingsTabLabel
                          label={skill.name}
                          description={skill.description || 'No description'}
                          labelClassName="truncate"
                          descriptionClassName="line-clamp-2"
                        />
                      </button>
                      <Badge variant={skill.enabled ? 'secondary' : 'outline'}>
                        {skill.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Switch
                        checked={skill.enabled}
                        onCheckedChange={checked => handleToggleSkill(skill, checked)}
                        aria-label={`Toggle ${skill.name}`}
                      />
                      <div className="flex items-center gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleEditSkill(skill)}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Edit {skill.name}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSkill(skill)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete {skill.name}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </SettingsTabCardBody>
          </SettingsTabCard>
        </SettingsTabSection>

        <SettingsTabCard>
          <SettingsTabCardBody>
            <div className="flex items-start justify-between gap-3 px-4 py-3.5">
              <SettingsTabLabel
                label={selectedSkill ? `Edit ${selectedSkill.name}` : 'Create Skill'}
                description="Save a complete SKILL.md-style markdown document. Frontmatter name and description are used in lists."
              />
              {selectedSkill && (
                <Button type="button" variant="ghost" size="sm" onClick={handleCreateNew}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear selected skill</span>
                </Button>
              )}
            </div>

            <SettingsTabRow
              label="Available in composer"
              description="Disabled skills stay saved but do not appear in `/` search."
              htmlFor="skill-enabled"
              align="start"
            >
              <Switch id="skill-enabled" checked={draftEnabled} onCheckedChange={setDraftEnabled} />
            </SettingsTabRow>

            <div className="space-y-2 px-4 py-3.5">
              <Label htmlFor="skill-content">
                <Typography variant="small" className="font-medium text-foreground">
                  SKILL.md Content
                </Typography>
              </Label>
              <Textarea
                id="skill-content"
                value={draftContent}
                onChange={event => setDraftContent(event.target.value)}
                className="min-h-[360px] font-mono text-sm"
                placeholder={createDefaultSkillContent()}
              />
            </div>
          </SettingsTabCardBody>

          <SettingsTabCardFooter className="justify-end">
            <Button type="button" onClick={handleSaveSkill} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Skill'}
            </Button>
          </SettingsTabCardFooter>
        </SettingsTabCard>
      </div>
    </SettingsTabLayout>
  )
}
