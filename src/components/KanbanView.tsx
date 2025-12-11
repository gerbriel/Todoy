import { Plus, SquaresFour, Archive, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Campaign, List, Task, Label, FilterState } from '@/lib/types'
import { filterTasks } from '@/lib/helpers'
import { listsService } from '@/services/lists.service'
import { campaignsService } from '@/services/campaigns.service'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Alert, AlertDescription } from './ui/alert'
import { toast } from 'sonner'
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
  activeCampaignId,
  filters,
  orgId,
  setCampaigns,
  onNavigateBack,
}: KanbanViewProps) {
  const [selectedListId, setSelectedListId] = useState<string | null>(null)

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
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {campaign.title}
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
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
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {displayLists
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
                onOpenStageView={() => setSelectedListId(list.id)}
                orgId={orgId}
              />
            ))}
          
          <div className="flex-shrink-0">
            <Button
              onClick={handleCreateList}
              variant="outline"
              className="h-full min-h-[100px] whitespace-nowrap"
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
