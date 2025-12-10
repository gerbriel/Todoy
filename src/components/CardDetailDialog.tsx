import { useState } from 'react'
import { X, Tag, Clock, Trash, Plus, Check } from '@phosphor-icons/react'
import { Card, Label, List, Board, LabelColor, Task } from '@/lib/types'
import { generateId, getLabelColor } from '@/lib/helpers'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label as UILabel } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { Calendar } from './ui/calendar'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CardDetailDialogProps {
  card: Card
  cards: Card[]
  setCards: (updater: (cards: Card[]) => Card[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  boards: Board[]
  isOpen: boolean
  onClose: () => void
}

const LABEL_COLORS: { color: LabelColor; name: string }[] = [
  { color: 'red', name: 'Red' },
  { color: 'orange', name: 'Orange' },
  { color: 'green', name: 'Green' },
  { color: 'purple', name: 'Purple' },
  { color: 'blue', name: 'Blue' },
  { color: 'teal', name: 'Teal' },
]

export default function CardDetailDialog({
  card,
  cards,
  setCards,
  labels,
  setLabels,
  lists,
  boards,
  isOpen,
  onClose,
}: CardDetailDialogProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description)
  const [selectedBoardId, setSelectedBoardId] = useState(card.boardId)
  const [selectedListId, setSelectedListId] = useState(card.listId)
  const [budget, setBudget] = useState(card.budget?.toString() || '')
  const [actualSpend, setActualSpend] = useState(card.actualSpend?.toString() || '')
  const [goals, setGoals] = useState(card.goals || '')
  const [showLabelCreator, setShowLabelCreator] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState<LabelColor>('blue')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [tasks, setTasks] = useState<Task[]>(card.tasks || [])

  const currentList = lists.find(l => l.id === card.listId)
  const currentBoard = boards.find(b => b.id === card.boardId)
  const selectedBoard = boards.find(b => b.id === selectedBoardId)
  const availableLists = lists.filter(l => l.boardId === selectedBoardId)

  const handleUpdate = () => {
    setCards(currentCards =>
      currentCards.map(c =>
        c.id === card.id
          ? {
              ...c,
              title: title.trim(),
              description: description.trim(),
              boardId: selectedBoardId,
              listId: selectedListId,
              budget: budget ? parseFloat(budget) : undefined,
              actualSpend: actualSpend ? parseFloat(actualSpend) : undefined,
              goals: goals.trim() || undefined,
              tasks: tasks,
            }
          : c
      )
    )
    toast.success('Card updated')
    onClose()
  }

  const handleDelete = () => {
    setCards(currentCards => currentCards.filter(c => c.id !== card.id))
    toast.success('Card deleted')
    onClose()
  }

  const handleToggleLabel = (labelId: string) => {
    setCards(currentCards =>
      currentCards.map(c => {
        if (c.id === card.id) {
          const hasLabel = c.labelIds.includes(labelId)
          return {
            ...c,
            labelIds: hasLabel
              ? c.labelIds.filter(id => id !== labelId)
              : [...c.labelIds, labelId],
          }
        }
        return c
      })
    )
  }

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return

    const newLabel: Label = {
      id: generateId(),
      name: newLabelName.trim(),
      color: newLabelColor,
    }

    setLabels(currentLabels => [...currentLabels, newLabel])
    handleToggleLabel(newLabel.id)
    setNewLabelName('')
    setShowLabelCreator(false)
    toast.success('Label created')
  }

  const handleSetDueDate = (date: Date | undefined) => {
    setCards(currentCards =>
      currentCards.map(c =>
        c.id === card.id
          ? { ...c, dueDate: date?.toISOString() }
          : c
      )
    )
    toast.success(date ? 'Due date set' : 'Due date removed')
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      completed: false,
      order: tasks.length,
      createdAt: new Date().toISOString(),
    }

    setTasks(currentTasks => [...currentTasks, newTask])
    setNewTaskTitle('')
    toast.success('Task added')
  }

  const handleToggleTask = (taskId: string) => {
    setTasks(currentTasks =>
      currentTasks.map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    )
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId))
    toast.success('Task deleted')
  }

  const completedTaskCount = tasks.filter(t => t.completed).length
  const totalTaskCount = tasks.length

  const cardLabels = labels.filter(l => card.labelIds.includes(l.id))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <UILabel htmlFor="card-title">Title</UILabel>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
            />
          </div>

          <div>
            <UILabel htmlFor="card-description">Description</UILabel>
            <Textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
            />
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <UILabel className="mb-0">Tasks</UILabel>
              {totalTaskCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {completedTaskCount} / {totalTaskCount} completed
                </span>
              )}
            </div>

            <div className="space-y-2 mb-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded border border-border hover:bg-muted/50 transition-colors group"
                >
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                      task.completed
                        ? 'bg-accent border-accent text-accent-foreground'
                        : 'border-muted-foreground hover:border-accent'
                    )}
                  >
                    {task.completed && <Check size={12} weight="bold" />}
                  </button>
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      task.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a task..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <Button size="sm" onClick={handleAddTask}>
                <Plus size={16} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel htmlFor="card-board">Board</UILabel>
              <Select 
                value={selectedBoardId} 
                onValueChange={(boardId) => {
                  setSelectedBoardId(boardId)
                  const newBoardLists = lists.filter(l => l.boardId === boardId)
                  if (newBoardLists.length > 0) {
                    setSelectedListId(newBoardLists[0].id)
                  }
                }}
              >
                <SelectTrigger id="card-board">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boards.map(board => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <UILabel htmlFor="card-list">List</UILabel>
              <Select value={selectedListId} onValueChange={setSelectedListId}>
                <SelectTrigger id="card-list">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <UILabel>Due Date</UILabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Clock size={16} />
                  {card.dueDate
                    ? new Date(card.dueDate).toLocaleDateString()
                    : 'Set due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={card.dueDate ? new Date(card.dueDate) : undefined}
                  onSelect={handleSetDueDate}
                />
                {card.dueDate && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDueDate(undefined)}
                      className="w-full"
                    >
                      Clear Date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          <div>
            <UILabel htmlFor="card-goals">Goals & Notes</UILabel>
            <Textarea
              id="card-goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Track goals, objectives, or additional notes..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <UILabel htmlFor="card-budget">Budget</UILabel>
              <Input
                id="card-budget"
                type="number"
                min="0"
                step="10"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <UILabel htmlFor="card-actual-spend">Actual Spend</UILabel>
              <Input
                id="card-actual-spend"
                type="number"
                min="0"
                step="10"
                value={actualSpend}
                onChange={(e) => setActualSpend(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <Separator />

          <div>
            <UILabel className="mb-2 block">Labels</UILabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {cardLabels.map(label => (
                <Badge
                  key={label.id}
                  className={cn(
                    'text-white cursor-pointer',
                    getLabelColor(label.color)
                  )}
                  onClick={() => handleToggleLabel(label.id)}
                >
                  {label.name}
                  <X size={12} className="ml-1" />
                </Badge>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag size={16} />
                  Add Label
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Select Label</h4>
                  <div className="space-y-1">
                    {labels.map(label => (
                      <button
                        key={label.id}
                        onClick={() => handleToggleLabel(label.id)}
                        className={cn(
                          'w-full flex items-center gap-2 p-2 rounded text-sm hover:bg-muted transition-colors',
                          card.labelIds.includes(label.id) && 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'w-4 h-4 rounded-full',
                            getLabelColor(label.color)
                          )}
                        />
                        <span className="flex-1 text-left">{label.name}</span>
                        {card.labelIds.includes(label.id) && (
                          <span className="text-xs text-muted-foreground">✓</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <Separator />

                  {!showLabelCreator ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLabelCreator(true)}
                      className="w-full"
                    >
                      Create New Label
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Label name"
                        autoFocus
                      />
                      <div className="flex gap-1 flex-wrap">
                        {LABEL_COLORS.map(({ color }) => (
                          <button
                            key={color}
                            onClick={() => setNewLabelColor(color)}
                            className={cn(
                              'w-6 h-6 rounded-full transition-transform',
                              getLabelColor(color),
                              newLabelColor === color && 'ring-2 ring-ring ring-offset-2'
                            )}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateLabel}>
                          Create
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowLabelCreator(false)
                            setNewLabelName('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground font-mono">
            Board: {currentBoard?.title} • List: {currentList?.title}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash size={16} />
              Delete Card
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
