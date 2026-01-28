import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Plus, CheckSquare } from 'lucide-react'
import { Button } from '../../../ui/button'
import { Typography } from '../../../ui/typography'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '../../../ui/select'
import { Task, TaskStatus } from '../../../../pages/TaskStudio/types'
import { taskHandlers } from '../../../../pages/TaskStudio/handlers/taskHandlers'
import { TasksListView } from './components/TasksListView'
import { handleRefreshTasks } from './handlers/handleRefreshTasks'
import { useTaskWorkspaceHandlers } from './handlers/workspaceHandlers'
import { PanelGroup } from '../../../../pages/Workspaces/types'

interface TasksTabProps {
  selectedTask?: Task | null
  // Workspace dependencies
  activePanelId?: string
  panelLayout?: PanelGroup
  setPanelLayout?: React.Dispatch<React.SetStateAction<PanelGroup>>
  setActivePanelId?: React.Dispatch<React.SetStateAction<string>>
  setSelectedTask?: React.Dispatch<React.SetStateAction<Task | null>>
}

export function TasksTab({ 
  selectedTask,
  activePanelId = 'main-panel',
  panelLayout,
  setPanelLayout,
  setActivePanelId,
  setSelectedTask: setSelectedTaskProp
}: TasksTabProps) {
  // Always call hook unconditionally - it handles optional dependencies internally
  const workspaceHandlers = useTaskWorkspaceHandlers({
    activePanelId,
    panelLayout: panelLayout ?? null,
    setPanelLayout: setPanelLayout ?? (() => {}),
    setActivePanelId: setActivePanelId ?? (() => {}),
    setSelectedTask: setSelectedTaskProp ?? (() => {})
  })

  const onTaskSelect = workspaceHandlers?.handleTaskSelect
  const onCreateTask = workspaceHandlers?.handleCreateTask
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const allTasks = await taskHandlers.getTasks()
      setTasks(allTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks, refreshCounter])

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter)

  const handleRefresh = () => {
    handleRefreshTasks({ setRefreshCounter, setIsRefreshing })
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Content Header */}
      <div className="flex flex-col bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b min-w-0 gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {/* Status Filter */}
            <Select value={filter} onValueChange={(value) => setFilter(value as TaskStatus | 'all')}>
              <SelectTrigger size="xs" className="min-w-0 w-auto max-w-full overflow-hidden">
                <SelectValue>
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <CheckSquare className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
                    <Typography variant="xs" className="font-medium truncate hidden @[280px]:inline min-w-0">
                      {filter === 'all' ? 'All Tasks' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Typography>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Filter</SelectLabel>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <Typography variant="xs" className="font-medium">All Tasks</Typography>
                    </div>
                  </SelectItem>
                  <SelectItem value="scheduled">
                    <Typography variant="xs" className="font-medium">Scheduled</Typography>
                  </SelectItem>
                  <SelectItem value="running">
                    <Typography variant="xs" className="font-medium">Running</Typography>
                  </SelectItem>
                  <SelectItem value="completed">
                    <Typography variant="xs" className="font-medium">Completed</Typography>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <Typography variant="xs" className="font-medium">Cancelled</Typography>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="xs"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh"
              className="flex-shrink-0 hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin text-muted-foreground' : 'h-4 w-4 text-muted-foreground'} />
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={onCreateTask}
              title="Create Task"
              className="flex-shrink-0 bg-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4 text-accent-foreground" strokeWidth={1} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <TasksListView
          tasks={filteredTasks}
          loading={loading}
          onTaskSelect={onTaskSelect}
          selectedTask={selectedTask}
        />
      </div>
    </div>
  )
}

