import { useState } from 'react'
import { X, Tag, Clock, Trash } from '@phosphor-icons/react'
import { Card, Label, List, Board, LabelColor } from '@/lib/types'
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
