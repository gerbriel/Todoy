import { useState } from 'react'
import { Campaign, Project, Task, StageDate } from '@/lib/types'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { 
  CaretRight, 
  CaretDown, 
  Calendar as CalendarIcon,
  Target,
  Folder,
  CheckSquare,
  Flag,
  Lightning,
  ArrowsClockwise,
  CalendarCheck,
  CalendarX
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { tasksService } from '@/services/tasks.service'
import { campaignsService } from '@/services/campaigns.service'
import { projectsService } from '@/services/projects.service'
import { toast } from 'sonner'
import { addDays } from 'date-fns'

interface UnscheduledItemsSidebarProps {
  campaigns: Campaign[]
  projects: Project[]
  tasks: Task[]
  filterMode?: 'all' | 'projects' | 'campaigns' | 'tasks'
  isCollapsed: boolean
  onToggle: () => void
  setTasks?: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  setCampaigns?: (campaigns: Campaign[] | ((prev: Campaign[]) => Campaign[])) => void
  setProjects?: (projects: Project[] | ((prev: Project[]) => Project[])) => void
  onNavigateToDate?: (date: Date) => void
}

interface DraggableItemProps {
  id: string
  type: 'campaign' | 'project' | 'task' | 'stage'
  title: string
  icon: React.ReactNode
  color?: string
  metadata?: any
  actionButton?: React.ReactNode
  onClick?: () => void
}

const DraggableItem = ({ id, type, title, icon, color, metadata, actionButton, onClick }: DraggableItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/json', JSON.stringify({
      id,
      type,
      title,
      metadata,
      fromSidebar: true
    }))
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onClick && !actionButton) {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 p-3 rounded-md min-h-[64px]",
        "hover:bg-accent transition-colors",
        "border border-transparent hover:border-border",
        onClick && !actionButton ? "cursor-pointer" : "cursor-move"
      )}
      style={{ borderLeftColor: color, borderLeftWidth: color ? 3 : 1 }}
    >
      <div className="text-muted-foreground flex-shrink-0">
        {icon}
      </div>
      <span className="text-sm flex-1 break-words leading-normal">{title}</span>
      {actionButton && (
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {actionButton}
        </div>
      )}
    </div>
  )
}

export default function UnscheduledItemsSidebar({
  campaigns,
  projects,
  tasks,
  filterMode = 'all',
  isCollapsed,
  onToggle,
  setTasks,
  setCampaigns,
  setProjects,
  onNavigateToDate
}: UnscheduledItemsSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    campaigns: true,
    projects: true,
    tasks: true,
    stages: true,
    scheduledProjects: false,
    scheduledCampaigns: false,
    scheduledTasks: false
  })
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [isAutoScheduling, setIsAutoScheduling] = useState(false)
  const [activeView, setActiveView] = useState<'unscheduled' | 'scheduled' | 'unassign'>('unscheduled')

  // Filter items without dates
  let unscheduledCampaigns = campaigns.filter(c => !c.startDate && !c.endDate)
  let unscheduledProjects = projects.filter(p => !p.startDate && !p.endDate)
  let unscheduledTasks = tasks.filter(t => !t.startDate && !t.dueDate)
  
  // Apply filterMode to unscheduled items only
  if (filterMode === 'projects') {
    unscheduledCampaigns = []
    unscheduledTasks = []
  } else if (filterMode === 'campaigns') {
    unscheduledProjects = []
    unscheduledTasks = []
  } else if (filterMode === 'tasks') {
    unscheduledProjects = []
    unscheduledCampaigns = []
  }
  // filterMode === 'all' shows everything (no additional filtering needed)
  
  // Filter items WITH dates (scheduled) - NO FILTERING, show all scheduled items
  // The UI will decide which sections to show based on filterMode
  const scheduledProjects = projects.filter(p => p.startDate && p.endDate)
  const scheduledCampaigns = campaigns.filter(c => c.startDate && c.endDate)
  const scheduledTasks = tasks.filter(t => t.startDate && t.dueDate)
  
  // Collect unscheduled stages from both campaigns and projects
  const unscheduledStages: Array<StageDate & { parentType: 'campaign' | 'project', parentTitle: string, parentId: string }> = []
  
  campaigns.forEach(campaign => {
    campaign.stageDates?.forEach(stage => {
      if (!stage.startDate && !stage.endDate) {
        unscheduledStages.push({
          ...stage,
          parentType: 'campaign',
          parentTitle: campaign.title,
          parentId: campaign.id
        })
      }
    })
  })
  
  projects.forEach(project => {
    project.stageDates?.forEach(stage => {
      if (!stage.startDate && !stage.endDate) {
        unscheduledStages.push({
          ...stage,
          parentType: 'project',
          parentTitle: project.title,
          parentId: project.id
        })
      }
    })
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId)
      } else {
        newSet.add(campaignId)
      }
      return newSet
    })
  }

  const handleAutoScheduleTasks = async () => {
    if (!setTasks) {
      toast.error('Auto-schedule function not available')
      return
    }

    setIsAutoScheduling(true)
    let scheduledCount = 0
    let skippedCount = 0

    try {
      for (const task of unscheduledTasks) {
        // Find the campaign this task belongs to
        const campaign = campaigns.find(c => c.id === task.campaignId)
        
        if (!campaign || !campaign.startDate || !campaign.endDate) {
          skippedCount++
          continue
        }

        // Schedule task at the start of the campaign with 1 day duration
        const startDate = new Date(campaign.startDate)
        const dueDate = addDays(startDate, 1)

        await tasksService.update(task.id, {
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString()
        })

        // Update local state
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === task.id
              ? { ...t, startDate: startDate.toISOString(), dueDate: dueDate.toISOString() }
              : t
          )
        )

        scheduledCount++
      }

      if (scheduledCount > 0) {
        toast.success(`Auto-scheduled ${scheduledCount} task${scheduledCount !== 1 ? 's' : ''}`)
      }
      if (skippedCount > 0) {
        toast.warning(`Skipped ${skippedCount} task${skippedCount !== 1 ? 's' : ''} (no campaign dates)`)
      }
    } catch (error) {
      console.error('Error auto-scheduling tasks:', error)
      toast.error('Failed to auto-schedule tasks')
    } finally {
      setIsAutoScheduling(false)
    }
  }

  const handleAutoScheduleTask = async (task: Task) => {
    if (!setTasks) {
      toast.error('Auto-schedule function not available')
      return
    }

    // Find the campaign this task belongs to
    const campaign = campaigns.find(c => c.id === task.campaignId)
    
    if (!task.campaignId) {
      toast.error('Task must be assigned to a campaign to auto-schedule')
      return
    }
    
    if (!campaign) {
      toast.error('Campaign not found')
      return
    }
    
    if (!campaign.startDate || !campaign.endDate) {
      toast.error('Campaign must have start and end dates assigned first')
      return
    }

    try {
      // Schedule task at the start of the campaign with 1 day duration
      const startDate = new Date(campaign.startDate)
      const dueDate = addDays(startDate, 1)

      await tasksService.update(task.id, {
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString()
      })

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id
            ? { ...t, startDate: startDate.toISOString(), dueDate: dueDate.toISOString() }
            : t
        )
      )

      toast.success(`Task scheduled to ${campaign.title}`)
    } catch (error) {
      console.error('Error auto-scheduling task:', error)
      toast.error('Failed to auto-schedule task')
    }
  }

  const handleAutoScheduleCampaignTasks = async (campaign: Campaign) => {
    if (!setTasks) {
      toast.error('Auto-schedule function not available')
      return
    }

    if (!campaign.startDate || !campaign.endDate) {
      toast.error('Campaign must have start and end dates assigned first')
      return
    }

    // Find all tasks belonging to this campaign that don't have dates
    const campaignTasks = tasks.filter(t => 
      t.campaignId === campaign.id && (!t.startDate || !t.dueDate)
    )

    if (campaignTasks.length === 0) {
      toast.info('All tasks in this campaign are already scheduled')
      return
    }

    try {
      const startDate = new Date(campaign.startDate)
      const dueDate = addDays(startDate, 1)
      const startDateISO = startDate.toISOString()
      const dueDateISO = dueDate.toISOString()

      // Update all tasks in database
      for (const task of campaignTasks) {
        await tasksService.update(task.id, {
          startDate: startDateISO,
          dueDate: dueDateISO
        })
      }

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          campaignTasks.some(ct => ct.id === t.id)
            ? { ...t, startDate: startDateISO, dueDate: dueDateISO }
            : t
        )
      )

      toast.success(`Auto-scheduled ${campaignTasks.length} task(s) to ${campaign.title}`)
    } catch (error) {
      console.error('Error auto-scheduling campaign tasks:', error)
      toast.error('Failed to auto-schedule campaign tasks')
    }
  }

  const handleReassignTask = async (task: Task) => {
    if (!setTasks) {
      toast.error('Reassign function not available')
      return
    }

    // Find the campaign this task belongs to
    const campaign = campaigns.find(c => c.id === task.campaignId)
    
    if (!task.campaignId) {
      toast.error('Task must be assigned to a campaign to reassign')
      return
    }
    
    if (!campaign) {
      toast.error('Campaign not found')
      return
    }
    
    if (!campaign.startDate || !campaign.endDate) {
      toast.error('Campaign must have start and end dates assigned first')
      return
    }

    try {
      // Reassign task to the start of the campaign with 1 day duration
      const startDate = new Date(campaign.startDate)
      const dueDate = addDays(startDate, 1)

      await tasksService.update(task.id, {
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString()
      })

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id
            ? { ...t, startDate: startDate.toISOString(), dueDate: dueDate.toISOString() }
            : t
        )
      )

      toast.success(`Task reassigned to ${campaign.title} start date`)
    } catch (error) {
      console.error('Error reassigning task:', error)
      toast.error('Failed to reassign task')
    }
  }

  const handleReassignCampaignTasks = async (campaign: Campaign) => {
    if (!setTasks) {
      toast.error('Reassign function not available')
      return
    }

    if (!campaign.startDate || !campaign.endDate) {
      toast.error('Campaign must have start and end dates assigned first')
      return
    }

    // Find all tasks belonging to this campaign that have dates
    const campaignTasks = tasks.filter(t => 
      t.campaignId === campaign.id && t.dueDate
    )

    if (campaignTasks.length === 0) {
      toast.info('No scheduled tasks found in this campaign')
      return
    }

    try {
      const startDate = new Date(campaign.startDate)
      const dueDate = addDays(startDate, 1)
      const startDateISO = startDate.toISOString()
      const dueDateISO = dueDate.toISOString()

      // Update all tasks in database
      for (const task of campaignTasks) {
        await tasksService.update(task.id, {
          startDate: startDateISO,
          dueDate: dueDateISO
        })
      }

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          campaignTasks.some(ct => ct.id === t.id)
            ? { ...t, startDate: startDateISO, dueDate: dueDateISO }
            : t
        )
      )

      toast.success(`Reassigned ${campaignTasks.length} task(s) to ${campaign.title} start date`)
    } catch (error) {
      console.error('Error reassigning campaign tasks:', error)
      toast.error('Failed to reassign campaign tasks')
    }
  }

  const handleAutoScheduleProjectCampaigns = async (project: Project) => {
    if (!setCampaigns) {
      toast.error('Auto-schedule function not available')
      return
    }

    if (!project.startDate || !project.endDate) {
      toast.error('Project must have start and end dates assigned first')
      return
    }

    // Find all campaigns belonging to this project
    const projectCampaigns = campaigns.filter(c => c.projectId === project.id)

    if (projectCampaigns.length === 0) {
      toast.info('No campaigns found in this project')
      return
    }

    try {
      const startDateISO = project.startDate
      const endDateISO = project.endDate

      // Update all campaigns in database
      for (const campaign of projectCampaigns) {
        await campaignsService.update(campaign.id, {
          startDate: startDateISO,
          endDate: endDateISO
        })
      }

      // Update local state
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c =>
          projectCampaigns.some(pc => pc.id === c.id)
            ? { ...c, startDate: startDateISO, endDate: endDateISO }
            : c
        )
      )

      toast.success(`Synced ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''} to project dates`)
    } catch (error) {
      console.error('Error syncing campaign dates:', error)
      toast.error('Failed to sync campaign dates')
    }
  }

  const handleUnassignTask = async (task: Task) => {
    if (!setTasks) {
      toast.error('Unassign function not available')
      return
    }

    try {
      await tasksService.update(task.id, {
        startDate: null as any,
        dueDate: null as any
      })

      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === task.id
            ? { ...t, startDate: undefined, dueDate: undefined }
            : t
        )
      )

      toast.success('Task dates removed')
    } catch (error) {
      console.error('Error unassigning task:', error)
      toast.error('Failed to remove task dates')
    }
  }

  const handleUnassignCampaign = async (campaign: Campaign, cascadeTasks: boolean = false) => {
    if (!setCampaigns) {
      toast.error('Unassign function not available')
      return
    }

    try {
      // Unassign the campaign
      await campaignsService.update(campaign.id, {
        startDate: null as any,
        endDate: null as any
      })

      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c =>
          c.id === campaign.id
            ? { ...c, startDate: undefined, endDate: undefined }
            : c
        )
      )

      // If cascading, also unassign all tasks in this campaign
      if (cascadeTasks && setTasks) {
        const campaignTasks = tasks.filter(t => t.campaignId === campaign.id && (t.startDate || t.dueDate))
        
        if (campaignTasks.length > 0) {
          for (const task of campaignTasks) {
            await tasksService.update(task.id, {
              startDate: null as any,
              dueDate: null as any
            })
          }

          setTasks(prevTasks =>
            prevTasks.map(t =>
              campaignTasks.some(ct => ct.id === t.id)
                ? { ...t, startDate: undefined, dueDate: undefined }
                : t
            )
          )

          toast.success(`Removed dates from campaign and ${campaignTasks.length} task${campaignTasks.length > 1 ? 's' : ''}`)
        } else {
          toast.success('Campaign dates removed')
        }
      } else {
        toast.success('Campaign dates removed')
      }
    } catch (error) {
      console.error('Error unassigning campaign:', error)
      toast.error('Failed to remove campaign dates')
    }
  }

  const handleUnassignProject = async (project: Project, cascadeCampaigns: boolean = false) => {
    if (!setProjects) {
      toast.error('Unassign function not available')
      return
    }

    try {
      // Unassign the project
      await projectsService.update(project.id, {
        startDate: null as any,
        endDate: null as any
      })

      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === project.id
            ? { ...p, startDate: undefined, endDate: undefined }
            : p
        )
      )

      // If cascading, also unassign all campaigns (and their tasks) in this project
      if (cascadeCampaigns && setCampaigns) {
        const projectCampaigns = campaigns.filter(c => c.projectId === project.id && (c.startDate || c.endDate))
        
        if (projectCampaigns.length > 0) {
          // Unassign all campaigns
          for (const campaign of projectCampaigns) {
            await campaignsService.update(campaign.id, {
              startDate: null as any,
              endDate: null as any
            })
          }

          setCampaigns(prevCampaigns =>
            prevCampaigns.map(c =>
              projectCampaigns.some(pc => pc.id === c.id)
                ? { ...c, startDate: undefined, endDate: undefined }
                : c
            )
          )

          // Also unassign all tasks in those campaigns
          if (setTasks) {
            const campaignIds = projectCampaigns.map(c => c.id)
            const campaignTasks = tasks.filter(t => 
              campaignIds.includes(t.campaignId || '') && (t.startDate || t.dueDate)
            )

            if (campaignTasks.length > 0) {
              for (const task of campaignTasks) {
                await tasksService.update(task.id, {
                  startDate: null as any,
                  dueDate: null as any
                })
              }

              setTasks(prevTasks =>
                prevTasks.map(t =>
                  campaignTasks.some(ct => ct.id === t.id)
                    ? { ...t, startDate: undefined, dueDate: undefined }
                    : t
                )
              )

              toast.success(`Removed dates from project, ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''}, and ${campaignTasks.length} task${campaignTasks.length > 1 ? 's' : ''}`)
            } else {
              toast.success(`Removed dates from project and ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''}`)
            }
          } else {
            toast.success(`Removed dates from project and ${projectCampaigns.length} campaign${projectCampaigns.length > 1 ? 's' : ''}`)
          }
        } else {
          toast.success('Project dates removed')
        }
      } else {
        toast.success('Project dates removed')
      }
    } catch (error) {
      console.error('Error unassigning project:', error)
      toast.error('Failed to remove project dates')
    }
  }

  const handleReassignAll = async () => {
    if (!setTasks) {
      toast.error('Reassign function not available')
      return
    }

    setIsAutoScheduling(true)
    let tasksReassigned = 0
    let skipped = 0

    try {
      // Reassign tasks to their campaign start dates
      const taskUpdates: Array<{ id: string; startDate: string; dueDate: string }> = []
      
      for (const task of scheduledTasks) {
        if (!task.campaignId) {
          skipped++
          continue
        }

        const campaign = campaigns.find(c => c.id === task.campaignId)
        
        if (!campaign || !campaign.startDate || !campaign.endDate) {
          skipped++
          continue
        }

        const startDate = new Date(campaign.startDate)
        const dueDate = addDays(startDate, 1)

        taskUpdates.push({
          id: task.id,
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString()
        })
      }

      // Execute task updates
      for (const update of taskUpdates) {
        try {
          await tasksService.update(update.id, {
            startDate: update.startDate,
            dueDate: update.dueDate
          })
          tasksReassigned++
        } catch (error) {
          console.error('Error updating task:', error)
          skipped++
        }
      }

      // Update task state
      setTasks(prevTasks =>
        prevTasks.map(t => {
          const update = taskUpdates.find(u => u.id === t.id)
          return update ? { ...t, startDate: update.startDate, dueDate: update.dueDate } : t
        })
      )

      if (tasksReassigned > 0) {
        toast.success(`Reassigned ${tasksReassigned} task(s) to campaign start dates`)
      }
      if (skipped > 0) {
        toast.warning(`Skipped ${skipped} task(s) (missing campaign or campaign dates)`)
      }
    } catch (error) {
      console.error('Error reassigning tasks:', error)
      toast.error('Failed to reassign tasks')
    } finally {
      setIsAutoScheduling(false)
    }
  }

  const totalUnscheduled = 
    unscheduledCampaigns.length + 
    unscheduledProjects.length + 
    unscheduledTasks.length + 
    unscheduledStages.length
  
  // Count only what will be displayed based on filterMode
  const totalScheduled = (() => {
    if (filterMode === 'projects') {
      return scheduledProjects.length
    } else if (filterMode === 'campaigns') {
      return scheduledCampaigns.length
    } else if (filterMode === 'tasks') {
      return scheduledTasks.length
    } else {
      // 'all' - count everything
      return scheduledProjects.length + scheduledCampaigns.length + scheduledTasks.length
    }
  })()

  if (isCollapsed) {
    return (
      <div className="border-l bg-background flex flex-col items-center py-4 gap-4 w-12">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="rotate-180"
        >
          <CaretRight size={20} />
        </Button>
        {totalUnscheduled > 0 && (
          <div className="flex flex-col items-center gap-2">
            <CalendarIcon size={20} className="text-muted-foreground" />
            <Badge variant="secondary" className="h-6 w-6 p-0 flex items-center justify-center text-xs">
              {totalUnscheduled}
            </Badge>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-background w-full md:w-80 md:border-l flex flex-col h-full overflow-hidden">
      {/* Header - removed title and toggle button */}
      <div className="p-2 border-b flex-shrink-0">
        {/* View Toggle Buttons - stacked layout */}
        <div className="space-y-0.5">
          <Button
            variant={activeView === 'unscheduled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('unscheduled')}
            className="w-full justify-between h-8 text-xs"
          >
            <span>Unscheduled</span>
            {totalUnscheduled > 0 && (
              <Badge variant={activeView === 'unscheduled' ? 'secondary' : 'outline'}>
                {totalUnscheduled}
              </Badge>
            )}
          </Button>
          <div className="flex gap-0.5">
            <Button
              variant={activeView === 'scheduled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('scheduled')}
              className="flex-1 justify-between h-8 text-xs"
            >
              <span>Scheduled</span>
              {totalScheduled > 0 && (
                <Badge variant={activeView === 'scheduled' ? 'secondary' : 'outline'} className="text-[10px] h-4">
                  {totalScheduled}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeView === 'unassign' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('unassign')}
              className="flex-1 h-8 text-xs"
            >
              <span>Unassign</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2 space-y-2">
          
          {/* Unscheduled View */}
          {activeView === 'unscheduled' && (
            <>
              {totalUnscheduled === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p>All items are scheduled</p>
                  <p className="text-xs mt-1">Items without dates will appear here</p>
                </div>
              ) : (
                <>
                  {/* Campaigns */}
                  {unscheduledCampaigns.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('campaigns')}
                    className="flex items-center gap-1.5 w-full text-xs font-medium mb-1 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    {expandedSections.campaigns ? (
                      <CaretDown size={14} />
                    ) : (
                      <CaretRight size={14} />
                    )}
                    <Target size={14} />
                    <span>Campaigns</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                      {unscheduledCampaigns.length}
                    </Badge>
                  </button>
                  {expandedSections.campaigns && (
                    <div className="space-y-0.5 ml-4">
                      {unscheduledCampaigns.map(campaign => {
                        const campaignTasks = unscheduledTasks.filter(t => t.campaignId === campaign.id)
                        const isCampaignExpanded = expandedCampaigns.has(campaign.id)
                        
                        return (
                          <div key={campaign.id} className="space-y-0.5">
                            <div className="flex items-start gap-1.5">
                              {campaignTasks.length > 0 && (
                                <button
                                  onClick={() => toggleCampaign(campaign.id)}
                                  className="w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 pt-1.5"
                                >
                                  {isCampaignExpanded ? (
                                    <CaretDown size={12} weight="bold" />
                                  ) : (
                                    <CaretRight size={12} weight="bold" />
                                  )}
                                </button>
                              )}
                              {campaignTasks.length === 0 && <div className="w-5 flex-shrink-0" />}
                              <div className="flex-1">
                                <DraggableItem
                                  id={campaign.id}
                                  type="campaign"
                                  title={campaign.title}
                                  icon={<Target size={14} />}
                                  color="#10b981"
                                  metadata={{ campaignId: campaign.id }}
                                />
                              </div>
                            </div>
                            
                            {/* Show tasks when expanded */}
                            {isCampaignExpanded && campaignTasks.length > 0 && (
                              <div className="ml-5 space-y-0.5">
                                {campaignTasks.map(task => (
                                  <DraggableItem
                                    key={task.id}
                                    id={task.id}
                                    type="task"
                                    title={task.title}
                                    icon={<CheckSquare size={12} />}
                                    metadata={{ taskId: task.id }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Projects */}
              {unscheduledProjects.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('projects')}
                    className="flex items-center gap-1.5 w-full text-xs font-medium mb-1 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    {expandedSections.projects ? (
                      <CaretDown size={14} />
                    ) : (
                      <CaretRight size={14} />
                    )}
                    <Folder size={14} />
                    <span>Projects</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                      {unscheduledProjects.length}
                    </Badge>
                  </button>
                  {expandedSections.projects && (
                    <div className="space-y-0.5 ml-4">
                      {unscheduledProjects.map(project => {
                        const projectCampaigns = unscheduledCampaigns.filter(c => c.projectId === project.id)
                        const isProjectExpanded = expandedProjects.has(project.id)
                        
                        return (
                          <div key={project.id} className="space-y-0.5">
                            <div className="flex items-start gap-1.5">
                              {projectCampaigns.length > 0 && (
                                <button
                                  onClick={() => toggleProject(project.id)}
                                  className="w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 pt-1.5"
                                >
                                  {isProjectExpanded ? (
                                    <CaretDown size={12} weight="bold" />
                                  ) : (
                                    <CaretRight size={12} weight="bold" />
                                  )}
                                </button>
                              )}
                              {projectCampaigns.length === 0 && <div className="w-5 flex-shrink-0" />}
                              <div className="flex-1">
                                <DraggableItem
                                  id={project.id}
                                  type="project"
                                  title={project.title}
                                  icon={<Folder size={14} />}
                                  color="#8b5cf6"
                                  metadata={{ projectId: project.id }}
                                />
                              </div>
                            </div>
                            
                            {/* Show campaigns when expanded */}
                            {isProjectExpanded && projectCampaigns.length > 0 && (
                              <div className="ml-5 space-y-0.5">
                                {projectCampaigns.map(campaign => (
                                  <DraggableItem
                                    key={campaign.id}
                                    id={campaign.id}
                                    type="campaign"
                                    title={campaign.title}
                                    icon={<Target size={12} />}
                                    color="#10b981"
                                    metadata={{ campaignId: campaign.id }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Stages */}
              {unscheduledStages.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('stages')}
                    className="flex items-center gap-1.5 w-full text-xs font-medium mb-1 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    {expandedSections.stages ? (
                      <CaretDown size={14} />
                    ) : (
                      <CaretRight size={14} />
                    )}
                    <Flag size={14} />
                    <span>Stages</span>
                    <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                      {unscheduledStages.length}
                    </Badge>
                  </button>
                  {expandedSections.stages && (
                    <div className="space-y-0.5 ml-4">
                      {unscheduledStages.map(stage => (
                        <DraggableItem
                          key={stage.id}
                          id={stage.id}
                          type="stage"
                          title={`${stage.stageName} (${stage.parentTitle})`}
                          icon={<Flag size={14} />}
                          color={stage.color}
                          metadata={{
                            stageId: stage.id,
                            [`${stage.parentType}Id`]: stage.parentId
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tasks */}
              {unscheduledTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <button
                      onClick={() => toggleSection('tasks')}
                      className="flex items-center gap-1.5 flex-1 text-xs font-medium hover:text-foreground text-muted-foreground transition-colors"
                    >
                      {expandedSections.tasks ? (
                        <CaretDown size={14} />
                      ) : (
                        <CaretRight size={14} />
                      )}
                      <CheckSquare size={14} />
                      <span>Tasks</span>
                      <Badge variant="secondary" className="ml-auto text-[10px] h-4">
                        {unscheduledTasks.length}
                      </Badge>
                    </button>
                    {setTasks && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAutoScheduleTasks}
                        disabled={isAutoScheduling}
                        className="h-6 text-[10px] px-2"
                        title="Auto-schedule all tasks within their campaign date ranges"
                      >
                        {isAutoScheduling ? 'Scheduling...' : 'Auto'}
                      </Button>
                    )}
                  </div>
                  {expandedSections.tasks && (
                    <div className="space-y-0.5 ml-4">
                      {unscheduledTasks.map(task => {
                        const taskCampaign = campaigns.find(c => c.id === task.campaignId)
                        const titleWithCampaign = taskCampaign 
                          ? `${task.title} (${taskCampaign.title})`
                          : task.title
                        
                        return (
                          <DraggableItem
                            key={task.id}
                            id={task.id}
                            type="task"
                            title={titleWithCampaign}
                            icon={<CheckSquare size={12} />}
                            metadata={{ taskId: task.id }}
                            actionButton={
                              setTasks && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5"
                                  onClick={() => handleAutoScheduleTask(task)}
                                  title="Auto-schedule this task to campaign start date"
                                >
                                  <Lightning size={12} weight="fill" />
                                </Button>
                              )
                            }
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
                </>
              )}
            </>
          )}

          {/* Scheduled View */}
          {activeView === 'scheduled' && (
            <>
              {totalScheduled === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No scheduled items yet</p>
                  <p className="text-xs mt-1">Drag items to the calendar or use auto-schedule</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <CalendarIcon size={16} />
                      Scheduled Items
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReassignAll}
                      disabled={isAutoScheduling}
                      className="h-7 text-xs"
                      title="Reassign all items to optimal dates"
                    >
                      {isAutoScheduling ? 'Reassigning...' : 'Reassign All'}
                    </Button>
                  </div>

                  {/* Scheduled Projects - show based on filter mode */}
                  {(filterMode === 'projects' || filterMode === 'all') && scheduledProjects.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => toggleSection('scheduledProjects')}
                    className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    {expandedSections.scheduledProjects ? (
                      <CaretDown size={16} />
                    ) : (
                      <CaretRight size={16} />
                    )}
                    <Folder size={16} />
                    <span>Projects</span>
                    <Badge variant="secondary" className="ml-auto">
                      {scheduledProjects.length}
                    </Badge>
                  </button>
                  {expandedSections.scheduledProjects && (
                    <div className="space-y-2 ml-6">
                      {scheduledProjects.map(project => {
                        const projectCampaigns = scheduledCampaigns.filter(c => c.projectId === project.id)
                        const isProjectExpanded = expandedProjects.has(project.id)
                        
                        return (
                          <div key={project.id} className="space-y-1">
                            <div 
                              className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border-l-2 cursor-pointer hover:bg-muted/50 transition-colors" 
                              style={{ borderLeftColor: '#8b5cf6' }}
                              onClick={() => {
                                if (onNavigateToDate && project.startDate) {
                                  onNavigateToDate(new Date(project.startDate))
                                }
                              }}
                            >
                              {projectCampaigns.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleProject(project.id)
                                  }}
                                  className="w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                >
                                  {isProjectExpanded ? (
                                    <CaretDown size={14} weight="bold" />
                                  ) : (
                                    <CaretRight size={14} weight="bold" />
                                  )}
                                </button>
                              )}
                              {projectCampaigns.length === 0 && <div className="w-6 flex-shrink-0" />}
                              <Folder size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                              <span className="text-xs font-medium flex-1 break-words leading-snug">{project.title}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAutoScheduleProjectCampaigns(project)
                                }}
                                title="Sync all campaigns to project dates"
                              >
                                <CalendarCheck size={12} weight="bold" />
                              </Button>
                            </div>
                            
                            {/* Campaigns under this project */}
                            {isProjectExpanded && projectCampaigns.length > 0 && (
                              <div className="ml-6 space-y-1">
                                {projectCampaigns.map(campaign => {
                                  const campaignTasks = scheduledTasks.filter(t => t.campaignId === campaign.id)
                                  const isCampaignExpanded = expandedCampaigns.has(campaign.id)
                                  
                                  return (
                                    <div key={campaign.id} className="space-y-1">
                                      <div 
                                        className="flex items-start gap-2 p-2 rounded-md bg-muted/20 border-l-2 cursor-pointer hover:bg-muted/40 transition-colors" 
                                        style={{ borderLeftColor: '#10b981' }}
                                        onClick={() => {
                                          if (onNavigateToDate && campaign.startDate) {
                                            onNavigateToDate(new Date(campaign.startDate))
                                          }
                                        }}
                                      >
                                        {campaignTasks.length > 0 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              toggleCampaign(campaign.id)
                                            }}
                                            className="w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                          >
                                            {isCampaignExpanded ? (
                                              <CaretDown size={12} weight="bold" />
                                            ) : (
                                              <CaretRight size={12} weight="bold" />
                                            )}
                                          </button>
                                        )}
                                        {campaignTasks.length === 0 && <div className="w-5 flex-shrink-0" />}
                                        <Target size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <span className="text-xs flex-1 break-words leading-snug">{campaign.title}</span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-5 w-5 flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleReassignCampaignTasks(campaign)
                                          }}
                                          title="Auto-schedule all unscheduled tasks in this campaign"
                                        >
                                          <ArrowsClockwise size={12} weight="bold" />
                                        </Button>
                                      </div>
                                      
                                      {/* Tasks under this campaign */}
                                      {isCampaignExpanded && campaignTasks.length > 0 && (
                                        <div className="ml-5 space-y-1">
                                          {campaignTasks.map(task => (
                                            <div 
                                              key={task.id} 
                                              className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 border-l-2 border-transparent hover:border-border cursor-pointer"
                                              onClick={() => {
                                                if (onNavigateToDate && task.startDate) {
                                                  onNavigateToDate(new Date(task.startDate))
                                                }
                                              }}
                                            >
                                              <CheckSquare size={10} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                              <span className="text-xs flex-1 break-words leading-snug">{task.title}</span>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-4 w-4 flex-shrink-0"
                                                onClick={(e) => {
                                                  e.stopPropagation()
                                                  handleReassignTask(task)
                                                }}
                                                title="Reassign task to campaign start date"
                                              >
                                                <Lightning size={10} weight="fill" />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

                  {/* Scheduled Campaigns - show based on filter mode */}
                  {(filterMode === 'campaigns' || filterMode === 'all') && scheduledCampaigns.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleSection('scheduledCampaigns')}
                        className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                      >
                        {expandedSections.scheduledCampaigns ? (
                          <CaretDown size={16} />
                        ) : (
                          <CaretRight size={16} />
                        )}
                        <Target size={16} />
                        <span>Campaigns</span>
                        <Badge variant="secondary" className="ml-auto">
                          {scheduledCampaigns.length}
                        </Badge>
                      </button>
                      {expandedSections.scheduledCampaigns && (
                        <div className="space-y-2 ml-6">
                          {scheduledCampaigns.map(campaign => {
                            const campaignTasks = scheduledTasks.filter(t => t.campaignId === campaign.id)
                            const isCampaignExpanded = expandedCampaigns.has(campaign.id)
                            
                            return (
                              <div key={campaign.id} className="space-y-1">
                                <div 
                                  className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border-l-2 cursor-pointer hover:bg-muted/50 transition-colors" 
                                  style={{ borderLeftColor: '#10b981' }}
                                  onClick={() => {
                                    if (onNavigateToDate && campaign.startDate) {
                                      onNavigateToDate(new Date(campaign.startDate))
                                    }
                                  }}
                                >
                                  {campaignTasks.length > 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleCampaign(campaign.id)
                                      }}
                                      className="w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                    >
                                      {isCampaignExpanded ? (
                                        <CaretDown size={14} weight="bold" />
                                      ) : (
                                        <CaretRight size={14} weight="bold" />
                                      )}
                                    </button>
                                  )}
                                  {campaignTasks.length === 0 && <div className="w-6 flex-shrink-0" />}
                                  <Target size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="text-xs font-medium flex-1 break-words leading-snug">{campaign.title}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleReassignCampaignTasks(campaign)
                                    }}
                                    title="Auto-schedule all unscheduled tasks in this campaign"
                                  >
                                    <ArrowsClockwise size={12} weight="bold" />
                                  </Button>
                                </div>
                                
                                {/* Tasks under this campaign */}
                                {isCampaignExpanded && campaignTasks.length > 0 && (
                                  <div className="ml-6 space-y-1">
                                    {campaignTasks.map(task => (
                                      <div 
                                        key={task.id} 
                                        className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 border-l-2 border-transparent hover:border-border cursor-pointer"
                                        onClick={() => {
                                          if (onNavigateToDate && task.startDate) {
                                            onNavigateToDate(new Date(task.startDate))
                                          }
                                        }}
                                      >
                                        <CheckSquare size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <span className="text-xs flex-1 break-words leading-snug">{task.title}</span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-5 w-5 flex-shrink-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleReassignTask(task)
                                          }}
                                          title="Reassign task to campaign start date"
                                        >
                                          <Lightning size={10} weight="fill" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Scheduled Tasks - show based on filter mode */}
                  {(filterMode === 'tasks' || filterMode === 'all') && scheduledTasks.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleSection('scheduledTasks')}
                        className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                      >
                        {expandedSections.scheduledTasks ? (
                          <CaretDown size={16} />
                        ) : (
                          <CaretRight size={16} />
                        )}
                        <CheckSquare size={16} />
                        <span>Tasks</span>
                        <Badge variant="secondary" className="ml-auto">
                          {scheduledTasks.length}
                        </Badge>
                      </button>
                      {expandedSections.scheduledTasks && (
                        <div className="space-y-2 ml-6">
                          {scheduledTasks.map(task => (
                            <div 
                              key={task.id} 
                              className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border-l-2 hover:bg-muted/50 transition-colors border-blue-500 cursor-pointer"
                              onClick={() => {
                                if (onNavigateToDate && task.startDate) {
                                  onNavigateToDate(new Date(task.startDate))
                                }
                              }}
                            >
                              <CheckSquare size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                              <span className="text-xs font-medium flex-1 break-words leading-snug">{task.title}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5 flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleReassignTask(task)
                                }}
                                title="Reassign task"
                              >
                                <Lightning size={12} weight="bold" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Unassign View */}
          {activeView === 'unassign' && (
            <>
              {totalScheduled === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CalendarIcon size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No scheduled items to unassign</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <CalendarX size={16} />
                      Remove Dates
                    </h4>
                  </div>

                  {/* Unassign Projects - show only if filterMode is 'all' or 'projects' */}
                  {(filterMode === 'all' || filterMode === 'projects') && scheduledProjects.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleSection('scheduledProjects')}
                        className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                      >
                        {expandedSections.scheduledProjects ? (
                          <CaretDown size={16} />
                        ) : (
                          <CaretRight size={16} />
                        )}
                        <Folder size={16} />
                        <span>Projects</span>
                        <Badge variant="secondary" className="ml-auto">
                          {scheduledProjects.length}
                        </Badge>
                      </button>
                      {expandedSections.scheduledProjects && (
                        <div className="space-y-2 ml-6">
                          {scheduledProjects.map(project => {
                            const projectCampaigns = scheduledCampaigns.filter(c => c.projectId === project.id)
                            const isProjectExpanded = expandedProjects.has(project.id)
                            
                            return (
                              <div key={project.id} className="space-y-1">
                                <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border-l-2 hover:bg-muted/50 transition-colors" style={{ borderLeftColor: '#8b5cf6' }}>
                                  {projectCampaigns.length > 0 && (
                                    <button
                                      onClick={() => toggleProject(project.id)}
                                      className="w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                    >
                                      {isProjectExpanded ? (
                                        <CaretDown size={14} weight="bold" />
                                      ) : (
                                        <CaretRight size={14} weight="bold" />
                                      )}
                                    </button>
                                  )}
                                  {projectCampaigns.length === 0 && <div className="w-6 flex-shrink-0" />}
                                  <Folder size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="text-xs font-medium flex-1 break-words leading-snug">{project.title}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUnassignProject(project, true)}
                                    title="Remove dates from project and all campaigns/tasks"
                                  >
                                    <CalendarX size={12} weight="bold" />
                                  </Button>
                                </div>
                                
                                {/* Show campaigns when expanded */}
                                {isProjectExpanded && projectCampaigns.length > 0 && (
                                  <div className="ml-6 space-y-1">
                                    {projectCampaigns.map(campaign => {
                                      const campaignTasks = scheduledTasks.filter(t => t.campaignId === campaign.id)
                                      const isCampaignExpanded = expandedCampaigns.has(campaign.id)
                                      
                                      return (
                                        <div key={campaign.id} className="space-y-1">
                                          <div className="flex items-start gap-2 p-1.5 rounded-md bg-muted/20 border-l-2 hover:bg-muted/40 transition-colors" style={{ borderLeftColor: '#10b981' }}>
                                            {campaignTasks.length > 0 && (
                                              <button
                                                onClick={() => toggleCampaign(campaign.id)}
                                                className="w-5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                              >
                                                {isCampaignExpanded ? (
                                                  <CaretDown size={12} weight="bold" />
                                                ) : (
                                                  <CaretRight size={12} weight="bold" />
                                                )}
                                              </button>
                                            )}
                                            {campaignTasks.length === 0 && <div className="w-5 flex-shrink-0" />}
                                            <Target size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                            <span className="text-xs flex-1 break-words leading-snug">{campaign.title}</span>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-4 w-4 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                              onClick={() => handleUnassignCampaign(campaign, true)}
                                              title="Remove dates from campaign and all tasks"
                                            >
                                              <CalendarX size={10} weight="bold" />
                                            </Button>
                                          </div>
                                          
                                          {/* Show tasks when campaign is expanded */}
                                          {isCampaignExpanded && campaignTasks.length > 0 && (
                                            <div className="ml-5 space-y-0.5">
                                              {campaignTasks.map(task => (
                                                <div key={task.id} className="flex items-start gap-2 p-1 rounded-md hover:bg-muted/50 border-l border-transparent hover:border-border transition-colors">
                                                  <CheckSquare size={10} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                                  <span className="text-xs flex-1 break-words leading-snug">{task.title}</span>
                                                  <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-3 w-3 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleUnassignTask(task)}
                                                    title="Remove task dates"
                                                  >
                                                    <CalendarX size={8} weight="bold" />
                                                  </Button>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                                
                                {/* Show campaign count when collapsed */}
                                {!isProjectExpanded && projectCampaigns.length > 0 && (
                                  <div className="ml-10 text-xs text-muted-foreground">
                                    Will also unassign {projectCampaigns.length} campaign{projectCampaigns.length > 1 ? 's' : ''} and their tasks
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unassign Campaigns - show only if filterMode is 'all' or 'campaigns' */}
                  {(filterMode === 'all' || filterMode === 'campaigns') && scheduledCampaigns.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleSection('scheduledCampaigns')}
                        className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                      >
                        {expandedSections.scheduledCampaigns ? (
                          <CaretDown size={16} />
                        ) : (
                          <CaretRight size={16} />
                        )}
                        <Target size={16} />
                        <span>Campaigns</span>
                        <Badge variant="secondary" className="ml-auto">
                          {scheduledCampaigns.length}
                        </Badge>
                      </button>
                      {expandedSections.scheduledCampaigns && (
                        <div className="space-y-2 ml-6">
                          {scheduledCampaigns.map(campaign => {
                            const campaignTasks = scheduledTasks.filter(t => t.campaignId === campaign.id)
                            const isCampaignExpanded = expandedCampaigns.has(campaign.id)
                            
                            return (
                              <div key={campaign.id} className="space-y-1">
                                <div className="flex items-start gap-2 p-2 rounded-md bg-muted/20 border-l-2 hover:bg-muted/40 transition-colors" style={{ borderLeftColor: '#10b981' }}>
                                  {campaignTasks.length > 0 && (
                                    <button
                                      onClick={() => toggleCampaign(campaign.id)}
                                      className="w-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                    >
                                      {isCampaignExpanded ? (
                                        <CaretDown size={12} weight="bold" />
                                      ) : (
                                        <CaretRight size={12} weight="bold" />
                                      )}
                                    </button>
                                  )}
                                  {campaignTasks.length === 0 && <div className="w-6 flex-shrink-0" />}
                                  <Target size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <span className="text-xs flex-1 break-words leading-snug">{campaign.title}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleUnassignCampaign(campaign, true)}
                                    title="Remove dates from campaign and all tasks"
                                  >
                                    <CalendarX size={12} weight="bold" />
                                  </Button>
                                </div>
                                
                                {/* Show tasks when expanded */}
                                {isCampaignExpanded && campaignTasks.length > 0 && (
                                  <div className="ml-6 space-y-0.5">
                                    {campaignTasks.map(task => (
                                      <div key={task.id} className="flex items-start gap-2 p-1 rounded-md hover:bg-muted/50 border-l border-transparent hover:border-border transition-colors">
                                        <CheckSquare size={10} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <span className="text-xs flex-1 break-words leading-snug">{task.title}</span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-3 w-3 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleUnassignTask(task)}
                                          title="Remove task dates"
                                        >
                                          <CalendarX size={8} weight="bold" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Show task count when collapsed */}
                                {!isCampaignExpanded && campaignTasks.length > 0 && (
                                  <div className="ml-8 text-xs text-muted-foreground">
                                    Will also unassign {campaignTasks.length} task{campaignTasks.length > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Unassign Tasks - show only if filterMode is 'all' or 'tasks' */}
                  {(filterMode === 'all' || filterMode === 'tasks') && scheduledTasks.length > 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => toggleSection('scheduledTasks')}
                        className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                      >
                        {expandedSections.scheduledTasks ? (
                          <CaretDown size={16} />
                        ) : (
                          <CaretRight size={16} />
                        )}
                        <CheckSquare size={16} />
                        <span>Tasks</span>
                        <Badge variant="secondary" className="ml-auto">
                          {scheduledTasks.length}
                        </Badge>
                      </button>
                      {expandedSections.scheduledTasks && (
                        <div className="space-y-1 ml-6">
                          {scheduledTasks.map(task => (
                            <div key={task.id} className="flex items-start gap-2 p-1.5 rounded-md hover:bg-muted/50 border-l-2 border-transparent hover:border-border transition-colors">
                              <CheckSquare size={10} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                              <span className="text-xs flex-1 break-words leading-snug">{task.title}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-4 w-4 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleUnassignTask(task)}
                                title="Remove task dates"
                              >
                                <CalendarX size={10} weight="bold" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
          
        </div>
      </ScrollArea>
      </div>

      {/* Footer hint */}
      {activeView === 'unscheduled' && totalUnscheduled > 0 && (
        <div className="p-4 border-t bg-muted/30 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center break-words">
            💡 Drag items onto the calendar to assign dates
          </p>
        </div>
      )}
    </div>
  )
}
