'use client'

import { useState, useEffect } from 'react'
import { Panel } from '@xyflow/react'
import {
  Play, Database, MessageSquare, Mail, CalendarDays, CalendarCheck,
  HardDrive, Cloud, X as XIcon, Github, FileText, Filter, Globe, MonitorCheck,
  Search, ChevronDown, ChevronRight, type LucideIcon,
} from 'lucide-react'
import { Input } from '../../common/ui/input'
import { NODE_REGISTRY, CATEGORY_COLORS, CATEGORY_LABELS, NodeCategory, NodeDefinition } from './nodes/nodeRegistry'

const ICON_MAP: Record<string, LucideIcon> = {
  Play, Database, MessageSquare, Mail, CalendarDays, CalendarCheck,
  HardDrive, Cloud, Github, FileText, Filter, Globe, MonitorCheck, X: XIcon,
}

const CATEGORY_ORDER: NodeCategory[] = [
  'trigger', 'database', 'communication', 'calendar', 'storage', 'social', 'development', 'utility', 'output',
]

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Globe
}

interface NodeItemProps {
  def: NodeDefinition
}

function NodeItem({ def }: NodeItemProps) {
  const colors = CATEGORY_COLORS[def.category]
  const Icon = getIcon(def.iconName)

  function onDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('application/reactflow-nodetype', def.type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`
        flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-grab active:cursor-grabbing
        bg-card hover:bg-accent transition-colors select-none
        ${colors.border}
      `}
      title={def.description}
    >
      <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${colors.icon}`} />
      <span className="text-xs text-foreground truncate">{def.label}</span>
    </div>
  )
}

interface CategorySectionProps {
  category: NodeCategory
  nodes: NodeDefinition[]
  defaultOpen?: boolean
  searchActive?: boolean
}

function CategorySection({ category, nodes, defaultOpen = false, searchActive = false }: CategorySectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = CATEGORY_COLORS[category]

  useEffect(() => {
    if (searchActive) setOpen(true)
  }, [searchActive])

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 px-1 py-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {open
          ? <ChevronDown className="h-3 w-3 flex-shrink-0" />
          : <ChevronRight className="h-3 w-3 flex-shrink-0" />
        }
        <span className={`flex-1 text-left ${colors.icon}`}>{CATEGORY_LABELS[category]}</span>
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5 pl-1">
          {nodes.map(def => <NodeItem key={def.type} def={def} />)}
        </div>
      )}
    </div>
  )
}

export function NodeToolbar() {
  const [search, setSearch] = useState('')

  const query = search.toLowerCase().trim()
  const filtered = NODE_REGISTRY.filter(
    def =>
      !query ||
      def.label.toLowerCase().includes(query) ||
      def.description.toLowerCase().includes(query) ||
      def.category.toLowerCase().includes(query)
  )

  const grouped = CATEGORY_ORDER.reduce<Record<NodeCategory, NodeDefinition[]>>(
    (acc, cat) => {
      acc[cat] = filtered.filter(d => d.category === cat)
      return acc
    },
    {} as Record<NodeCategory, NodeDefinition[]>
  )

  const firstNonEmptyCategory = CATEGORY_ORDER.find(cat => grouped[cat].length > 0)

  return (
    <Panel position="top-left" style={{ margin: 0 }}>
      <div className="flex flex-col w-52 max-h-[calc(100vh-140px)] bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="px-2 pt-2 pb-1.5 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              className="h-6 pl-6 pr-2 text-xs"
              placeholder="Search nodes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {CATEGORY_ORDER.map(cat =>
            grouped[cat].length > 0 ? (
              <CategorySection
                key={cat}
                category={cat}
                nodes={grouped[cat]}
                defaultOpen={cat === firstNonEmptyCategory}
                searchActive={query.length > 0}
              />
            ) : null
          )}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-4">No nodes found</p>
          )}
        </div>
      </div>
    </Panel>
  )
}
