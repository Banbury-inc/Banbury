import { type NodeProps, type Node } from '@xyflow/react'
import { Github } from 'lucide-react'
import { BaseNode } from './BaseNode'

export type GitHubNodeData = {
  label?: string
  operation?: 'list-repos' | 'get-repo' | 'list-issues' | 'create-issue' | 'list-prs' | 'get-file' | 'search-code'
  owner?: string
  repo?: string
  title?: string
  body?: string
  query?: string
  path?: string
}

type GitHubNodeType = Node<GitHubNodeData, 'github'>

const OPERATION_LABELS: Record<string, string> = {
  'list-repos': 'List Repos',
  'get-repo': 'Get Repo',
  'list-issues': 'List Issues',
  'create-issue': 'Create Issue',
  'list-prs': 'List PRs',
  'get-file': 'Get File',
  'search-code': 'Search Code',
}

export function GitHubNode({ data, selected }: NodeProps<GitHubNodeType>) {
  const op = data.operation ?? 'list-repos'

  return (
    <BaseNode
      category="development"
      icon={Github}
      title="GitHub"
      selected={selected}
    >
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Op:</span> {OPERATION_LABELS[op] ?? op}
        </p>
        {(data.owner || data.repo) && (
          <p className="text-xs text-muted-foreground truncate">
            {data.owner && data.repo ? `${data.owner}/${data.repo}` : data.owner ?? data.repo}
          </p>
        )}
      </div>
    </BaseNode>
  )
}
