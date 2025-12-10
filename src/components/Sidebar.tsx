import { Plus, Kanban } from '@phosphor-icons/react'
import { Board, FilterState } from '@/lib/types'
import { generateId } from '@/lib/helpers'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SidebarProps {
  boards: Board[]
  setBoards: (updater: (boards: Board[]) => Board[]) => void
  activeBoardId: string | null
  setActiveBoardId: (id: string | null) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

export default function Sidebar({
  boards,
  setBoards,
  activeBoardId,
  setActiveBoardId,
  filters,
  setFilters,
}: SidebarProps) {
  const handleCreateBoard = () => {
    const newBoard: Board = {
      id: generateId(),
      title: 'New Board',
      description: '',
      order: boards.length,
      createdAt: new Date().toISOString(),
    }
    
    setBoards(currentBoards => [...currentBoards, newBoard])
    setActiveBoardId(newBoard.id)
    toast.success('Board created')
  }

  const handleToggleAllBoards = () => {
    const newShowAll = !filters.showAllBoards
    setFilters({
      ...filters,
      showAllBoards: newShowAll,
    })
    if (newShowAll) {
      setActiveBoardId(null)
    }
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <Kanban className="text-primary" size={24} weight="duotone" />
          <h1 className="text-lg font-semibold text-foreground">Boards</h1>
        </div>
        
        <Button
          onClick={handleCreateBoard}
          className="w-full"
          size="sm"
        >
          <Plus size={16} weight="bold" />
          New Board
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <button
            onClick={handleToggleAllBoards}
            className={cn(
              'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors mb-1',
              filters.showAllBoards
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-muted'
            )}
          >
            All Boards
          </button>
          
          <div className="mt-2 space-y-1">
            {boards.map(board => (
              <button
                key={board.id}
                onClick={() => {
                  setActiveBoardId(board.id)
                  setFilters({ ...filters, showAllBoards: false })
                }}
                className={cn(
                  'w-full text-left px-3 py-2 rounded text-sm transition-colors truncate',
                  activeBoardId === board.id && !filters.showAllBoards
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground hover:bg-muted'
                )}
                title={board.title}
              >
                {board.title}
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
