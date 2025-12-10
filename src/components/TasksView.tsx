import { Task, Campaign, Project, Label, List } from '@/lib/types'
import { ScrollArea } from './ui/scroll-area'
import { Card } from './ui/card'
import { CheckSquare } from '@phosphor-icons/react'
import TaskCard from './TaskCard'

interface TasksViewProps {
  tasks: Task[]
  campaigns: Campaign[]
  projects: Project[]
  lists: List[]
  labels: Label[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  onNavigateToCampaign: (campaignId: string) => void
}

export default function TasksView({
  tasks,
  campaigns,
  projects,
  lists,
  labels,
  setTasks,
  setLabels,
  onNavigateToCampaign,
}: TasksViewProps) {
  const getProjectForTask = (task: Task) => {
    const campaign = campaigns.find(c => c.id === task.campaignId)
    if (!campaign?.projectId) return null
    return projects.find(p => p.id === campaign.projectId)
  }

  const getCampaignForTask = (task: Task) => {
    return campaigns.find(c => c.id === task.campaignId)
  }

  const getListForTask = (task: Task) => {
    return lists.find(l => l.id === task.listId)
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">All Tasks</h2>
          <p className="text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} across all campaigns
          </p>
        </div>

        {sortedTasks.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckSquare size={48} className="mx-auto mb-4 text-muted-foreground" weight="duotone" />
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground">Create your first task to get started</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedTasks.map(task => {
              const campaign = getCampaignForTask(task)
              const project = getProjectForTask(task)
              const list = getListForTask(task)

              return (
                <div key={task.id} className="space-y-1">
                  <TaskCard
                    task={task}
                    tasks={tasks}
                    labels={labels}
                    campaigns={campaigns}
                    lists={lists}
                    setTasks={setTasks}
                    setLabels={setLabels}
                  />
                  <div className="px-2 text-xs text-muted-foreground truncate">
                    {project && <span>{project.title} → </span>}
                    {campaign && <span>{campaign.title}</span>}
                    {list && <span> → {list.title}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
