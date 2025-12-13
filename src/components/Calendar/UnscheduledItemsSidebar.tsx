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
  Lightning
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
  isCollapsed: boolean
  onToggle: () => void
  setTasks?: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
  setCampaigns?: (campaigns: Campaign[] | ((prev: Campaign[]) => Campaign[])) => void
  setProjects?: (projects: Project[] | ((prev: Project[]) => Project[])) => void
}

interface DraggableItemProps {
  id: string
  type: 'campaign' | 'project' | 'task' | 'stage'
  title: string
  icon: React.ReactNode
  color?: string
  metadata?: any
  actionButton?: React.ReactNode
}

const DraggableItem = ({ id, type, title, icon, color, metadata, actionButton }: DraggableItemProps) => {
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

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "flex items-start gap-2 p-2 rounded-md cursor-move",
        "hover:bg-accent transition-colors",
        "border border-transparent hover:border-border"
      )}
      style={{ borderLeftColor: color, borderLeftWidth: color ? 3 : 1 }}
    >
      <div className="text-muted-foreground flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <span className="text-sm flex-1 break-words leading-snug">{title}</span>
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
  isCollapsed,
  onToggle,
  setTasks,
  setCampaigns,
  setProjects
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
  const [isAutoScheduling, setIsAutoScheduling] = useState(false)
  const [activeView, setActiveView] = useState<'unscheduled' | 'scheduled'>('unscheduled')

  // Filter items without dates
  const unscheduledCampaigns = campaigns.filter(c => !c.startDate && !c.endDate)
  const unscheduledProjects = projects.filter(p => !p.startDate && !p.endDate)
  const unscheduledTasks = tasks.filter(t => !t.startDate && !t.dueDate)
  
  // Filter items WITH dates (scheduled)
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

  const handleReassignCampaign = async (campaign: Campaign) => {
    if (!setCampaigns) {
      toast.error('Reassign function not available')
      return
    }

    // Find the project this campaign belongs to
    const project = projects.find(p => p.id === campaign.projectId)
    
    if (!campaign.projectId) {
      toast.error('Campaign must be assigned to a project to reassign')
      return
    }
    
    if (!project) {
      toast.error('Project not found')
      return
    }
    
    if (!project.startDate || !project.endDate) {
      toast.error('Project must have start and end dates assigned first')
      return
    }

    try {
      // Reassign campaign to the start of the project with 1 day duration
      const startDate = new Date(project.startDate)
      const endDate = addDays(startDate, 1)

      await campaignsService.update(campaign.id, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })

      // Update local state
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c =>
          c.id === campaign.id
            ? { ...c, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
            : c
        )
      )

      toast.success(`Campaign reassigned to ${project.title} start date`)
    } catch (error) {
      console.error('Error reassigning campaign:', error)
      toast.error('Failed to reassign campaign')
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

  const handleReassignAll = async () => {
    if (!setCampaigns || !setTasks) {
      toast.error('Reassign function not available')
      return
    }

    setIsAutoScheduling(true)
    let campaignsReassigned = 0
    let tasksReassigned = 0
    let skipped = 0

    try {
      // Reassign all campaigns to their project start dates
      for (const campaign of scheduledCampaigns) {
        const project = projects.find(p => p.id === campaign.projectId)
        
        if (!campaign.projectId || !project || !project.startDate || !project.endDate) {
          skipped++
          continue
        }

        const startDate = new Date(project.startDate)
        const endDate = addDays(startDate, 1)

        await campaignsService.update(campaign.id, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })

        setCampaigns(prevCampaigns =>
          prevCampaigns.map(c =>
            c.id === campaign.id
              ? { ...c, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
              : c
          )
        )

        campaignsReassigned++
      }

      // Reassign all tasks to their campaign start dates
      for (const task of scheduledTasks) {
        const campaign = campaigns.find(c => c.id === task.campaignId)
        
        if (!task.campaignId || !campaign || !campaign.startDate || !campaign.endDate) {
          skipped++
          continue
        }

        const startDate = new Date(campaign.startDate)
        const dueDate = addDays(startDate, 1)

        await tasksService.update(task.id, {
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString()
        })

        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === task.id
              ? { ...t, startDate: startDate.toISOString(), dueDate: dueDate.toISOString() }
              : t
          )
        )

        tasksReassigned++
      }

      if (campaignsReassigned > 0 || tasksReassigned > 0) {
        toast.success(`Reassigned ${campaignsReassigned} campaign(s) and ${tasksReassigned} task(s)`)
      }
      if (skipped > 0) {
        toast.warning(`Skipped ${skipped} item(s) (missing parent dates)`)
      }
    } catch (error) {
      console.error('Error reassigning items:', error)
      toast.error('Failed to reassign items')
    } finally {
      setIsAutoScheduling(false)
    }
  }

  const totalUnscheduled = 
    unscheduledCampaigns.length + 
    unscheduledProjects.length + 
    unscheduledTasks.length + 
    unscheduledStages.length
  
  const totalScheduled =
    scheduledProjects.length +
    scheduledCampaigns.length +
    scheduledTasks.length

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
    <div className="border-l bg-background w-80 flex flex-col h-full overflow-hidden">
      {/* Header with Toggle Buttons */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Items</h3>
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <CaretRight size={20} />
          </Button>
        </div>
        
        {/* View Toggle Buttons */}
        <div className="flex gap-2">
          <Button
            variant={activeView === 'unscheduled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('unscheduled')}
            className="flex-1"
          >
            Unscheduled
            {totalUnscheduled > 0 && (
              <Badge variant={activeView === 'unscheduled' ? 'secondary' : 'outline'} className="ml-2">
                {totalUnscheduled}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeView === 'scheduled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveView('scheduled')}
            className="flex-1"
          >
            Scheduled
            {totalScheduled > 0 && (
              <Badge variant={activeView === 'scheduled' ? 'secondary' : 'outline'} className="ml-2">
                {totalScheduled}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
          
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
                    className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    {expandedSections.campaigns ? (
                      <CaretDown size={16} />
                    ) : (
                      <CaretRight size={16} />
                    )}
                    <Target size={16} />
                    <span>Campaigns</span>
                    <Badge variant="secondary" className="ml-auto">
                      {unscheduledCampaigns.length}
                    </Badge>
                  </button>
                  {expandedSections.campaigns && (
                    <div className="space-y-1 ml-6">
                      {unscheduledCampaigns.map(campaign => (
                        <DraggableItem
                          key={campaign.id}
                          id={campaign.id}
                          type="campaign"
                          title={campaign.title}
                          icon={<Target size={16} />}
                          color="#10b981"
                          metadata={{ campaignId: campaign.id }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Projects */}
              {unscheduledProjects.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('projects')}
                    className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    {expandedSections.projects ? (
                      <CaretDown size={16} />
                    ) : (
                      <CaretRight size={16} />
                    )}
                    <Folder size={16} />
                    <span>Projects</span>
                    <Badge variant="secondary" className="ml-auto">
                      {unscheduledProjects.length}
                    </Badge>
                  </button>
                  {expandedSections.projects && (
                    <div className="space-y-1 ml-6">
                      {unscheduledProjects.map(project => (
                        <DraggableItem
                          key={project.id}
                          id={project.id}
                          type="project"
                          title={project.title}
                          icon={<Folder size={16} />}
                          color="#8b5cf6"
                          metadata={{ projectId: project.id }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Stages */}
              {unscheduledStages.length > 0 && (
                <div>
                  <button
                    onClick={() => toggleSection('stages')}
                    className="flex items-center gap-2 w-full text-sm font-medium mb-2 hover:text-foreground text-muted-foreground transition-colors"
                  >
                    {expandedSections.stages ? (
                      <CaretDown size={16} />
                    ) : (
                      <CaretRight size={16} />
                    )}
                    <Flag size={16} />
                    <span>Stages</span>
                    <Badge variant="secondary" className="ml-auto">
                      {unscheduledStages.length}
                    </Badge>
                  </button>
                  {expandedSections.stages && (
                    <div className="space-y-1 ml-6">
                      {unscheduledStages.map(stage => (
                        <DraggableItem
                          key={stage.id}
                          id={stage.id}
                          type="stage"
                          title={`${stage.stageName} (${stage.parentTitle})`}
                          icon={<Flag size={16} />}
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
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => toggleSection('tasks')}
                      className="flex items-center gap-2 flex-1 text-sm font-medium hover:text-foreground text-muted-foreground transition-colors"
                    >
                      {expandedSections.tasks ? (
                        <CaretDown size={16} />
                      ) : (
                        <CaretRight size={16} />
                      )}
                      <CheckSquare size={16} />
                      <span>Tasks</span>
                      <Badge variant="secondary" className="ml-auto">
                        {unscheduledTasks.length}
                      </Badge>
                    </button>
                    {setTasks && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAutoScheduleTasks}
                        disabled={isAutoScheduling}
                        className="h-7 text-xs"
                        title="Auto-schedule all tasks within their campaign date ranges"
                      >
                        {isAutoScheduling ? 'Scheduling...' : 'Auto-schedule'}
                      </Button>
                    )}
                  </div>
                  {expandedSections.tasks && (
                    <div className="space-y-1 ml-6">
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
                            icon={<CheckSquare size={16} />}
                            metadata={{ taskId: task.id }}
                            actionButton={
                              setTasks && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => handleAutoScheduleTask(task)}
                                  title="Auto-schedule this task to campaign start date"
                                >
                                  <Lightning size={14} weight="fill" />
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

                  {/* Scheduled Projects */}
                  {scheduledProjects.length > 0 && (
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
                        return (
                          <div key={project.id} className="space-y-1">
                            <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border-l-2" style={{ borderLeftColor: '#8b5cf6' }}>
                              <Folder size={14} className="text-muted-foreground flex-shrink-0" />
                              <span className="text-xs font-medium flex-1 break-words">{project.title}</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-5 w-5"
                                title="Projects cannot be auto-reassigned"
                                disabled
                              >
                                <Lightning size={12} className="opacity-30" />
                              </Button>
                            </div>
                            
                            {/* Campaigns under this project */}
                            {projectCampaigns.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {projectCampaigns.map(campaign => {
                                  const campaignTasks = scheduledTasks.filter(t => t.campaignId === campaign.id)
                                  return (
                                    <div key={campaign.id} className="space-y-1">
                                      <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border-l-2" style={{ borderLeftColor: '#10b981' }}>
                                        <Target size={12} className="text-muted-foreground flex-shrink-0" />
                                        <span className="text-xs flex-1 break-words">{campaign.title}</span>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-5 w-5"
                                          onClick={() => handleReassignCampaign(campaign)}
                                          title="Reassign campaign to project start date"
                                        >
                                          <Lightning size={12} weight="fill" />
                                        </Button>
                                      </div>
                                      
                                      {/* Tasks under this campaign */}
                                      {campaignTasks.length > 0 && (
                                        <div className="ml-4 space-y-1">
                                          {campaignTasks.map(task => (
                                            <div key={task.id} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50 border-l-2 border-transparent hover:border-border">
                                              <CheckSquare size={10} className="text-muted-foreground flex-shrink-0" />
                                              <span className="text-xs flex-1 break-words truncate">{task.title}</span>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-4 w-4"
                                                onClick={() => handleReassignTask(task)}
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
