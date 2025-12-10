import { useState } from 'react'
import { Plus, Kanban, CaretDown, CaretRight, Folder, Target, DotsThreeVertical } from '@phosphor-icons/react'
import { Board, FilterState } from '@/lib/types'
import { generateId, getRootProjects, getStandaloneBoards, getChildBoards, getCampaignStageLabel } from '@/lib/helpers'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

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
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createType, setCreateType] = useState<'project' | 'campaign' | 'board'>('project')
  const [createParentId, setCreateParentId] = useState<string | undefined>()
  const [newTitle, setNewTitle] = useState('')

  const rootProjects = getRootProjects(boards)
  const standaloneBoards = getStandaloneBoards(boards)

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  const handleCreateNew = (type: 'project' | 'campaign' | 'board', parentId?: string) => {
    setCreateType(type)
    setCreateParentId(parentId)
    setNewTitle('')
    setShowCreateDialog(true)
  }

  const handleCreate = () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a title')
      return
    }

    const newBoard: Board = {
      id: generateId(),
      title: newTitle.trim(),
      description: '',
      order: boards.length,
      createdAt: new Date().toISOString(),
      type: createType,
      parentId: createParentId,
      ...(createType === 'campaign' && {
        campaignType: 'other',
        campaignStage: 'planning',
      }),
    }
    
    setBoards(currentBoards => [...currentBoards, newBoard])
    setActiveBoardId(newBoard.id)
    setShowCreateDialog(false)
    
    if (createParentId) {
      setExpandedProjects(prev => new Set(prev).add(createParentId))
    }
    
    toast.success(`${createType === 'project' ? 'Project' : createType === 'campaign' ? 'Campaign' : 'Board'} created`)
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

  const renderBoardItem = (board: Board, depth: number = 0) => {
    const isActive = activeBoardId === board.id && !filters.showAllBoards
    const hasChildren = board.type !== 'board' && getChildBoards(boards, board.id).length > 0
    const isExpanded = expandedProjects.has(board.id)

    return (
      <div key={board.id}>
        <div className="flex items-center gap-1 group">
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleProject(board.id)
              }}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <CaretDown size={14} weight="bold" />
              ) : (
                <CaretRight size={14} weight="bold" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}
          
          <button
            onClick={() => {
              setActiveBoardId(board.id)
              setFilters({ ...filters, showAllBoards: false })
            }}
            className={cn(
              'flex-1 text-left px-2 py-1.5 rounded text-sm transition-colors truncate flex items-center gap-2',
              isActive
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-foreground hover:bg-muted'
            )}
            title={board.title}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {board.type === 'project' && <Folder size={14} weight="duotone" />}
            {board.type === 'campaign' && <Target size={14} weight="duotone" />}
            <span className="flex-1 truncate">{board.title}</span>
            {board.campaignStage && (
              <span className="text-[10px] opacity-60 uppercase tracking-wide">
                {getCampaignStageLabel(board.campaignStage).slice(0, 3)}
              </span>
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <DotsThreeVertical size={14} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {board.type === 'project' && (
                <>
                  <DropdownMenuItem onClick={() => handleCreateNew('campaign', board.id)}>
                    <Plus size={14} className="mr-2" />
                    Add Campaign
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {board.type === 'campaign' && (
                <>
                  <DropdownMenuItem onClick={() => handleCreateNew('board', board.id)}>
                    <Plus size={14} className="mr-2" />
                    Add Board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (confirm(`Delete ${board.title}?`)) {
                    setBoards(currentBoards => currentBoards.filter(b => b.id !== board.id && b.parentId !== board.id))
                    if (activeBoardId === board.id) setActiveBoardId(null)
                    toast.success('Deleted')
                  }
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-3">
            {getChildBoards(boards, board.id).map(child => renderBoardItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <aside className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Kanban className="text-primary" size={24} weight="duotone" />
            <h1 className="text-lg font-semibold text-foreground">Marketing</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleCreateNew('project')}
              className="flex-1"
              size="sm"
            >
              <Plus size={14} weight="bold" />
              Project
            </Button>
            <Button
              onClick={() => handleCreateNew('board')}
              variant="outline"
              size="sm"
            >
              <Plus size={14} weight="bold" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            <button
              onClick={handleToggleAllBoards}
              className={cn(
                'w-full text-left px-3 py-2 rounded text-sm font-medium transition-colors mb-3',
                filters.showAllBoards
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              All Boards
            </button>
            
            {rootProjects.length > 0 && (
              <div className="mb-4">
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Projects
                </div>
                <div className="space-y-0.5">
                  {rootProjects.map(project => renderBoardItem(project))}
                </div>
              </div>
            )}

            {standaloneBoards.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Boards
                </div>
                <div className="space-y-0.5">
                  {standaloneBoards.map(board => renderBoardItem(board))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'project' ? 'Project' : createType === 'campaign' ? 'Campaign' : 'Board'}
            </DialogTitle>
            <DialogDescription>
              {createType === 'project' && 'Projects contain campaigns and help organize your marketing initiatives.'}
              {createType === 'campaign' && 'Campaigns track specific marketing activities like webinars or trade shows.'}
              {createType === 'board' && 'Boards contain lists and cards for task management.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`Enter ${createType} name...`}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
