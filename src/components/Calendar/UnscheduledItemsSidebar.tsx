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
  Flag
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { tasksService } from '@/services/tasks.service'
import { toast } from 'sonner'
import { addDays } from 'date-fns'

interface UnscheduledItemsSidebarProps {
  campaigns: Campaign[]
  projects: Project[]
  tasks: Task[]
  isCollapsed: boolean
  onToggle: () => void
  setTasks?: (tasks: Task[] | ((prev: Task[]) => Task[])) => void
}

interface DraggableItemProps {
  id: string
  type: 'campaign' | 'project' | 'task' | 'stage'
  title: string
  icon: React.ReactNode
  color?: string
  metadata?: any
}

const DraggableItem = ({ id, type, title, icon, color, metadata }: DraggableItemProps) => {
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
    </div>
  )
}

export default function UnscheduledItemsSidebar({
  campaigns,
  projects,
  tasks,
  isCollapsed,
  onToggle,
  setTasks
}: UnscheduledItemsSidebarProps) {
  const [expandedSections, setExpandedSections] = useState({
    campaigns: true,
    projects: true,
    tasks: true,
    stages: true
  })
  const [isAutoScheduling, setIsAutoScheduling] = useState(false)

  // Filter items without dates
  const unscheduledCampaigns = campaigns.filter(c => !c.startDate && !c.endDate)
  const unscheduledProjects = projects.filter(p => !p.startDate && !p.endDate)
  const unscheduledTasks = tasks.filter(t => !t.startDate && !t.dueDate)
  
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

  const totalUnscheduled = 
    unscheduledCampaigns.length + 
    unscheduledProjects.length + 
    unscheduledTasks.length + 
    unscheduledStages.length

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
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-muted-foreground" />
          <h3 className="font-semibold">Unscheduled Items</h3>
          {totalUnscheduled > 0 && (
            <Badge variant="secondary">{totalUnscheduled}</Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <CaretRight size={20} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
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
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      </div>

      {/* Footer hint */}
      {totalUnscheduled > 0 && (
        <div className="p-4 border-t bg-muted/30 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center break-words">
            💡 Drag items onto the calendar to assign dates
          </p>
        </div>
      )}
    </div>
  )
}
