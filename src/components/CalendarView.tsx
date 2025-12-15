import { useState } from 'react'
import { Campaign, Task, Label, List, FilterState, Project, StageDate, User } from '@/lib/types'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { CaretLeft, CaretRight, Calendar as CalendarIcon, Archive, ArrowCounterClockwise } from '@phosphor-icons/react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'
import { ScrollArea } from './ui/scroll-area'
import { Badge } from './ui/badge'
import { getLabelColor } from '@/lib/helpers'
import { cn } from '@/lib/utils'
import TaskDetailDialog from './TaskDetailDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { campaignsService } from '@/services/campaigns.service'
import { toast } from 'sonner'

interface CalendarViewProps {
  campaigns: Campaign[]
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  activeCampaignId: string | null
  filters: FilterState
  projects?: Project[]
  users?: User[]
  viewLevel?: 'campaign' | 'project' | 'all'
  onCampaignClick?: (campaignId: string) => void
  onProjectClick?: (projectId: string) => void
  orgId: string
  setCampaigns?: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  onNavigateBack?: () => void
}

export default function CalendarView({
  campaigns,
  tasks,
  setTasks,
  labels,
  setLabels,
  lists,
  activeCampaignId,
  filters,
  projects = [],
  users = [],
  viewLevel = 'campaign',
  onCampaignClick,
  onProjectClick,
  orgId,
  setCampaigns,
  onNavigateBack,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [calendarMode, setCalendarMode] = useState<'tasks' | 'stages' | 'both' | string>('both')

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId)

  const handleRestoreCampaign = async () => {
    if (!activeCampaign || !setCampaigns) return

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

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Collect all available filter options
  const filterOptions: Array<{ value: string; label: string; type: 'mode' | 'project' | 'campaign' | 'stage' }> = [
    { value: 'both', label: 'All Events', type: 'mode' },
    { value: 'tasks', label: 'Tasks Only', type: 'mode' },
    { value: 'stages', label: 'Stage Dates Only', type: 'mode' },
  ]

  // Add projects
  projects.forEach(project => {
    filterOptions.push({
      value: `project:${project.id}`,
      label: `📁 ${project.title}`,
      type: 'project'
    })
  })

  // Add campaigns
  campaigns.forEach(campaign => {
    filterOptions.push({
      value: `campaign:${campaign.id}`,
      label: `🎯 ${campaign.title}`,
      type: 'campaign'
    })
  })

  // Add unique stage names from all campaigns and projects
  const allStageNames = new Set<string>()
  campaigns.forEach(c => c.stageDates?.forEach(sd => allStageNames.add(sd.stageName)))
  projects.forEach(p => p.stageDates?.forEach(sd => allStageNames.add(sd.stageName)))
  Array.from(allStageNames).sort().forEach(stageName => {
    filterOptions.push({
      value: `stage:${stageName}`,
      label: `📅 ${stageName}`,
      type: 'stage'
    })
  })

  const visibleTasks = activeCampaignId
    ? tasks.filter(t => t.campaignId === activeCampaignId)
    : tasks

  // Get tasks that span across dates based on their stageDates or dueDate
  const getTasksSpanningDate = (date: Date) => {
    const spanningTasks: Array<{
      task: Task
      position: 'start' | 'middle' | 'end' | 'single'
      color: string
      assignedUsers: User[]
      currentStageName?: string
    }> = []

    visibleTasks.forEach(task => {
      // Check if task has stage dates for spanning
      if (task.stageDates && task.stageDates.length > 0) {
        // Use the overall date range from earliest start to latest end
        const allDates = task.stageDates.flatMap(sd => [new Date(sd.startDate), new Date(sd.endDate)])
        const taskStart = new Date(Math.min(...allDates.map(d => d.getTime())))
        const taskEnd = new Date(Math.max(...allDates.map(d => d.getTime())))

        if (isWithinInterval(date, { start: taskStart, end: taskEnd })) {
          const isStart = isSameDay(date, taskStart)
          const isEnd = isSameDay(date, taskEnd)
          const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
          
          // Get task color from first label or default
          const taskLabels = labels.filter(l => task.labelIds.includes(l.id))
          const color = taskLabels[0] ? getLabelColor(taskLabels[0].color) : '#6366f1'
          
          // Get assigned users
          const assignedUsers = (task.assignedTo || [])
            .map(userId => users.find(u => u.id === userId))
            .filter(Boolean) as User[]

          // Find which stage the current date falls in
          const currentStage = task.stageDates.find(sd => 
            isWithinInterval(date, { 
              start: new Date(sd.startDate), 
              end: new Date(sd.endDate) 
            })
          )

          spanningTasks.push({ 
            task, 
            position, 
            color, 
            assignedUsers,
            currentStageName: currentStage?.stageName
          })
        }
      } else if (task.dueDate) {
        // Fallback to single-day display on due date
        if (isSameDay(new Date(task.dueDate), date)) {
          const taskLabels = labels.filter(l => task.labelIds.includes(l.id))
          const color = taskLabels[0] ? getLabelColor(taskLabels[0].color) : '#6366f1'
          
          const assignedUsers = (task.assignedTo || [])
            .map(userId => users.find(u => u.id === userId))
            .filter(Boolean) as User[]

          spanningTasks.push({ 
            task, 
            position: 'single', 
            color, 
            assignedUsers,
            currentStageName: task.currentStage
          })
        }
      }
    })

    return spanningTasks
  }

  const getTasksForDate = (date: Date) => {
    return visibleTasks.filter(task => {
      if (!task.dueDate) return false
      return isSameDay(new Date(task.dueDate), date)
    })
  }

  const getProjectEventsForDate = (date: Date) => {
    const events: Array<{ 
      id: string
      title: string
      type: string
      color: string
      position: 'start' | 'middle' | 'end' | 'single'
      projectId: string
    }> = []
    
    if (viewLevel === 'all' || viewLevel === 'project') {
      projects.forEach(project => {
        // Remove emojis from title
        const cleanTitle = project.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
        
        // Project Active Phase (Start to Target End or Actual End)
        if (project.startDate && (project.endDate || project.actualEndDate)) {
          const startDate = new Date(project.startDate)
          const endDate = project.actualEndDate 
            ? new Date(project.actualEndDate) 
            : new Date(project.endDate!)
          
          if (isWithinInterval(date, { start: startDate, end: endDate })) {
            const isStart = isSameDay(date, startDate)
            const isEnd = isSameDay(date, endDate)
            const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
            events.push({
              id: `project-active-${project.id}`,
              title: project.actualEndDate 
                ? `${cleanTitle} (Completed)` 
                : `${cleanTitle} (Active)`,
              type: 'project-active',
              color: project.actualEndDate ? '#10b981' : '#8b5cf6',
              position,
              projectId: project.id
            })
          }
        } else if (project.startDate && isSameDay(new Date(project.startDate), date)) {
          // Single start date (no end date set)
          events.push({
            id: `project-start-${project.id}`,
            title: `${cleanTitle} (Start)`,
            type: 'project-start',
            color: '#8b5cf6',
            position: 'single',
            projectId: project.id
          })
        }
        
        // Project creation date (only if no other dates are set)
        if (!project.startDate && project.createdAt && isSameDay(new Date(project.createdAt), date)) {
          events.push({
            id: `project-created-${project.id}`,
            title: `${cleanTitle} (Created)`,
            type: 'project-created',
            color: '#6366f1',
            position: 'single',
            projectId: project.id
          })
        }
      })
    }
    
    return events
  }

  const getCampaignEventsForDate = (date: Date) => {
    const events: Array<{ 
      id: string
      title: string
      type: string
      color: string
      position?: 'start' | 'middle' | 'end' | 'single'
      campaignId: string
    }> = []
    
    const relevantCampaigns = activeCampaignId
      ? campaigns.filter(c => c.id === activeCampaignId)
      : campaigns

    relevantCampaigns.forEach(campaign => {
      // Remove emojis from campaign title
      const cleanTitle = campaign.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
      
      // Planning Phase (Planning Start to Launch)
      if (campaign.startDate && campaign.startDate) {
        const planningStart = new Date(campaign.startDate)
        const launchDate = new Date(campaign.startDate)
        if (isWithinInterval(date, { start: planningStart, end: launchDate })) {
          const isStart = isSameDay(date, planningStart)
          const isEnd = isSameDay(date, launchDate)
          const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
          events.push({
            id: `campaign-planning-${campaign.id}`,
            title: `${cleanTitle} (Planning)`,
            type: 'campaign-planning',
            color: '#3b82f6',
            position,
            campaignId: campaign.id
          })
        }
      } else if (campaign.startDate && isSameDay(new Date(campaign.startDate), date)) {
        // Single planning start date (no launch date set)
        events.push({
          id: `campaign-planning-${campaign.id}`,
          title: `${cleanTitle} (Planning Start)`,
          type: 'campaign-planning',
          color: '#3b82f6',
          position: 'single',
          campaignId: campaign.id
        })
      }
      
      // Active Phase (Launch to End)
      if (campaign.startDate && campaign.endDate) {
        const launchDate = new Date(campaign.startDate)
        const endDate = new Date(campaign.endDate)
        if (isWithinInterval(date, { start: launchDate, end: endDate })) {
          const isStart = isSameDay(date, launchDate)
          const isEnd = isSameDay(date, endDate)
          const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
          events.push({
            id: `campaign-active-${campaign.id}`,
            title: `${cleanTitle} (Active)`,
            type: 'campaign-active',
            color: '#10b981',
            position,
            campaignId: campaign.id
          })
        }
      } else if (campaign.startDate && !campaign.endDate && isSameDay(new Date(campaign.startDate), date)) {
        // Single launch date (no end date set)
        events.push({
          id: `campaign-launch-${campaign.id}`,
          title: `${cleanTitle} (Launch)`,
          type: 'campaign-launch',
          color: '#10b981',
          position: 'single',
          campaignId: campaign.id
        })
      }
      
      // Follow-up Phase (End to Follow-up)
      if (campaign.endDate && campaign.endDate) {
        const endDate = new Date(campaign.endDate)
        const followUpDate = new Date(campaign.endDate)
        if (isWithinInterval(date, { start: endDate, end: followUpDate })) {
          const isStart = isSameDay(date, endDate)
          const isEnd = isSameDay(date, followUpDate)
          const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
          events.push({
            id: `campaign-followup-${campaign.id}`,
            title: `${cleanTitle} (Follow-up)`,
            type: 'campaign-followup',
            color: '#06b6d4',
            position,
            campaignId: campaign.id
          })
        }
      } else if (campaign.endDate && !campaign.endDate && isSameDay(new Date(campaign.endDate), date)) {
        // Single follow-up date
        events.push({
          id: `campaign-followup-${campaign.id}`,
          title: `${cleanTitle} (Follow-up)`,
          type: 'campaign-followup',
          color: '#06b6d4',
          position: 'single',
          campaignId: campaign.id
        })
      }
      
      // Campaign creation date (if no other dates set)
      if (campaign.createdAt && 
          !campaign.startDate && 
          !campaign.startDate && 
          isSameDay(new Date(campaign.createdAt), date)) {
        events.push({
          id: `campaign-created-${campaign.id}`,
          title: `${cleanTitle} (Created)`,
          type: 'campaign-created',
          color: '#6366f1',
          position: 'single',
          campaignId: campaign.id
        })
      }
    })
    
    return events
  }

  const getStageDatesForDate = (date: Date): Array<StageDate & { position: 'start' | 'middle' | 'end' | 'single', source?: string }> => {
    const stages: Array<StageDate & { position: 'start' | 'middle' | 'end' | 'single', source?: string }> = []

    // Always show project stages regardless of active campaign
    projects.forEach(project => {
      project.stageDates?.forEach(stage => {
        const stageStart = new Date(stage.startDate)
        const stageEnd = new Date(stage.endDate)
        if (isWithinInterval(date, { start: stageStart, end: stageEnd })) {
          const isStart = isSameDay(date, stageStart)
          const isEnd = isSameDay(date, stageEnd)
          const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
          stages.push({ ...stage, position, source: `Project: ${project.title}` })
        }
      })
    })

    if (activeCampaignId) {
      const campaign = campaigns.find(c => c.id === activeCampaignId)
      if (campaign?.stageDates) {
        campaign.stageDates.forEach(stage => {
          const stageStart = new Date(stage.startDate)
          const stageEnd = new Date(stage.endDate)
          if (isWithinInterval(date, { start: stageStart, end: stageEnd })) {
            const isStart = isSameDay(date, stageStart)
            const isEnd = isSameDay(date, stageEnd)
            const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
            stages.push({ ...stage, position, source: campaign.title })
          }
        })
      }
    } else if (viewLevel === 'all') {
      campaigns.forEach(campaign => {
        campaign.stageDates?.forEach(stage => {
          const stageStart = new Date(stage.startDate)
          const stageEnd = new Date(stage.endDate)
          if (isWithinInterval(date, { start: stageStart, end: stageEnd })) {
            const isStart = isSameDay(date, stageStart)
            const isEnd = isSameDay(date, stageEnd)
            const position = isStart && isEnd ? 'single' : isStart ? 'start' : isEnd ? 'end' : 'middle'
            stages.push({ ...stage, stageName: `${campaign.title}: ${stage.stageName}`, position })
          }
        })
      })
    }

    return stages
  }

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const handleToday = () => setCurrentDate(new Date())

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null

  return (
    <div className="h-full flex flex-col bg-background">
      {activeCampaign?.archived && (
        <Alert className="m-4 mb-0 border-orange-500 bg-orange-50 dark:bg-orange-950">
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
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <CaretLeft size={16} weight="bold" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <CaretRight size={16} weight="bold" />
            </Button>
            <h3 className="text-lg font-semibold ml-2">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
          </div>

          <Select value={calendarMode} onValueChange={(v) => setCalendarMode(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter calendar..." />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {/* Basic modes */}
              <SelectItem value="both">All Events</SelectItem>
              <SelectItem value="tasks">Tasks Only</SelectItem>
              <SelectItem value="stages">Stage Dates Only</SelectItem>
              
              {/* Projects */}
              {projects.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Projects</div>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={`project:${project.id}`}>
                      📁 {project.title}
                    </SelectItem>
                  ))}
                </>
              )}
              
              {/* Campaigns */}
              {campaigns.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Campaigns</div>
                  {campaigns.map(campaign => (
                    <SelectItem key={campaign.id} value={`campaign:${campaign.id}`}>
                      🎯 {campaign.title}
                    </SelectItem>
                  ))}
                </>
              )}
              
              {/* Stage Names */}
              {allStageNames.size > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Stage Names</div>
                  {Array.from(allStageNames).sort().map(stageName => (
                    <SelectItem key={stageName} value={`stage:${stageName}`}>
                      📅 {stageName}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const dayTasks = getTasksForDate(day)
              const spanningTasks = getTasksSpanningDate(day)
              const dayStages = getStageDatesForDate(day)
              const projectEvents = getProjectEventsForDate(day)
              const campaignEvents = getCampaignEventsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, new Date())
              
              // Determine what to show based on filter mode
              const isBasicMode = ['tasks', 'stages', 'both'].includes(calendarMode)
              const isProjectFilter = calendarMode.startsWith('project:')
              const isCampaignFilter = calendarMode.startsWith('campaign:')
              const isStageFilter = calendarMode.startsWith('stage:')
              
              let showTasks = false
              let showStages = false
              let showEvents = false
              let filteredStages = dayStages
              let filteredCampaigns = campaignEvents
              let filteredProjects = projectEvents
              
              if (isBasicMode) {
                showTasks = calendarMode === 'tasks' || calendarMode === 'both'
                showStages = calendarMode === 'stages' || calendarMode === 'both'
                showEvents = calendarMode === 'stages' || calendarMode === 'both'
              } else if (isProjectFilter) {
                const projectId = calendarMode.split(':')[1]
                showStages = true
                showEvents = true
                showTasks = false
                filteredProjects = projectEvents.filter(e => e.projectId === projectId)
                filteredStages = dayStages.filter(s => {
                  const project = projects.find(p => p.id === projectId)
                  return project?.stageDates?.some(sd => sd.id === s.id)
                })
              } else if (isCampaignFilter) {
                const campaignId = calendarMode.split(':')[1]
                showStages = true
                showEvents = true
                showTasks = true
                filteredCampaigns = campaignEvents.filter(e => e.campaignId === campaignId)
                filteredStages = dayStages.filter(s => {
                  const campaign = campaigns.find(c => c.id === campaignId)
                  return campaign?.stageDates?.some(sd => sd.id === s.id)
                })
              } else if (isStageFilter) {
                const stageName = calendarMode.split(':')[1]
                showStages = true
                showEvents = false
                showTasks = false
                filteredStages = dayStages.filter(s => s.stageName === stageName)
              }

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[120px] p-2 rounded-lg border transition-colors',
                    isCurrentMonth ? 'bg-card' : 'bg-muted/30',
                    isToday && 'ring-2 ring-accent'
                  )}
                >
                  <div className={cn(
                    'text-xs font-medium mb-2',
                    isToday && 'text-accent font-semibold',
                    !isCurrentMonth && 'text-muted-foreground'
                  )}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {showEvents && filteredProjects.map((event) => (
                      <button
                        key={event.id}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (onProjectClick) {
                            onProjectClick(event.projectId)
                          } else {
                            console.error('onProjectClick is not defined')
                          }
                        }}
                        className="w-full text-left text-[10px] px-1.5 py-1 rounded font-medium transition-all cursor-pointer hover:bg-opacity-40 active:scale-[0.98]"
                        style={{
                          backgroundColor: `${event.color}20`,
                          borderLeft: `3px solid ${event.color}`,
                          borderRight: `3px solid ${event.color}`,
                          borderTop: `2px solid ${event.color}80`,
                          borderBottom: `2px solid ${event.color}80`,
                          color: event.color,
                          minHeight: '22px'
                        }}
                        title={`${event.title} - Click to edit`}
                      >
                        <span className="block w-full truncate font-semibold">{event.title}</span>
                      </button>
                    ))}

                    {showEvents && filteredCampaigns.map((event) => {
                      const roundedCorners = event.position === 'single' 
                        ? 'rounded' 
                        : event.position === 'start' 
                        ? 'rounded-l' 
                        : event.position === 'end' 
                        ? 'rounded-r' 
                        : 'rounded-none'
                      
                      // Extract campaign name without phase
                      const campaignName = event.title.replace(/\s*\([^)]*\)\s*$/g, '').trim()
                      
                      return (
                        <button
                          key={event.id}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (onCampaignClick) {
                              onCampaignClick(event.campaignId)
                            } else {
                              console.error('onCampaignClick is not defined')
                            }
                          }}
                          className={cn(
                            "w-full text-left text-[10px] px-1.5 py-1 font-medium relative transition-all cursor-pointer hover:bg-opacity-40 active:scale-[0.98]",
                            roundedCorners
                          )}
                          style={{
                            backgroundColor: `${event.color}20`,
                            borderLeft: event.position === 'start' || event.position === 'single' ? `3px solid ${event.color}` : 'none',
                            borderRight: event.position === 'end' || event.position === 'single' ? `3px solid ${event.color}` : 'none',
                            borderTop: `2px solid ${event.color}80`,
                            borderBottom: `2px solid ${event.color}80`,
                            color: event.color,
                            minHeight: '22px'
                          }}
                          title={`${event.title} - Click to edit`}
                        >
                          {event.position === 'start' || event.position === 'single' ? (
                            <span className="block w-full truncate font-semibold leading-tight">{event.title}</span>
                          ) : event.position === 'middle' ? (
                            <span className="block w-full text-center font-semibold leading-tight">{campaignName.substring(0, 3).toUpperCase()}</span>
                          ) : (
                            <span className="block w-full text-right font-semibold text-[9px] leading-tight">END</span>
                          )}
                        </button>
                      )
                    })}

                    {showStages && filteredStages.map((stage, idx) => {
                      const roundedCorners = stage.position === 'single' 
                        ? 'rounded' 
                        : stage.position === 'start' 
                        ? 'rounded-l' 
                        : stage.position === 'end' 
                        ? 'rounded-r' 
                        : 'rounded-none'
                      
                      const borderStyle = stage.position === 'start' || stage.position === 'single'
                        ? `3px solid ${stage.color}`
                        : stage.position === 'end'
                        ? `3px solid ${stage.color}`
                        : 'none'
                      
                      // Remove emojis from stage name
                      const cleanStageName = stage.stageName.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
                      
                      // Determine what to show based on position
                      let content
                      if (stage.position === 'start' || stage.position === 'single') {
                        // Show FULL NAME on start and single
                        content = <span className="block w-full truncate font-semibold leading-tight">{cleanStageName}</span>
                      } else if (stage.position === 'middle') {
                        // Show ABBREVIATION on middle
                        content = <span className="block w-full text-center font-semibold leading-tight">{cleanStageName.substring(0, 3).toUpperCase()}</span>
                      } else {
                        // Show "END" on end
                        content = <span className="block w-full text-right font-semibold text-[9px] leading-tight">END</span>
                      }
                      
                      return (
                        <button
                          key={`${stage.id}-${idx}`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            // Find parent campaign/project and open edit dialog
                            const parentCampaign = campaigns.find(c => 
                              c.stageDates?.some(sd => sd.id === stage.id)
                            )
                            const parentProject = projects.find(p => 
                              p.stageDates?.some(sd => sd.id === stage.id)
                            )
                            
                            if (parentCampaign) {
                              if (onCampaignClick) {
                                onCampaignClick(parentCampaign.id)
                              } else {
                                console.error('onCampaignClick is not defined')
                              }
                            } else if (parentProject) {
                              if (onProjectClick) {
                                onProjectClick(parentProject.id)
                              } else {
                                console.error('onProjectClick is not defined')
                              }
                            } else {
                              console.warn('No parent found for stage:', cleanStageName)
                            }
                          }}
                          className={cn(
                            "w-full text-left text-[10px] px-1.5 py-1 font-medium relative transition-all cursor-pointer hover:bg-opacity-40 active:scale-[0.98]",
                            roundedCorners
                          )}
                          style={{
                            backgroundColor: `${stage.color}30`,
                            borderLeft: stage.position === 'start' || stage.position === 'single' ? borderStyle : 'none',
                            borderRight: stage.position === 'end' || stage.position === 'single' ? `3px solid ${stage.color}` : 'none',
                            borderTop: `2px solid ${stage.color}80`,
                            borderBottom: `2px solid ${stage.color}80`,
                            color: stage.color,
                            minHeight: '22px'
                          }}
                          title={`${cleanStageName} (${stage.position}) - Click to edit`}
                        >
                          {content}
                        </button>
                      )
                    })}

                    {showTasks && spanningTasks.map(({ task, position, color, assignedUsers, currentStageName }) => {
                      const roundedCorners = position === 'single' 
                        ? 'rounded' 
                        : position === 'start' 
                        ? 'rounded-l' 
                        : position === 'end' 
                        ? 'rounded-r' 
                        : 'rounded-none'
                      
                      const showText = position === 'start' || position === 'single'
                      const showUserIcons = position === 'start' || position === 'single'
                      
                      // Remove emojis from title
                      const cleanTitle = task.title.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
                      
                      // Format display: "StageName: TaskName" or just "TaskName"
                      const displayText = currentStageName 
                        ? `${currentStageName}: ${cleanTitle}` 
                        : cleanTitle
                      
                      return (
                        <button
                          key={`${task.id}-${day.toISOString()}`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            
                            // Context-aware navigation based on active filters
                            if (filters.stageNames && filters.stageNames.length > 0) {
                              // Filtering by stages - show task detail
                              setSelectedTaskId(task.id)
                            } else if (filters.listIds && filters.listIds.length > 0) {
                              // Filtering by lists - show task detail  
                              setSelectedTaskId(task.id)
                            } else if (filters.campaignIds && filters.campaignIds.length > 0 && filters.campaignIds.length === 1) {
                              // Filtering by single campaign - navigate to campaign
                              const campaignId = filters.campaignIds[0]
                              if (onCampaignClick) {
                                onCampaignClick(campaignId)
                              }
                            } else if (filters.projectId && onProjectClick) {
                              // Filtering by project - navigate to project
                              onProjectClick(filters.projectId)
                            } else {
                              // Default - show task detail
                              setSelectedTaskId(task.id)
                            }
                          }}
                          className={cn(
                            "w-full text-left text-[10px] px-1.5 py-1 truncate font-medium relative transition-all cursor-pointer hover:bg-opacity-40 active:scale-[0.98]",
                            roundedCorners
                          )}
                          style={{
                            backgroundColor: `${color}20`,
                            borderLeft: position === 'start' || position === 'single' ? `3px solid ${color}` : 'none',
                            borderRight: position === 'end' || position === 'single' ? `3px solid ${color}` : 'none',
                            borderTop: `2px solid ${color}80`,
                            borderBottom: `2px solid ${color}80`,
                            color: color,
                            minHeight: '22px'
                          }}
                          title={`${displayText}${assignedUsers.length > 0 ? ` - ${assignedUsers.map(u => u.name).join(', ')}` : ''} - Click to edit`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            {showText ? (
                              <span className="truncate flex-1">{displayText}</span>
                            ) : position === 'middle' ? (
                              <span className="w-full text-center font-semibold">{cleanTitle.substring(0, 3).toUpperCase()}</span>
                            ) : position === 'end' ? (
                              <span className="w-full text-right text-[9px] font-semibold">END</span>
                            ) : null}
                            {showUserIcons && assignedUsers.length > 0 && (
                              <div className="flex -space-x-1">
                                {assignedUsers.slice(0, 3).map((user, idx) => (
                                  <div
                                    key={user.id}
                                    className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center text-[8px] font-semibold"
                                    style={{ 
                                      backgroundColor: `hsl(${(user.id.charCodeAt(0) * 137.5) % 360}, 70%, 60%)`,
                                      color: 'white',
                                      zIndex: assignedUsers.length - idx
                                    }}
                                    title={user.name}
                                  >
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                ))}
                                {assignedUsers.length > 3 && (
                                  <div
                                    className="w-4 h-4 rounded-full bg-muted border border-background flex items-center justify-center text-[7px] font-semibold"
                                    title={`+${assignedUsers.length - 3} more`}
                                  >
                                    +{assignedUsers.length - 3}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          campaigns={campaigns}
          lists={lists}
          projects={projects}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          orgId={orgId}
        />
      )}
    </div>
  )
}

