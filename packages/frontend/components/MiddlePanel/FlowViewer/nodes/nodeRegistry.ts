export type NodeCategory =
  | 'trigger'
  | 'database'
  | 'communication'
  | 'calendar'
  | 'storage'
  | 'social'
  | 'development'
  | 'utility'
  | 'output'

export interface NodeDefinition {
  type: string
  label: string
  category: NodeCategory
  iconName: string
  description: string
  defaultData: Record<string, unknown>
  hasInput: boolean
  hasOutput: boolean
}

// 2 semantic groups:
// - action (trigger, output): primary color — visually prominent
// - integration (database, communication, calendar, storage, social, development, utility): neutral — calm on canvas
export const CATEGORY_COLORS: Record<NodeCategory, { border: string; header: string; icon: string; ring: string; handle: string }> = {
  trigger:       { border: 'border-primary/40',              header: 'bg-primary/10',             icon: 'text-primary',                         ring: 'ring-primary/50',              handle: '!bg-primary' },
  database:      { border: 'border-muted-foreground/30',     header: 'bg-muted/50',               icon: 'text-foreground',                      ring: 'ring-muted-foreground/40',     handle: '!bg-muted-foreground' },
  communication: { border: 'border-muted-foreground/30',     header: 'bg-muted/50',               icon: 'text-foreground',                      ring: 'ring-muted-foreground/40',     handle: '!bg-muted-foreground' },
  calendar:      { border: 'border-muted-foreground/30',     header: 'bg-muted/50',               icon: 'text-foreground',                      ring: 'ring-muted-foreground/40',     handle: '!bg-muted-foreground' },
  storage:       { border: 'border-muted-foreground/30',     header: 'bg-muted/50',               icon: 'text-foreground',                      ring: 'ring-muted-foreground/40',     handle: '!bg-muted-foreground' },
  social:        { border: 'border-muted-foreground/30',     header: 'bg-muted/50',               icon: 'text-foreground',                      ring: 'ring-muted-foreground/40',     handle: '!bg-muted-foreground' },
  development:   { border: 'border-muted-foreground/30',     header: 'bg-muted/50',               icon: 'text-foreground',                      ring: 'ring-muted-foreground/40',     handle: '!bg-muted-foreground' },
  utility:       { border: 'border-muted-foreground/30',     header: 'bg-muted/50',               icon: 'text-foreground',                      ring: 'ring-muted-foreground/40',     handle: '!bg-muted-foreground' },
  output:        { border: 'border-primary/40',              header: 'bg-primary/10',             icon: 'text-primary',                         ring: 'ring-primary/50',              handle: '!bg-primary' },
}

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  trigger:       'Triggers',
  database:      'Database',
  communication: 'Communication',
  calendar:      'Calendar',
  storage:       'Storage',
  social:        'Social',
  development:   'Development',
  utility:       'Utility',
  output:        'Output',
}

export const NODE_REGISTRY: NodeDefinition[] = [
  // Triggers
  {
    type: 'start',
    label: 'Start',
    category: 'trigger',
    iconName: 'Play',
    description: 'Flow entry point',
    defaultData: {},
    hasInput: false,
    hasOutput: true,
  },
  // Database
  {
    type: 'database-query',
    label: 'Database Query',
    category: 'database',
    iconName: 'Database',
    description: 'Query a saved database connection',
    defaultData: { connectionId: '', table: '', filters: [], columns: [] },
    hasInput: true,
    hasOutput: true,
  },
  // Communication
  {
    type: 'slack-send-message',
    label: 'Slack: Send Message',
    category: 'communication',
    iconName: 'MessageSquare',
    description: 'Send a message to a Slack channel',
    defaultData: { channel: '', messageTemplate: '' },
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'gmail-send',
    label: 'Gmail: Send Email',
    category: 'communication',
    iconName: 'Mail',
    description: 'Send an email via Gmail',
    defaultData: { to: '', subject: '', body: '', cc: '', bcc: '' },
    hasInput: true,
    hasOutput: true,
  },
  // Calendar
  {
    type: 'google-calendar',
    label: 'Google Calendar',
    category: 'calendar',
    iconName: 'CalendarDays',
    description: 'List or create Google Calendar events',
    defaultData: { operation: 'list', calendarId: 'primary', timeMin: '', timeMax: '', event: {} },
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'microsoft-calendar',
    label: 'Microsoft Calendar',
    category: 'calendar',
    iconName: 'CalendarCheck',
    description: 'List or create Outlook Calendar events',
    defaultData: { operation: 'list', calendarId: '', timeMin: '', timeMax: '', event: {} },
    hasInput: true,
    hasOutput: true,
  },
  // Storage
  {
    type: 'google-drive',
    label: 'Google Drive',
    category: 'storage',
    iconName: 'HardDrive',
    description: 'List or search Google Drive files',
    defaultData: { operation: 'list', query: '', folderId: '' },
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'onedrive',
    label: 'OneDrive',
    category: 'storage',
    iconName: 'Cloud',
    description: 'List or search OneDrive files',
    defaultData: { operation: 'list', query: '', folderId: '' },
    hasInput: true,
    hasOutput: true,
  },
  // Social
  {
    type: 'x-api',
    label: 'X (Twitter)',
    category: 'social',
    iconName: 'X',
    description: 'Post tweets or search X',
    defaultData: { operation: 'search', text: '', query: '' },
    hasInput: true,
    hasOutput: true,
  },
  // Development
  {
    type: 'github',
    label: 'GitHub',
    category: 'development',
    iconName: 'Github',
    description: 'List repos/issues, create issues, search code',
    defaultData: { operation: 'list-repos', owner: '', repo: '', title: '', body: '' },
    hasInput: true,
    hasOutput: true,
  },
  // Utility
  {
    type: 'format-text',
    label: 'Format Text',
    category: 'utility',
    iconName: 'FileText',
    description: 'Format data using a template with {{variable}} syntax',
    defaultData: { template: '' },
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'filter-data',
    label: 'Filter Data',
    category: 'utility',
    iconName: 'Filter',
    description: 'Filter incoming data by field conditions',
    defaultData: { conditions: [] },
    hasInput: true,
    hasOutput: true,
  },
  {
    type: 'http-request',
    label: 'HTTP Request',
    category: 'utility',
    iconName: 'Globe',
    description: 'Make an HTTP request to any URL',
    defaultData: { method: 'GET', url: '', headers: {}, body: '' },
    hasInput: true,
    hasOutput: true,
  },
  // Output
  {
    type: 'output',
    label: 'Output',
    category: 'output',
    iconName: 'MonitorCheck',
    description: 'Display flow execution results',
    defaultData: { label: 'Output', output: '' },
    hasInput: true,
    hasOutput: false,
  },
]

export const NODE_REGISTRY_MAP: Record<string, NodeDefinition> = Object.fromEntries(
  NODE_REGISTRY.map(def => [def.type, def])
)
