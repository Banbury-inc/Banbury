'use client'

import { Label } from '../../../common/ui/label'
import { Input } from '../../../common/ui/input'
import { Textarea } from '../../../common/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../common/ui/select'
import { GitHubNodeData } from '../nodes/GitHubNode'

interface Props {
  data: GitHubNodeData
  onChange: (data: Partial<GitHubNodeData>) => void
}

const OPERATIONS = [
  { value: 'list-repos', label: 'List Repos' },
  { value: 'get-repo', label: 'Get Repo' },
  { value: 'list-issues', label: 'List Issues' },
  { value: 'create-issue', label: 'Create Issue' },
  { value: 'list-prs', label: 'List Pull Requests' },
  { value: 'get-file', label: 'Get File Contents' },
  { value: 'search-code', label: 'Search Code' },
]

const NEEDS_REPO = ['get-repo', 'list-issues', 'create-issue', 'list-prs', 'get-file']

export function GitHubConfig({ data, onChange }: Props) {
  const op = data.operation ?? 'list-repos'
  const needsOwnerRepo = NEEDS_REPO.includes(op)

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Operation</Label>
        <Select value={op} onValueChange={val => onChange({ operation: val as GitHubNodeData['operation'] })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATIONS.map(o => (
              <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {needsOwnerRepo && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Owner</Label>
            <Input
              className="h-8 text-xs"
              placeholder="octocat or {{owner}}"
              value={data.owner ?? ''}
              onChange={e => onChange({ owner: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Repository</Label>
            <Input
              className="h-8 text-xs"
              placeholder="my-repo or {{repo}}"
              value={data.repo ?? ''}
              onChange={e => onChange({ repo: e.target.value })}
            />
          </div>
        </>
      )}

      {op === 'create-issue' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              className="h-8 text-xs"
              placeholder="Issue title or {{title}}"
              value={data.title ?? ''}
              onChange={e => onChange({ title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body</Label>
            <Textarea
              className="text-xs min-h-[80px] resize-y"
              placeholder="Issue description or {{body}}"
              value={data.body ?? ''}
              onChange={e => onChange({ body: e.target.value })}
            />
          </div>
        </>
      )}

      {(op === 'search-code') && (
        <div className="space-y-1.5">
          <Label className="text-xs">Search Query</Label>
          <Input
            className="h-8 text-xs"
            placeholder="language:typescript useState"
            value={data.query ?? ''}
            onChange={e => onChange({ query: e.target.value })}
          />
        </div>
      )}

      {op === 'get-file' && (
        <div className="space-y-1.5">
          <Label className="text-xs">File Path</Label>
          <Input
            className="h-8 text-xs"
            placeholder="src/index.ts"
            value={data.path ?? ''}
            onChange={e => onChange({ path: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
