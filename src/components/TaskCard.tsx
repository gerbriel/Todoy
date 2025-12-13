import { useState, DragEvent, useEffect } from 'react'
import { Clock, Tag, CheckSquare } from '@phosphor-icons/react'
import { Task, Label, List, Campaign, Project } from '@/lib/types'
import { getLabelColor, formatDate, isOverdue } from '@/lib/helpers'
import { tasksService } from '@/services/tasks.service'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import TaskDetailDialog from './TaskDetailDialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface TaskCardProps {
  task: Task
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  campaigns: Campaign[]
  projects: Project[]
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
  projects,
  onDragOver,
  orgId,
}: TaskCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleCardClick = () => {
    // If we're already tracking a click timeout, clear it (this is a double-click)
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      return
    }

    // Set a timeout for single click
    const timeout = setTimeout(() => {
      setIsDialogOpen(true)
      setClickTimeout(null)
    }, 250) // 250ms delay to detect double-click

    setClickTimeout(timeout)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }
    }
  }, [clickTimeout])

  const handleStartEditingTitle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditingTitle(true)
    setEditingTitle(task.title)
  }

  const handleSaveTitleEdit = async () => {
    if (!editingTitle.trim()) {
      toast.error('Task title cannot be empty')
      return
    }

    try {
      await tasksService.update(task.id, { title: editingTitle })
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, title: editingTitle } : t
      ))
      setIsEditingTitle(false)
      toast.success('Task renamed')
    } catch (error) {
      console.error('Error renaming task:', error)
      toast.error('Failed to rename task')
    }
  }

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false)
    setEditingTitle('')
  }

  const taskLabels = labels.filter(l => task.labelIds.includes(l.id))
  const visibleLabels = taskLabels.slice(0, 3)
  const remainingCount = taskLabels.length - 3
  
  const subtasks = task.subtasks || []
  const completedSubtasks = subtasks.filter(t => t.completed).length
  const totalSubtasks = subtasks.length
  
  // Get campaign name for this task
  const taskCampaign = campaigns.find(c => c.id === task.campaignId)

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

  const handleToggleComplete = async () => {
    try {
      const newCompleted = !task.completed
      // Optimistically update local state
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: newCompleted } : t))
      await tasksService.update(task.id, { completed: newCompleted })
    } catch (error) {
      console.error('Error toggling task completion:', error)
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: task.completed } : t))
      toast.error('Failed to update task')
    }
  }

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleCardClick}
        className={cn(
          'group bg-card border border-border rounded-md p-3 transition-all cursor-pointer',
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
          {isEditingTitle ? (
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleSaveTitleEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveTitleEdit()
                } else if (e.key === 'Escape') {
                  handleCancelTitleEdit()
                }
                e.stopPropagation()
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="text-sm font-medium flex-1 h-auto py-0"
            />
          ) : (
            <h4 
              className={cn(
                "text-sm font-medium text-foreground leading-snug flex-1 cursor-text",
                "hover:text-primary transition-colors",
                task.completed && "line-through text-muted-foreground"
              )}
              onDoubleClick={handleStartEditingTitle}
            >
              {task.title}
            </h4>
          )}
        </div>

        {/* Campaign name */}
        {taskCampaign && (
          <div className="text-xs text-muted-foreground mb-2 pl-6">
            {taskCampaign.title}
          </div>
        )}

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
          projects={projects}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          orgId={orgId}
        />
      )}
    </>
  )
}
