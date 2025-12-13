import { useState } from 'react'
import { Campaign, Task, Project, Label, List, FilterState, User } from '@/lib/types'
import { CalendarGrid } from './Calendar/CalendarGrid'
import { CalendarEvent } from './Calendar/types'
import { convertToCalendarEvents } from './Calendar/converters'
import { differenceInDays, addDays, startOfDay } from 'date-fns'
import { toast } from 'sonner'
import { tasksService } from '@/services/tasks.service'
import { campaignsService } from '@/services/campaigns.service'
import { projectsService } from '@/services/projects.service'
import TaskDetailDialog from './TaskDetailDialog'
import CampaignEditDialog from './CampaignEditDialog'
import ProjectEditDialog from './ProjectEditDialog'
import UnscheduledItemsSidebar from './Calendar/UnscheduledItemsSidebar'

interface NewCalendarViewProps {
  campaigns: Campaign[]
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  lists: List[]
  activeCampaignId: string | null
  filters: FilterState
  projects?: Project[]
  setProjects?: (updater: (projects: Project[]) => Project[]) => void
  users?: User[]
  viewLevel?: 'campaign' | 'project' | 'all'
  onCampaignClick?: (campaignId: string) => void
  onProjectClick?: (projectId: string) => void
  orgId: string
  setCampaigns?: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  onNavigateBack?: () => void
}

export default function NewCalendarView({
  campaigns,
  tasks,
  setTasks,
  labels,
  setLabels,
  lists,
  activeCampaignId,
  filters,
  projects = [],
  setProjects,
  users = [],
  viewLevel = 'campaign',
  onCampaignClick,
  onProjectClick,
  orgId,
  setCampaigns,
  onNavigateBack,
}: NewCalendarViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Convert data to calendar events
  const filteredTasks = activeCampaignId 
    ? tasks.filter(t => t.campaignId === activeCampaignId)
    : tasks
  
  const filteredCampaigns = activeCampaignId
    ? campaigns.filter(c => c.id === activeCampaignId)
    : campaigns
  
  console.log('[Calendar Render] Converting', filteredTasks.length, 'tasks to events')
  
  const calendarEvents = convertToCalendarEvents(
    filteredTasks,
    filteredCampaigns,
    projects
  )
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    
    // If it's a task, open the task detail dialog
    if (event.type === 'task' && event.metadata.taskId) {
      setSelectedTaskId(event.metadata.taskId)
    }
    
    // If it's a campaign or stage with campaignId, open campaign dialog
    if ((event.type === 'campaign' || event.type === 'stage') && event.metadata.campaignId) {
      setSelectedCampaignId(event.metadata.campaignId)
    }
    
    // If it's a project or project stage, open project dialog
    if (event.type === 'project' && event.metadata.projectId) {
      setSelectedProjectId(event.metadata.projectId)
    }
  }
  
  const handleEventMove = async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    const event = calendarEvents.find(e => e.id === eventId)
    if (!event) return
    
    console.log('🎯 Event Move:', { 
      eventId, 
      type: event.type, 
      newStartDate: newStartDate.toISOString(), 
      newEndDate: newEndDate.toISOString(),
      hasCampaignId: !!event.metadata.campaignId,
      hasProjectId: !!event.metadata.projectId,
      hasSetCampaigns: !!setCampaigns,
      hasSetProjects: !!setProjects
    })
    
    try {
      // Handle task moves - update both startDate and dueDate
      if (event.type === 'task' && event.metadata.taskId) {
        await tasksService.update(event.metadata.taskId, {
          startDate: newStartDate.toISOString(),
          dueDate: newEndDate.toISOString()
        })
        
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === event.metadata.taskId 
              ? { ...t, startDate: newStartDate.toISOString(), dueDate: newEndDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task dates updated')
        return
      }
      
      // Handle campaign phase moves
      if (event.type === 'campaign' && event.metadata.campaignId && setCampaigns) {
        console.log('📅 Campaign Move Detected:', { eventId, campaignId: event.metadata.campaignId })
        const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
        if (!campaign) {
          console.log('❌ Campaign not found in campaigns array')
          return
        }
        console.log('✅ Campaign found:', campaign.title)
        
        const updates: Partial<Campaign> = {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        }
        
        console.log(' Updating campaign with:', updates)
        await campaignsService.update(event.metadata.campaignId, updates)
        console.log('✅ Database updated')
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(c =>
            c.id === event.metadata.campaignId ? { ...c, ...updates } : c
          )
        )
        console.log('✅ State updated')
        
        toast.success('Campaign dates updated')
        return
      }
      
      // Handle project moves
      if (event.type === 'project' && event.metadata.projectId && setProjects) {
        await projectsService.update(event.metadata.projectId, {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        })
        
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === event.metadata.projectId
              ? { ...p, startDate: newStartDate.toISOString(), endDate: newEndDate.toISOString() }
              : p
          )
        )
        
        toast.success('Project dates updated')
        return
      }
      
      // Handle stage moves (campaign stages shown on calendar)
      if (event.type === 'stage' && event.metadata.stageId) {
        console.log('📊 Stage Move Detected:', { stageId: event.metadata.stageId, campaignId: event.metadata.campaignId, projectId: event.metadata.projectId })
        
        // Handle campaign stage moves
        if (event.metadata.campaignId) {
          const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
          if (!campaign || !campaign.stageDates) {
            console.log('❌ Campaign or stageDates not found')
            return
          }
          
          const updatedStageDates = campaign.stageDates.map(stage => 
            stage.id === event.metadata.stageId
              ? { ...stage, startDate: newStartDate.toISOString(), endDate: newEndDate.toISOString() }
              : stage
          )
          
          console.log('💾 Updating campaign stage dates')
          await campaignsService.update(event.metadata.campaignId, {
            stageDates: updatedStageDates
          })
          
          if (setCampaigns) {
            setCampaigns(prevCampaigns =>
              prevCampaigns.map(c =>
                c.id === event.metadata.campaignId
                  ? { ...c, stageDates: updatedStageDates }
                  : c
              )
            )
          }
          
          console.log('✅ Campaign stage updated')
          toast.success('Stage dates updated')
          return
        }
        
        // Handle project stage moves
        if (event.metadata.projectId && setProjects) {
          const project = projects.find(p => p.id === event.metadata.projectId)
          if (!project || !project.stageDates) {
            console.log('❌ Project or stageDates not found')
            return
          }
          
          const updatedStageDates = project.stageDates.map(stage =>
            stage.id === event.metadata.stageId
              ? { ...stage, startDate: newStartDate.toISOString(), endDate: newEndDate.toISOString() }
              : stage
          )
          
          console.log('💾 Updating project stage dates')
          await projectsService.update(event.metadata.projectId, {
            stageDates: updatedStageDates
          })
          
          setProjects(prevProjects =>
            prevProjects.map(p =>
              p.id === event.metadata.projectId
                ? { ...p, stageDates: updatedStageDates }
                : p
            )
          )
          
          console.log('✅ Project stage updated')
          toast.success('Stage dates updated')
          return
        }
        
        console.log('❌ Stage has no campaignId or projectId')
        return
      }
      
    } catch (error) {
      console.error('Error moving event:', error)
      toast.error('Failed to update event')
    }
  }
  
  const handleEventResize = async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    const event = calendarEvents.find(e => e.id === eventId)
    if (!event) return
    
    try {
      // Handle task resizes - update both startDate and dueDate
      if (event.type === 'task' && event.metadata.taskId) {
        await tasksService.update(event.metadata.taskId, {
          startDate: newStartDate.toISOString(),
          dueDate: newEndDate.toISOString()
        })
        
        setTasks(prevTasks =>
          prevTasks.map(t => 
            t.id === event.metadata.taskId 
              ? { ...t, startDate: newStartDate.toISOString(), dueDate: newEndDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task dates updated')
        return
      }
      
      // Handle campaign phase resizes
      if (event.type === 'campaign' && event.metadata.campaignId) {
        const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
        if (!campaign) return
        
        const updates: Partial<Campaign> = {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        }
        
        await campaignsService.update(event.metadata.campaignId, updates)
        
        if (setCampaigns) {
          setCampaigns(prevCampaigns =>
            prevCampaigns.map(c =>
              c.id === event.metadata.campaignId
                ? { ...c, ...updates }
                : c
            )
          )
        }
        
        toast.success('Campaign dates updated')
      }
      
      // Handle project resizes
      if (event.type === 'project' && event.metadata.projectId) {
        await projectsService.update(event.metadata.projectId, {
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString()
        })
        
        if (setProjects) {
          setProjects(prevProjects =>
            prevProjects.map(p =>
              p.id === event.metadata.projectId
                ? { 
                    ...p, 
                    startDate: newStartDate.toISOString(),
                    endDate: newEndDate.toISOString()
                  }
                : p
            )
          )
        }
        
        toast.success('Project dates updated')
      }
      
      // Handle stage date resizes (for both campaigns and projects)
      if (event.type === 'stage' && event.metadata.stageId) {
        console.log('  -> Resizing stage:', event.metadata.stageId)
        
        if (event.metadata.campaignId) {
          console.log('  -> Campaign stage')
          const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
          if (campaign?.stageDates) {
            console.log('  -> Found campaign with stageDates')
            const updatedStageDates = campaign.stageDates.map(stage =>
              stage.id === event.metadata.stageId
                ? { 
                    ...stage, 
                    startDate: newStartDate.toISOString(),
                    endDate: newEndDate.toISOString()
                  }
                : stage
            )
            
            console.log('  -> Updating campaign stageDates')
            await campaignsService.update(event.metadata.campaignId, {
              stageDates: updatedStageDates
            })
            
            if (setCampaigns) {
              setCampaigns(prevCampaigns =>
                prevCampaigns.map(c =>
                  c.id === event.metadata.campaignId
                    ? { ...c, stageDates: updatedStageDates }
                    : c
                )
              )
            }
            
            console.log('  -> Campaign stage dates updated successfully')
            toast.success('Stage dates updated')
          } else {
            console.log('  -> Campaign not found or no stageDates')
          }
        } else if (event.metadata.projectId) {
          console.log('  -> Project stage')
          const project = projects.find(p => p.id === event.metadata.projectId)
          if (project?.stageDates) {
            console.log('  -> Found project with stageDates')
            const updatedStageDates = project.stageDates.map(stage =>
              stage.id === event.metadata.stageId
                ? { 
                    ...stage, 
                    startDate: newStartDate.toISOString(),
                    endDate: newEndDate.toISOString()
                  }
                : stage
            )
            
            console.log('  -> Updating project stageDates')
            await projectsService.update(event.metadata.projectId, {
              stageDates: updatedStageDates
            })
            
            if (setProjects) {
              setProjects(prevProjects =>
                prevProjects.map(p =>
                  p.id === event.metadata.projectId
                    ? { ...p, stageDates: updatedStageDates }
                    : p
                )
              )
            }
            
            console.log('  -> Project stage dates updated successfully')
            toast.success('Stage dates updated')
          } else {
            console.log('  -> Project not found or no stageDates')
          }
        } else {
          console.log('  -> Stage has no campaignId or projectId!')
        }
      } else {
        console.log('  -> Event type not handled:', event.type)
      }
      
    } catch (error) {
      console.error('Error resizing event:', error)
      toast.error('Failed to update event')
    }
  }
  
  const handleDateClick = (date: Date) => {
    console.log('Date clicked:', date)
    // TODO: Could open a "create event" dialog
  }
  
  const handleSidebarItemDrop = async (item: any, date: Date) => {
    console.log('📦 Sidebar item dropped:', item, 'on date:', date)
    
    try {
      const startDate = startOfDay(date)
      // Default to 1 day duration for new items
      const endDate = startOfDay(addDays(date, 1))
      
      if (item.type === 'task' && item.metadata.taskId) {
        await tasksService.update(item.metadata.taskId, {
          startDate: startDate.toISOString(),
          dueDate: endDate.toISOString()
        })
        
        setTasks(prevTasks =>
          prevTasks.map(t =>
            t.id === item.metadata.taskId
              ? { ...t, startDate: startDate.toISOString(), dueDate: endDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task scheduled')
      } else if (item.type === 'campaign' && item.metadata.campaignId && setCampaigns) {
        await campaignsService.update(item.metadata.campaignId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(c =>
            c.id === item.metadata.campaignId
              ? { ...c, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
              : c
          )
        )
        
        toast.success('Campaign scheduled')
      } else if (item.type === 'project' && item.metadata.projectId && setProjects) {
        await projectsService.update(item.metadata.projectId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
        
        setProjects(prevProjects =>
          prevProjects.map(p =>
            p.id === item.metadata.projectId
              ? { ...p, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
              : p
          )
        )
        
        toast.success('Project scheduled')
      } else if (item.type === 'stage' && item.metadata.stageId) {
        // Handle stage scheduling
        if (item.metadata.campaignId && setCampaigns) {
          const campaign = campaigns.find(c => c.id === item.metadata.campaignId)
          if (campaign) {
            const updatedStageDates = (campaign.stageDates || []).map(stage =>
              stage.id === item.metadata.stageId
                ? { ...stage, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
                : stage
            )
            
            await campaignsService.update(item.metadata.campaignId, {
              stageDates: updatedStageDates
            })
            
            setCampaigns(prevCampaigns =>
              prevCampaigns.map(c =>
                c.id === item.metadata.campaignId
                  ? { ...c, stageDates: updatedStageDates }
                  : c
              )
            )
            
            toast.success('Stage scheduled')
          }
        } else if (item.metadata.projectId && setProjects) {
          const project = projects.find(p => p.id === item.metadata.projectId)
          if (project) {
            const updatedStageDates = (project.stageDates || []).map(stage =>
              stage.id === item.metadata.stageId
                ? { ...stage, startDate: startDate.toISOString(), endDate: endDate.toISOString() }
                : stage
            )
            
            await projectsService.update(item.metadata.projectId, {
              stageDates: updatedStageDates
            })
            
            setProjects(prevProjects =>
              prevProjects.map(p =>
                p.id === item.metadata.projectId
                  ? { ...p, stageDates: updatedStageDates }
                  : p
              )
            )
            
            toast.success('Stage scheduled')
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling item:', error)
      toast.error('Failed to schedule item')
    }
  }
  
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const selectedCampaign = selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId) : null
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null
  
  return (
    <>
      <div className="flex h-full">
        <div className="flex-1 overflow-auto">
          <CalendarGrid
            events={calendarEvents}
            onEventClick={handleEventClick}
            onEventMove={handleEventMove}
            onEventResize={handleEventResize}
            onDateClick={handleDateClick}
            onSidebarItemDrop={handleSidebarItemDrop}
          />
        </div>
        
        <UnscheduledItemsSidebar
          campaigns={filteredCampaigns}
          projects={projects}
          tasks={filteredTasks}
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          setTasks={setTasks}
        />
      </div>
      
      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          lists={lists}
          campaigns={campaigns}
          projects={projects}
          open={!!selectedTaskId}
          onOpenChange={(open) => !open && setSelectedTaskId(null)}
          orgId={orgId}
        />
      )}
      
      {selectedCampaign && setCampaigns && (
        <CampaignEditDialog
          campaign={selectedCampaign}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          projects={projects}
          lists={lists}
          setLists={undefined}
          setTasks={setTasks}
          open={!!selectedCampaignId}
          onOpenChange={(open) => !open && setSelectedCampaignId(null)}
        />
      )}
      
      {selectedProject && setProjects && setCampaigns && (
        <ProjectEditDialog
          project={selectedProject}
          projects={projects}
          setProjects={setProjects}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          open={!!selectedProjectId}
          onOpenChange={(open) => !open && setSelectedProjectId(null)}
        />
      )}
    </>
  )
}
