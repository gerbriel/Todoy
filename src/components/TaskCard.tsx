import { useState, DragEvent } from 'react'
import { Clock, Tag, CheckSquare } from '@phosphor-icons/react'
import { Task, Label, List, Campaign } from '@/lib/types'
import { getLabelColor, formatDate, isOverdue } from '@/lib/helpers'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import TaskDetailDialog from './TaskDetailDialog'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  campaigns: Campaign[]
  onDragOver?: () => void
  orgId: string
}

export default function TaskCard({
  task,
  tasks,
  setTasks,
  labels,
  setLabels,
  lists,
  campaigns,
  onDragOver,
  orgId,
}: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const taskLabels = labels.filter(l => task.labelIds.includes(l.id))
  const visibleLabels = taskLabels.slice(0, 3)
  const remainingCount = taskLabels.length - 3
  
  const subtasks = task.subtasks || []
  const completedSubtasks = subtasks.filter(t => t.completed).length
  const totalSubtasks = subtasks.length

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
    e.dataTransfer.setData('sourceListId', task.listId)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleToggleComplete = () => {
    setTasks((currentTasks) =>
      currentTasks.map((t) =>
        t.id === task.id ? { ...t, completed: !t.completed } : t
      )
    )
  }

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => setIsDialogOpen(true)}
        className={cn(
          'group bg-card border border-border rounded-md p-3 cursor-pointer transition-all',
          'hover:shadow-md hover:border-accent',
          isDragging && 'opacity-40 cursor-grabbing',
          task.completed && 'opacity-60'
        )}
      >
        <div className="flex items-start gap-2 mb-2">
          <Checkbox
            checked={task.completed || false}
            onCheckedChange={handleToggleComplete}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5"
          />
          <h4 className={cn(
            "text-sm font-medium text-foreground leading-snug flex-1",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </h4>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {visibleLabels.map(label => (
            <Badge
              key={label.id}
              className={cn(
                getLabelColor(label.color),
                'text-xs px-1.5 py-0.5'
              )}
            >
              {label.name}
            </Badge>
          ))}
          {remainingCount > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
              +{remainingCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className={cn(
              'flex items-center gap-1',
              isOverdue(task.dueDate) && 'text-destructive font-medium'
            )}>
              <Clock size={14} weight="bold" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare size={14} weight="bold" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </div>
          )}
          
          {taskLabels.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag size={14} weight="bold" />
              <span>{taskLabels.length}</span>
            </div>
          )}
        </div>
      </div>

      {isDialogOpen && (
        <TaskDetailDialog
          task={task}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          lists={lists}
          campaigns={campaigns}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          orgId={orgId}
        />
      )}
    </>
  )
}
