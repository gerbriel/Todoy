import { useState, DragEvent } from 'react'
import { Plus, DotsThreeVertical, PencilSimple, DotsSixVertical, ArrowsOutSimple } from '@phosphor-icons/react'
import { Task, Campaign, List, Label } from '@/lib/types'
import { tasksService } from '@/services/tasks.service'
import { listsService } from '@/services/lists.service'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import TaskCard from './TaskCard'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

interface TaskListProps {
  list: List
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  campaigns: Campaign[]
  onOpenStageView?: () => void
  orgId: string
}

export default function TaskList({
  list,
  lists,
  setLists,
  tasks,
  setTasks,
  labels,
  setLabels,
  campaigns,
  onOpenStageView,
  orgId,
}: TaskListProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(list.title)
  const [isDragOver, setIsDragOver] = useState(false)

  const listTasks = tasks
    .filter(t => t.listId === list.id)
    .sort((a, b) => a.order - b.order)

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error('Please enter a task title')
      return
    }

    try {
      await tasksService.create({
        title: newTaskTitle.trim(),
        description: '',
        listId: list.id,
        campaignId: list.campaignId,
        labelIds: [],
        order: listTasks.length,
      })
      setNewTaskTitle('')
      setIsAddingTask(false)
      toast.success('Task created')
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task')
    }
  }

  const handleSaveTitle = async () => {
    if (!editedTitle.trim()) {
      toast.error('Title cannot be empty')
      return
    }

    try {
      await listsService.update(list.id, { title: editedTitle.trim() })
      setIsEditingTitle(false)
      toast.success('List renamed')
    } catch (error) {
      console.error('Error renaming list:', error)
      toast.error('Failed to rename list')
    }
  }

  const handleDeleteList = async () => {
    if (listTasks.length > 0) {
      if (!confirm(`Delete "${list.title}" and its ${listTasks.length} task(s)?`)) {
        return
      }
    }
    
    try {
      await listsService.delete(list.id)
      toast.success('List deleted')
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Failed to delete list')
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const taskId = e.dataTransfer.getData('taskId')
    const sourceListId = e.dataTransfer.getData('sourceListId')

    if (!taskId || sourceListId === list.id) return

    try {
      await tasksService.update(taskId, { 
        listId: list.id, 
        order: listTasks.length 
      })
      toast.success('Task moved')
    } catch (error) {
      console.error('Error moving task:', error)
      toast.error('Failed to move task')
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'flex-shrink-0 w-80 bg-muted/30 border border-border rounded-lg p-4 transition-colors',
        isDragOver && 'border-accent bg-accent/10'
      )}
    >
      <div className="flex items-center justify-between mb-4 group">
        {isEditingTitle ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle()
              if (e.key === 'Escape') {
                setIsEditingTitle(false)
                setEditedTitle(list.title)
              }
            }}
            onBlur={handleSaveTitle}
            className="h-8 text-sm font-semibold"
            autoFocus
          />
        ) : (
          <>
            <h3 className="font-semibold text-foreground flex-1 truncate">
              {list.title} <span className="text-muted-foreground text-sm font-normal">({listTasks.length})</span>
            </h3>
            {onOpenStageView && (
              <button
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all mr-1"
                onClick={onOpenStageView}
                title="Open stage view"
              >
                <ArrowsOutSimple size={16} weight="bold" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all">
                  <DotsThreeVertical size={16} weight="bold" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                  <PencilSimple size={14} className="mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleDeleteList}>
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {listTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            tasks={tasks}
            setTasks={setTasks}
            labels={labels}
            setLabels={setLabels}
            lists={lists}
            campaigns={campaigns}
            orgId={orgId}
          />
        ))}
      </div>

      {isAddingTask ? (
        <div className="space-y-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateTask()
              if (e.key === 'Escape') {
                setIsAddingTask(false)
                setNewTaskTitle('')
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateTask}>
              Add Task
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAddingTask(false)
                setNewTaskTitle('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setIsAddingTask(true)}
        >
          <Plus size={16} weight="bold" />
          Add Task
        </Button>
      )}
    </div>
  )
}
