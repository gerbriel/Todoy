import { Task, Campaign, List, Label } from '@/lib/types'

interface TaskListProps {
  list: List
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  campaigns: Campaign[]
}

export default function TaskList({
  list,
  tasks,
}: TaskListProps) {
  const listTasks = tasks.filter(t => t.listId === list.id)
  
  return (
    <div className="flex-shrink-0 w-80 bg-card border border-border rounded-lg p-4">
      <h3 className="font-semibold text-foreground mb-4">{list.title}</h3>
      <div className="space-y-2">
        {listTasks.map(task => (
          <div key={task.id} className="p-3 bg-background border border-border rounded">
            {task.title}
          </div>
        ))}
      </div>
    </div>
  )
}
