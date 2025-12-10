import { X } from '@phosphor-icons/react'
import { Board, Label, FilterState } from '@/lib/types'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'
import { Label as UILabel } from './ui/label'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { getLabelColor } from '@/lib/helpers'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
  boards: Board[]
  labels: Label[]
  filters: FilterState
  setFilters: (filters: FilterState) => void
  onClose: () => void
}

export default function FilterPanel({
  boards,
  labels,
  filters,
  setFilters,
  onClose,
}: FilterPanelProps) {
  const toggleBoard = (boardId: string) => {
    const newBoardIds = filters.boardIds.includes(boardId)
      ? filters.boardIds.filter(id => id !== boardId)
      : [...filters.boardIds, boardId]
    setFilters({ ...filters, boardIds: newBoardIds })
  }

  const toggleLabel = (labelId: string) => {
    const newLabelIds = filters.labelIds.includes(labelId)
      ? filters.labelIds.filter(id => id !== labelId)
      : [...filters.labelIds, labelId]
    setFilters({ ...filters, labelIds: newLabelIds })
  }

  const clearFilters = () => {
    setFilters({
      boardIds: [],
      labelIds: [],
      searchText: '',
      showAllBoards: filters.showAllBoards,
    })
  }

  const hasActiveFilters = 
    filters.boardIds.length > 0 || 
    filters.labelIds.length > 0 || 
    filters.searchText !== ''

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border shadow-lg z-50 flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X size={16} />
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {filters.showAllBoards && boards.length > 0 && (
            <>
              <div>
                <UILabel className="text-sm font-medium mb-2 block">
                  Boards
                </UILabel>
                <div className="space-y-2">
                  {boards.map(board => (
                    <div key={board.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`board-${board.id}`}
                        checked={filters.boardIds.includes(board.id)}
                        onCheckedChange={() => toggleBoard(board.id)}
                      />
                      <label
                        htmlFor={`board-${board.id}`}
                        className="text-sm text-foreground cursor-pointer flex-1"
                      >
                        {board.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          {labels.length > 0 && (
            <>
              <div>
                <UILabel className="text-sm font-medium mb-2 block">
                  Labels
                </UILabel>
                <div className="space-y-2">
                  {labels.map(label => (
                    <div key={label.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`label-${label.id}`}
                        checked={filters.labelIds.includes(label.id)}
                        onCheckedChange={() => toggleLabel(label.id)}
                      />
                      <label
                        htmlFor={`label-${label.id}`}
                        className="text-sm cursor-pointer flex-1 flex items-center gap-2"
                      >
                        <span 
                          className={cn(
                            'w-3 h-3 rounded-full',
                            getLabelColor(label.color)
                          )}
                        />
                        <span className="text-foreground">{label.name}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
            </>
          )}
          
          {!hasActiveFilters && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No active filters
            </div>
          )}
        </div>
      </ScrollArea>
      
      {hasActiveFilters && (
        <div className="p-4 border-t border-border">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={clearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
