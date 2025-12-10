import { useState, DragEvent } from 'react'
import { Plus, DotsThreeVertical, DotsSixVertical } from '@phosphor-icons/react'
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
import { cn } from '@/lib/utils'

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
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isDraggingList, setIsDraggingList] = useState(false)
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null)

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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const cardId = e.dataTransfer.types.includes('text/plain') ? e.dataTransfer.getData('cardId') : null
    if (cardId) {
      setIsDraggingOver(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    setDragOverCardId(null)

    const cardId = e.dataTransfer.getData('cardId')
    const sourceListId = e.dataTransfer.getData('sourceListId')

    if (!cardId) return

    setCards(currentCards => {
      const cardToMove = currentCards.find(c => c.id === cardId)
      if (!cardToMove) return currentCards

      if (sourceListId === list.id) {
        return currentCards
      }

      const targetListCards = currentCards.filter(c => c.listId === list.id && c.id !== cardId)
      const newOrder = targetListCards.length

      return currentCards.map(c =>
        c.id === cardId
          ? { ...c, listId: list.id, boardId: list.boardId, order: newOrder }
          : c
      )
    })

    toast.success('Card moved')
  }

  const handleCardDragOver = (cardId: string) => {
    setDragOverCardId(cardId)
  }

  const handleCardDrop = (e: DragEvent<HTMLDivElement>, targetCardId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    setDragOverCardId(null)

    const draggedCardId = e.dataTransfer.getData('cardId')
    const sourceListId = e.dataTransfer.getData('sourceListId')

    if (!draggedCardId || draggedCardId === targetCardId) return

    setCards(currentCards => {
      const draggedCard = currentCards.find(c => c.id === draggedCardId)
      const targetCard = currentCards.find(c => c.id === targetCardId)
      
      if (!draggedCard || !targetCard) return currentCards

      if (sourceListId === list.id) {
        const listCards = currentCards
          .filter(c => c.listId === list.id)
          .sort((a, b) => a.order - b.order)

        const draggedIndex = listCards.findIndex(c => c.id === draggedCardId)
        const targetIndex = listCards.findIndex(c => c.id === targetCardId)

        if (draggedIndex === targetIndex) return currentCards

        const reorderedCards = [...listCards]
        const [movedCard] = reorderedCards.splice(draggedIndex, 1)
        reorderedCards.splice(targetIndex, 0, movedCard)

        const updatedCards = reorderedCards.map((c, index) => ({
          ...c,
          order: index,
        }))

        return currentCards.map(c => {
          const updated = updatedCards.find(uc => uc.id === c.id)
          return updated || c
        })
      } else {
        const listCards = currentCards
          .filter(c => c.listId === list.id)
          .sort((a, b) => a.order - b.order)

        const targetIndex = listCards.findIndex(c => c.id === targetCardId)

        const otherCards = listCards.filter(c => c.id !== draggedCardId)
        otherCards.splice(targetIndex, 0, { ...draggedCard, listId: list.id, boardId: list.boardId })

        const updatedCards = otherCards.map((c, index) => ({
          ...c,
          order: index,
          listId: list.id,
          boardId: list.boardId,
        }))

        return currentCards.map(c => {
          const updated = updatedCards.find(uc => uc.id === c.id)
          return updated || c
        })
      }
    })

    toast.success('Card moved')
  }

  const handleListDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setIsDraggingList(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('listId', list.id)
    e.dataTransfer.setData('listBoardId', list.boardId)
  }

  const handleListDragEnd = () => {
    setIsDraggingList(false)
  }

  const handleListDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const listId = e.dataTransfer.types.includes('text/plain') ? null : e.dataTransfer.getData('listId')
    if (listId && listId !== list.id) {
      e.dataTransfer.dropEffect = 'move'
    }
  }

  const handleListDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const draggedListId = e.dataTransfer.getData('listId')
    const draggedListBoardId = e.dataTransfer.getData('listBoardId')

    if (!draggedListId || draggedListId === list.id || draggedListBoardId !== list.boardId) return

    setLists(currentLists => {
      const draggedList = currentLists.find(l => l.id === draggedListId)
      const targetList = currentLists.find(l => l.id === list.id)
      
      if (!draggedList || !targetList) return currentLists

      const boardLists = currentLists
        .filter(l => l.boardId === list.boardId)
        .sort((a, b) => a.order - b.order)

      const draggedIndex = boardLists.findIndex(l => l.id === draggedListId)
      const targetIndex = boardLists.findIndex(l => l.id === list.id)

      if (draggedIndex === targetIndex) return currentLists

      const reorderedLists = [...boardLists]
      const [movedList] = reorderedLists.splice(draggedIndex, 1)
      reorderedLists.splice(targetIndex, 0, movedList)

      const updatedLists = reorderedLists.map((l, index) => ({
        ...l,
        order: index,
      }))

      return currentLists.map(l => {
        const updated = updatedLists.find(ul => ul.id === l.id)
        return updated || l
      })
    })

    toast.success('List reordered')
  }

  const sortedCards = [...cards].sort((a, b) => a.order - b.order)

  return (
    <div
      draggable
      onDragStart={handleListDragStart}
      onDragEnd={handleListDragEnd}
      onDragOver={handleListDragOver}
      onDrop={handleListDrop}
      className={cn(
        "flex-shrink-0 w-[280px] bg-muted rounded-lg flex flex-col max-h-full transition-all",
        isDraggingList && "opacity-40 cursor-grabbing",
        isDraggingOver && "ring-2 ring-accent"
      )}
    >
      <div
        className="p-3 flex items-center justify-between gap-2 border-b border-border cursor-grab active:cursor-grabbing"
        onDragStart={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 flex-1">
          <DotsSixVertical size={16} className="text-muted-foreground" weight="bold" />
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
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex-1 text-left text-sm font-medium text-foreground hover:text-accent transition-colors"
            >
              {list.title}
            </button>
          )}
        </div>

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

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex-1 overflow-hidden"
      >
        <ScrollArea className="h-full p-3">
          <div className="space-y-2">
            {sortedCards.map((card, index) => (
              <div
                key={card.id}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleCardDragOver(card.id)
                }}
                onDrop={(e) => handleCardDrop(e, card.id)}
                className={cn(
                  "transition-all",
                  dragOverCardId === card.id && "border-t-2 border-accent pt-2"
                )}
              >
                <KanbanCard
                  card={card}
                  cards={cards}
                  setCards={setCards}
                  labels={labels}
                  setLabels={setLabels}
                  lists={lists}
                  boards={boards}
                  onDragOver={() => handleCardDragOver(card.id)}
                />
              </div>
            ))}
            {sortedCards.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Drop cards here or add a new card
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

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
