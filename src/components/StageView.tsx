import { useState } from 'react'
import { List, Task, Label, Campaign, Project } from '@/lib/types'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { ArrowLeft, Plus } from '@phosphor-icons/react'
import { Badge } from './ui/badge'
import { getLabelColor } from '@/lib/helpers'
import { tasksService } from '@/services/tasks.service'
import { toast } from 'sonner'
import TaskCard from './TaskCard'
import TaskDetailDialog from './TaskDetailDialog'
import EmptyState from './EmptyState'

interface StageViewProps {
  list: List
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  campaigns: Campaign[]
  projects: Project[]
  onBack: () => void
  orgId: string
}

export default function StageView({
  list,
  lists,
  setLists,
  tasks,
  setTasks,
  labels,
  setLabels,
  campaigns,
  projects,
  onBack,
  orgId,
}: StageViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')

  const stageTasks = tasks
    .filter(t => t.listId === list.id)
    .sort((a, b) => a.order - b.order)

  const filteredTasks = searchText
    ? stageTasks.filter(
        t =>
          t.title.toLowerCase().includes(searchText.toLowerCase()) ||
          t.description.toLowerCase().includes(searchText.toLowerCase())
      )
    : stageTasks

  const handleCreateTask = async () => {
    try {
      const newTask = await tasksService.create({
        title: 'New Task',
        description: '',
        listId: list.id,
        campaignId: list.campaignId,
        labelIds: [],
        order: stageTasks.length,
      })
      // Optimistically update local state
      setTasks(prev => [...prev, newTask])
      setSelectedTaskId(newTask.id)
      toast.success('Task created')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId)
  const campaign = campaigns.find(c => c.id === list.campaignId)

  const completedTasks = filteredTasks.filter(t => 
    t.subtasks && t.subtasks.length > 0 && t.subtasks.every(st => st.completed)
  ).length

  const taskProgress = filteredTasks.length > 0 
    ? Math.round((completedTasks / filteredTasks.length) * 100)
    : 0

  return (
    <>
      <div className="h-full flex flex-col bg-background">
        <div className="border-b bg-card">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="gap-2"
                >
                  <ArrowLeft size={16} weight="bold" />
                  Back to Board
                </Button>
                <div className="h-6 w-px bg-border" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{list.title}</h1>
                  {campaign && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {campaign.title}
                    </p>
                  )}
                </div>
              </div>
              <Button onClick={handleCreateTask} className="gap-2">
                <Plus size={16} weight="bold" />
                Add Task
              </Button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                </Badge>
                <Badge variant="outline">
                  {completedTasks} completed
                </Badge>
              </div>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                  <span className="absolute right-0 -top-5 text-xs text-muted-foreground">
                    {taskProgress}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="search"
                placeholder="Search tasks..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="flex-1 px-4 py-2 bg-background border rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {filteredTasks.length === 0 ? (
              <EmptyState
                title={searchText ? 'No tasks found' : 'No tasks in this stage'}
                description={
                  searchText
                    ? 'Try adjusting your search query'
                    : 'Create your first task to get started'
                }
              />
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => setSelectedTaskId(task.id)}
                    className="cursor-pointer"
                  >
                    <TaskCard
                      task={task}
                      tasks={tasks}
                      setTasks={setTasks}
                      labels={labels}
                      setLabels={setLabels}
                      lists={lists}
                      campaigns={campaigns}
                      projects={projects}
                      orgId={orgId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          lists={lists}
          campaigns={campaigns}
          projects={projects}
          open={!!selectedTaskId}
          onOpenChange={(open) => {
            if (!open) setSelectedTaskId(null)
          }}
          orgId={orgId}
        />
      )}
    </>
  )
}
