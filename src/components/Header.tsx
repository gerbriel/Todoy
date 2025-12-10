import { useState, useRef, useEffect } from 'react'
import { CalendarBlank, Columns, FunnelSimple, MagnifyingGlass, DotsThreeVertical, Target, CurrencyDollar, Clock, PencilSimple } from '@phosphor-icons/react'
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
import BoardDetailDialog from './BoardDetailDialog'
import { getCampaignTypeLabel, getCampaignStageLabel, formatCurrency, getCampaignStageColor } from '@/lib/helpers'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface HeaderProps {
  activeBoard?: Board
  boards: Board[]
  setBoards: (updater: (boards: Board[]) => Board[]) => void
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
  setBoards,
  viewMode,
  setViewMode,
  showFilterPanel,
  setShowFilterPanel,
  filters,
  setFilters,
}: HeaderProps) {
  const [showBoardDialog, setShowBoardDialog] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditingTitle])
  
  const activeFilterCount = 
    filters.boardIds.length + 
    filters.labelIds.length + 
    (filters.searchText ? 1 : 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.campaignTypes?.length || 0) +
    (filters.campaignStages?.length || 0)

  const boardTitle = filters.showAllBoards 
    ? 'All Boards' 
    : activeBoard?.title || 'Select a board'

  const handleStartEdit = () => {
    if (activeBoard && !filters.showAllBoards) {
      setEditingTitle(activeBoard.title)
      setIsEditingTitle(true)
    }
  }

  const handleSaveEdit = () => {
    if (!editingTitle.trim() || !activeBoard) {
      toast.error('Title cannot be empty')
      setIsEditingTitle(false)
      return
    }
    
    setBoards(currentBoards =>
      currentBoards.map(b =>
        b.id === activeBoard.id ? { ...b, title: editingTitle.trim() } : b
      )
    )
    setIsEditingTitle(false)
    toast.success('Renamed')
  }

  return (
    <>
      <header className="border-b border-border bg-card">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {isEditingTitle && activeBoard ? (
              <Input
                ref={inputRef}
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit()
                  } else if (e.key === 'Escape') {
                    setIsEditingTitle(false)
                  }
                }}
                onBlur={handleSaveEdit}
                className="text-xl font-semibold h-9 max-w-md"
              />
            ) : (
              <button
                onClick={handleStartEdit}
                className={cn(
                  'text-xl font-semibold text-foreground',
                  activeBoard && !filters.showAllBoards && 'hover:text-accent transition-colors'
                )}
                disabled={!activeBoard || filters.showAllBoards}
              >
                {boardTitle}
              </button>
            )}
            
            {activeBoard && !filters.showAllBoards && (
              <>
                {activeBoard.type === 'campaign' && activeBoard.campaignStage && (
                  <Badge className={cn('text-xs border', getCampaignStageColor(activeBoard.campaignStage))}>
                    {getCampaignStageLabel(activeBoard.campaignStage)}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <DotsThreeVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={handleStartEdit}>
                      <PencilSimple size={14} className="mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowBoardDialog(true)}>
                      Edit {activeBoard.type === 'project' ? 'Project' : activeBoard.type === 'campaign' ? 'Campaign' : 'Board'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete ${activeBoard.title}?`)) {
                          setBoards(currentBoards => currentBoards.filter(b => b.id !== activeBoard.id))
                        }
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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
        </div>

        {activeBoard && !filters.showAllBoards && (
          <div className="px-6 py-2 border-t border-border bg-muted/30 flex items-center gap-6 text-sm">
            {activeBoard.type === 'campaign' && activeBoard.campaignType && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Target size={14} />
                <span>{getCampaignTypeLabel(activeBoard.campaignType)}</span>
              </div>
            )}
            
            {activeBoard.budget && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CurrencyDollar size={14} />
                <span>
                  {formatCurrency(activeBoard.actualSpend || 0)} / {formatCurrency(activeBoard.budget)}
                </span>
                {activeBoard.budget > 0 && activeBoard.actualSpend && (
                  <span className="text-xs">
                    ({Math.round((activeBoard.actualSpend / activeBoard.budget) * 100)}%)
                  </span>
                )}
              </div>
            )}
            
            {activeBoard.launchDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock size={14} />
                <span>Launch: {format(new Date(activeBoard.launchDate), 'MMM d, yyyy')}</span>
              </div>
            )}
            
            {activeBoard.goals && (
              <div className="flex-1 truncate text-muted-foreground">
                <span className="font-medium">Goals:</span> {activeBoard.goals}
              </div>
            )}
          </div>
        )}
      </header>

      {activeBoard && (
        <BoardDetailDialog
          board={activeBoard}
          boards={boards}
          setBoards={setBoards}
          isOpen={showBoardDialog}
          onClose={() => setShowBoardDialog(false)}
        />
      )}
    </>
  )
}
