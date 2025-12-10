import { useState } from 'react'
import { Plus, DotsThreeVertical } from '@phosphor-icons/react'
import { List, Card, Label, Board } from '@/lib/types'
import { generateId } from '@/lib/helpers'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { toast } from 'sonner'
import KanbanCard from './KanbanCard'

interface KanbanListProps {
  list: List
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  cards: Card[]
  setCards: (updater: (cards: Card[]) => Card[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  boards: Board[]
}

export default function KanbanList({
  list,
  lists,
  setLists,
  cards,
  setCards,
  labels,
  setLabels,
  boards,
}: KanbanListProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')

  const handleUpdateTitle = () => {
    if (title.trim()) {
      setLists(currentLists =>
        currentLists.map(l =>
          l.id === list.id ? { ...l, title: title.trim() } : l
        )
      )
      toast.success('List renamed')
    }
    setIsEditingTitle(false)
  }

  const handleDeleteList = () => {
    setLists(currentLists => currentLists.filter(l => l.id !== list.id))
    setCards(currentCards => currentCards.filter(c => c.listId !== list.id))
    toast.success('List deleted')
  }

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return

    const newCard: Card = {
      id: generateId(),
      title: newCardTitle.trim(),
      description: '',
      listId: list.id,
      boardId: list.boardId,
      labelIds: [],
      order: cards.length,
      createdAt: new Date().toISOString(),
    }

    setCards(currentCards => [...currentCards, newCard])
    setNewCardTitle('')
    setIsAddingCard(false)
    toast.success('Card created')
  }

  const sortedCards = [...cards].sort((a, b) => a.order - b.order)

  return (
    <div className="flex-shrink-0 w-[280px] bg-muted rounded-lg flex flex-col max-h-full">
      <div className="p-3 flex items-center justify-between gap-2 border-b border-border">
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateTitle()
              if (e.key === 'Escape') {
                setTitle(list.title)
                setIsEditingTitle(false)
              }
            }}
            autoFocus
            className="h-8 text-sm font-medium"
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-left text-sm font-medium text-foreground hover:text-accent transition-colors"
          >
            {list.title}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <DotsThreeVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              Rename List
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleDeleteList}
              className="text-destructive"
            >
              Delete List
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-2">
          {sortedCards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              cards={cards}
              setCards={setCards}
              labels={labels}
              setLabels={setLabels}
              lists={lists}
              boards={boards}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 pt-0">
        {isAddingCard ? (
          <div className="space-y-2">
            <Input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCard()
                if (e.key === 'Escape') {
                  setNewCardTitle('')
                  setIsAddingCard(false)
                }
              }}
              placeholder="Enter card title..."
              autoFocus
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard}>
                Add
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setNewCardTitle('')
                  setIsAddingCard(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddingCard(true)}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Plus size={16} weight="bold" />
            Add Card
          </Button>
        )}
      </div>
    </div>
  )
}
