import { CalendarBlank, Columns, FunnelSimple, MagnifyingGlass, DotsThreeVertical } from '@phosphor-icons/react'
import { Board, ViewMode, FilterState } from '@/lib/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface HeaderProps {
  activeBoard?: Board
  boards: Board[]
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  showFilterPanel: boolean
  setShowFilterPanel: (show: boolean) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
}

export default function Header({
  activeBoard,
  boards,
  viewMode,
  setViewMode,
  showFilterPanel,
  setShowFilterPanel,
  filters,
  setFilters,
}: HeaderProps) {
  const activeFilterCount = 
    filters.boardIds.length + 
    filters.labelIds.length + 
    (filters.searchText ? 1 : 0) +
    (filters.dateRange ? 1 : 0)

  const boardTitle = filters.showAllBoards 
    ? 'All Boards' 
    : activeBoard?.title || 'Select a board'

  return (
    <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-xl font-semibold text-foreground">
          {boardTitle}
        </h2>
        
        {activeBoard && !filters.showAllBoards && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <DotsThreeVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Edit Board</DropdownMenuItem>
              <DropdownMenuItem>Archive Board</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Delete Board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <MagnifyingGlass 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            size={16} 
          />
          <Input
            type="text"
            placeholder="Search cards..."
            value={filters.searchText}
            onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
            className="pl-9 w-64"
          />
        </div>
        
        <div className="flex items-center gap-1 border border-border rounded-md p-1">
          <Button
            variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className={cn(viewMode === 'kanban' && 'bg-accent text-accent-foreground')}
          >
            <Columns size={16} />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={cn(viewMode === 'calendar' && 'bg-accent text-accent-foreground')}
          >
            <CalendarBlank size={16} />
            Calendar
          </Button>
        </div>
        
        <Button
          variant={showFilterPanel ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="relative"
        >
          <FunnelSimple size={16} />
          Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="default" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  )
}
