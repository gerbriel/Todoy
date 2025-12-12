import { Plus, SquaresFour, Archive, ArrowCounterClockwise, CalendarBlank } from '@phosphor-icons/react'
import { Campaign, List, Task, Label, FilterState, Project } from '@/lib/types'
import { filterTasks, formatDate } from '@/lib/helpers'
import { listsService } from '@/services/lists.service'
import { campaignsService } from '@/services/campaigns.service'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Alert, AlertDescription } from './ui/alert'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import TaskList from './TaskList'
import EmptyState from './EmptyState'
import StageView from './StageView'
import { useState } from 'react'

interface KanbanViewProps {
  campaigns: Campaign[]
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  projects: Project[]
  activeCampaignId: string | null
  filters: FilterState
  orgId: string
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  onNavigateBack?: () => void
}

export default function KanbanView({
  campaigns,
  lists,
  setLists,
  tasks,
  setTasks,
  labels,
  setLabels,
  projects,
  activeCampaignId,
  filters,
  orgId,
  setCampaigns,
  onNavigateBack,
}: KanbanViewProps) {
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [draggedListId, setDraggedListId] = useState<string | null>(null)
  const [dragOverListId, setDragOverListId] = useState<string | null>(null)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleStartEditing = (campaignId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCampaignId(campaignId)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = async (campaignId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Campaign title cannot be empty')
      return
    }

    try {
      await campaignsService.update(campaignId, { title: editingTitle })
      setCampaigns(prev => prev.map(c => 
        c.id === campaignId ? { ...c, title: editingTitle } : c
      ))
      setEditingCampaignId(null)
      toast.success('Campaign renamed')
    } catch (error) {
      console.error('Error renaming campaign:', error)
      toast.error('Failed to rename campaign')
    }
  }

  const handleCancelEdit = () => {
    setEditingCampaignId(null)
    setEditingTitle('')
  }

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId)

  const handleRestoreCampaign = async () => {
    if (!activeCampaign) return

    try {
      await campaignsService.update(activeCampaign.id, { archived: false })
      toast.success('Campaign restored')
      if (onNavigateBack) {
        onNavigateBack()
      }
    } catch (error) {
      console.error('Error restoring campaign:', error)
      toast.error('Failed to restore campaign')
    }
  }

  const handleCreateList = async () => {
    if (!activeCampaignId) return
    
    try {
      const newList = await listsService.create({
        title: 'New List',
        campaignId: activeCampaignId,
        order: lists.filter(l => l.campaignId === activeCampaignId).length,
      })
      // Optimistically update local state
      setLists(prev => [...prev, newList])
      toast.success('List created')
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error('Failed to create list')
    }
  }

  const handleListDragStart = (listId: string) => {
    setDraggedListId(listId)
  }

  const handleListDragOver = (e: React.DragEvent, listId: string) => {
    e.preventDefault()
    if (draggedListId && draggedListId !== listId) {
      setDragOverListId(listId)
    }
  }

  const handleListDrop = async (e: React.DragEvent, targetListId: string) => {
    e.preventDefault()
    if (!draggedListId || draggedListId === targetListId) {
      setDraggedListId(null)
      setDragOverListId(null)
      return
    }

    const draggedList = displayLists.find(l => l.id === draggedListId)
    const targetList = displayLists.find(l => l.id === targetListId)
    
    if (!draggedList || !targetList) {
      setDraggedListId(null)
      setDragOverListId(null)
      return
    }

    // Reorder lists
    const sortedLists = [...displayLists].sort((a, b) => a.order - b.order)
    const draggedIndex = sortedLists.findIndex(l => l.id === draggedListId)
    const targetIndex = sortedLists.findIndex(l => l.id === targetListId)

    // Remove dragged list and insert at target position
    sortedLists.splice(draggedIndex, 1)
    sortedLists.splice(targetIndex, 0, draggedList)

    // Update orders
    const updatedLists = sortedLists.map((list, index) => ({
      ...list,
      order: index
    }))

    // Optimistically update local state
    setLists(prev => prev.map(list => {
      const updated = updatedLists.find(ul => ul.id === list.id)
      return updated ? { ...list, order: updated.order } : list
    }))

    setDraggedListId(null)
    setDragOverListId(null)

    // Update in database
    try {
      await Promise.all(
        updatedLists.map(list => 
          listsService.update(list.id, { order: list.order })
        )
      )
    } catch (error) {
      console.error('Error reordering lists:', error)
      toast.error('Failed to reorder lists')
    }
  }

  const displayCampaigns = filters.showAllCampaigns 
    ? campaigns 
    : campaigns.filter(c => c.id === activeCampaignId)

  const displayLists = filters.showAllCampaigns
    ? lists
    : lists.filter(l => l.campaignId === activeCampaignId)

  const filteredTasks = filterTasks(tasks, campaigns, labels, filters)

  // Show stage view if a list is selected
  if (selectedListId) {
    const selectedList = lists.find(l => l.id === selectedListId)
    if (selectedList) {
      return (
        <StageView
          list={selectedList}
          lists={lists}
          setLists={setLists}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          campaigns={campaigns}
          projects={projects}
          onBack={() => setSelectedListId(null)}
          orgId={orgId}
        />
      )
    }
  }

  if (!activeCampaignId && !filters.showAllCampaigns) {
    return (
      <EmptyState
        title="No campaign selected"
        description="Select a campaign from the sidebar or create a new one to get started"
      />
    )
  }

  if (filters.showAllCampaigns && campaigns.length === 0) {
    return (
      <EmptyState
        title="No campaigns yet"
        description="Create your first campaign to start organizing your work"
      />
    )
  }

  if (!filters.showAllCampaigns && displayLists.length === 0) {
    return (
      <div className="h-full overflow-auto p-6">
        {activeCampaign?.archived && (
          <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <Archive className="h-4 w-4 text-orange-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-orange-900 dark:text-orange-100">
                This campaign is archived. Restore it to make it active again.
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRestoreCampaign}
                className="ml-4 border-orange-600 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900"
              >
                <ArrowCounterClockwise size={16} className="mr-2" weight="bold" />
                Restore Campaign
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No lists yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first list to organize tasks
            </p>
            {!activeCampaign?.archived && (
              <Button onClick={handleCreateList}>
                <Plus size={16} weight="bold" />
                Add List
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (filters.showAllCampaigns) {
    const groupedByCampaign = displayCampaigns.map(campaign => {
      const campaignLists = displayLists.filter(l => l.campaignId === campaign.id)
      return { campaign, lists: campaignLists }
    }).filter(group => group.lists.length > 0)

    return (
      <ScrollArea className="h-full">
        <div className="p-6 space-y-8">
          {groupedByCampaign.map(({ campaign, lists: campaignLists }) => (
            <div key={campaign.id}>
              <div className="mb-4">
                {editingCampaignId === campaign.id ? (
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(campaign.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit(campaign.id)
                      } else if (e.key === 'Escape') {
                        handleCancelEdit()
                      }
                      e.stopPropagation()
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    className="text-lg font-semibold mb-1"
                  />
                ) : (
                  <h3 
                    className={cn(
                      "text-lg font-semibold text-foreground cursor-text",
                      "hover:text-primary transition-colors"
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => handleStartEditing(campaign.id, campaign.title, e)}
                  >
                    {campaign.title}
                  </h3>
                )}
                {(campaign.launchDate || campaign.endDate) && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    {campaign.launchDate && (
                      <div className="flex items-center gap-1">
                        <CalendarBlank size={14} weight="duotone" />
                        <span>Launch: {formatDate(campaign.launchDate)}</span>
                      </div>
                    )}
                    {campaign.endDate && (
                      <div className="flex items-center gap-1">
                        <CalendarBlank size={14} weight="duotone" />
                        <span>End: {formatDate(campaign.endDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col md:flex-row gap-4 md:overflow-x-auto md:overflow-y-visible pb-4 md:snap-x md:snap-mandatory">
                {campaignLists
                  .sort((a, b) => a.order - b.order)
                  .map(list => (
                    <TaskList
                      key={list.id}
                      list={list}
                      lists={lists}
                      setLists={setLists}
                      tasks={filteredTasks}
                      setTasks={setTasks}
                      labels={labels}
                      setLabels={setLabels}
                      campaigns={campaigns}
                      projects={projects}
                      onOpenStageView={() => setSelectedListId(list.id)}
                      orgId={orgId}
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
      <div className="h-full p-6">
        {activeCampaign?.archived && (
          <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <Archive className="h-4 w-4 text-orange-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-orange-900 dark:text-orange-100">
                This campaign is archived. Restore it to make it active again.
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRestoreCampaign}
                className="ml-4 border-orange-600 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900"
              >
                <ArrowCounterClockwise size={16} className="mr-2" weight="bold" />
                Restore Campaign
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {activeCampaign && (
          <div className="mb-6">
            {editingCampaignId === activeCampaign.id ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleSaveEdit(activeCampaign.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveEdit(activeCampaign.id)
                  } else if (e.key === 'Escape') {
                    handleCancelEdit()
                  }
                  e.stopPropagation()
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="text-2xl font-bold mb-2"
              />
            ) : (
              <h2 
                className={cn(
                  "text-2xl font-bold text-foreground mb-2 cursor-text",
                  "hover:text-primary transition-colors"
                )}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => handleStartEditing(activeCampaign.id, activeCampaign.title, e)}
              >
                {activeCampaign.title}
              </h2>
            )}
            {(activeCampaign.launchDate || activeCampaign.endDate || activeCampaign.description) && (
              <div className="space-y-2">
                {activeCampaign.description && (
                  <p className="text-sm text-muted-foreground">{activeCampaign.description}</p>
                )}
                {(activeCampaign.launchDate || activeCampaign.endDate) && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {activeCampaign.launchDate && (
                      <div className="flex items-center gap-1.5">
                        <CalendarBlank size={14} weight="duotone" />
                        <span>Launch: {formatDate(activeCampaign.launchDate)}</span>
                      </div>
                    )}
                    {activeCampaign.endDate && (
                      <div className="flex items-center gap-1.5">
                        <CalendarBlank size={14} weight="duotone" />
                        <span>End: {formatDate(activeCampaign.endDate)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4 h-full md:overflow-x-auto md:overflow-y-visible pb-4 md:snap-x md:snap-mandatory">
          {displayLists
            .sort((a, b) => a.order - b.order)
            .map(list => (
              <div
                key={list.id}
                draggable
                onDragStart={() => handleListDragStart(list.id)}
                onDragOver={(e) => handleListDragOver(e, list.id)}
                onDrop={(e) => handleListDrop(e, list.id)}
                onDragEnd={() => {
                  setDraggedListId(null)
                  setDragOverListId(null)
                }}
                className={`transition-all ${dragOverListId === list.id && draggedListId !== list.id ? 'scale-105' : ''} ${draggedListId === list.id ? 'opacity-50' : ''}`}
              >
                <TaskList
                  list={list}
                  lists={lists}
                  setLists={setLists}
                  tasks={filteredTasks}
                  setTasks={setTasks}
                  labels={labels}
                  setLabels={setLabels}
                  campaigns={campaigns}
                  projects={projects}
                  onOpenStageView={() => setSelectedListId(list.id)}
                  orgId={orgId}
                />
              </div>
            ))}
          
          <div className="flex-shrink-0 w-full md:w-auto">
            <Button
              onClick={handleCreateList}
              variant="outline"
              className="h-full min-h-[100px] w-full whitespace-nowrap"
            >
              <Plus size={16} weight="bold" />
              Add List
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
