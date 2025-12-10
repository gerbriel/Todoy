import { Plus } from '@phosphor-icons/react'
import { Board, List, Card, Label, FilterState } from '@/lib/types'
import { generateId, filterCards } from '@/lib/helpers'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import KanbanList from './KanbanList'
import EmptyState from './EmptyState'

interface KanbanViewProps {
  boards: Board[]
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  cards: Card[]
  setCards: (updater: (cards: Card[]) => Card[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  activeBoardId: string | null
  filters: FilterState
}

export default function KanbanView({
  boards,
  lists,
  setLists,
  cards,
  setCards,
  labels,
  setLabels,
  activeBoardId,
  filters,
}: KanbanViewProps) {
  const handleCreateList = () => {
    if (!activeBoardId) return
    
    const newList: List = {
      id: generateId(),
      title: 'New List',
      boardId: activeBoardId,
      order: lists.filter(l => l.boardId === activeBoardId).length,
      cardIds: [],
    }
    
    setLists(currentLists => [...currentLists, newList])
    toast.success('List created')
  }

  const displayBoards = filters.showAllBoards 
    ? boards 
    : boards.filter(b => b.id === activeBoardId)

  const displayLists = filters.showAllBoards
    ? lists
    : lists.filter(l => l.boardId === activeBoardId)

  const filteredCards = filterCards(cards, boards, labels, filters)

  if (!activeBoardId && !filters.showAllBoards) {
    return (
      <EmptyState
        title="No board selected"
        description="Select a board from the sidebar or create a new one to get started"
      />
    )
  }

  if (filters.showAllBoards && boards.length === 0) {
    return (
      <EmptyState
        title="No boards yet"
        description="Create your first board to start organizing your work"
      />
    )
  }

  if (!filters.showAllBoards && displayLists.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No lists yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first list to organize cards
          </p>
          <Button onClick={handleCreateList}>
            <Plus size={16} weight="bold" />
            Add List
          </Button>
        </div>
      </div>
    )
  }

  if (filters.showAllBoards) {
    const groupedByBoard = displayBoards.map(board => {
      const boardLists = displayLists.filter(l => l.boardId === board.id)
      return { board, lists: boardLists }
    }).filter(group => group.lists.length > 0)

    if (groupedByBoard.length === 0) {
      return (
        <EmptyState
          title="No lists in any board"
          description="Create lists in your boards to start adding cards"
        />
      )
    }

    return (
      <ScrollArea className="h-full">
        <div className="p-6 space-y-8">
          {groupedByBoard.map(({ board, lists: boardLists }) => (
            <div key={board.id} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                {board.title}
              </h3>
              <div className="flex gap-4 pb-4">
                {boardLists
                  .sort((a, b) => a.order - b.order)
                  .map(list => (
                    <KanbanList
                      key={list.id}
                      list={list}
                      lists={lists}
                      setLists={setLists}
                      cards={filteredCards.filter(c => c.listId === list.id)}
                      setCards={setCards}
                      labels={labels}
                      setLabels={setLabels}
                      boards={boards}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex gap-4 p-6 h-full">
        {displayLists
          .sort((a, b) => a.order - b.order)
          .map(list => (
            <KanbanList
              key={list.id}
              list={list}
              lists={lists}
              setLists={setLists}
              cards={filteredCards.filter(c => c.listId === list.id)}
              setCards={setCards}
              labels={labels}
              setLabels={setLabels}
              boards={boards}
            />
          ))}
        
        <div className="flex-shrink-0">
          <Button
            onClick={handleCreateList}
            variant="outline"
            className="h-auto min-h-[100px] min-w-[280px] border-dashed"
          >
            <Plus size={20} weight="bold" />
            Add List
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
