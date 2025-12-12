import { useState } from 'react'
import { Campaign, Task, Project, Label, List, FilterState, User } from '@/lib/types'
import { CalendarGrid } from './Calendar/CalendarGrid'
import { CalendarEvent } from './Calendar/types'
import { convertToCalendarEvents } from './Calendar/converters'
import { differenceInDays, addDays } from 'date-fns'
import { toast } from 'sonner'
import { tasksService } from '@/services/tasks.service'
import { campaignsService } from '@/services/campaigns.service'
import { projectsService } from '@/services/projects.service'
import TaskDetailDialog from './TaskDetailDialog'
import CampaignEditDialog from './CampaignEditDialog'
import ProjectEditDialog from './ProjectEditDialog'

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
  
  // Convert data to calendar events
  const filteredTasks = activeCampaignId 
    ? tasks.filter(t => t.campaignId === activeCampaignId)
    : tasks
  
  const filteredCampaigns = activeCampaignId
    ? campaigns.filter(c => c.id === activeCampaignId)
    : campaigns
  
  const calendarEvents = convertToCalendarEvents(
    filteredTasks,
    filteredCampaigns,
    projects
  )
  
  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event)
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
  
  const handleEventMove = async (eventId: string, newStartDate: Date) => {
    console.log('Moving event:', eventId, 'to', newStartDate)
    
    // Find the original event
    const event = calendarEvents.find(e => e.id === eventId)
    if (!event) return
    
    // Calculate the duration
    const duration = differenceInDays(event.endDate, event.startDate)
    const newEndDate = addDays(newStartDate, duration)
    
    try {
      // Handle task moves
      if (event.type === 'task' && event.metadata.taskId) {
        await tasksService.update(event.metadata.taskId, {
          dueDate: newEndDate.toISOString()
        })
        
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === event.metadata.taskId 
              ? { ...t, dueDate: newEndDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task date updated')
      }
      
      // TODO: Handle campaign and project moves
      // These would need corresponding service methods
      
    } catch (error) {
      console.error('Error moving event:', error)
      toast.error('Failed to update event')
    }
  }
  
  const handleEventResize = async (eventId: string, newStartDate: Date, newEndDate: Date) => {
    console.log('Resizing event:', eventId, newStartDate, newEndDate)
    
    const event = calendarEvents.find(e => e.id === eventId)
    if (!event) {
      console.log('  -> Event not found!')
      return
    }
    
    console.log('  -> Event type:', event.type, 'metadata:', event.metadata)
    
    try {
      // Handle task resizes (just update due date since tasks don't have start dates)
      if (event.type === 'task' && event.metadata.taskId) {
        console.log('  -> Updating task dueDate to:', newEndDate.toISOString())
        
        await tasksService.update(event.metadata.taskId, {
          dueDate: newEndDate.toISOString()
        })
        
        console.log('  -> Task service update successful')
        
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === event.metadata.taskId 
              ? { ...t, dueDate: newEndDate.toISOString() }
              : t
          )
        )
        
        toast.success('Task date updated')
      }
      
      // Handle campaign phase resizes
      if (event.type === 'campaign' && event.metadata.campaignId) {
        const campaign = campaigns.find(c => c.id === event.metadata.campaignId)
        if (!campaign) return
        
        const updates: Partial<Campaign> = {}
        
        // Determine which phase based on event ID
        if (eventId.includes('-planning-')) {
          updates.planningStartDate = newStartDate.toISOString()
          updates.launchDate = newEndDate.toISOString()
        } else if (eventId.includes('-active-')) {
          updates.launchDate = newStartDate.toISOString()
          updates.endDate = newEndDate.toISOString()
        } else if (eventId.includes('-followup-')) {
          updates.endDate = newStartDate.toISOString()
          updates.followUpDate = newEndDate.toISOString()
        }
        
        if (Object.keys(updates).length > 0) {
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
      }
      
      // Handle project resizes
      if (event.type === 'project' && event.metadata.projectId) {
        await projectsService.update(event.metadata.projectId, {
          startDate: newStartDate.toISOString(),
          targetEndDate: newEndDate.toISOString()
        })
        
        if (setProjects) {
          setProjects(prevProjects =>
            prevProjects.map(p =>
              p.id === event.metadata.projectId
                ? { 
                    ...p, 
                    startDate: newStartDate.toISOString(),
                    targetEndDate: newEndDate.toISOString()
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
  
  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const selectedCampaign = selectedCampaignId ? campaigns.find(c => c.id === selectedCampaignId) : null
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null
  
  return (
    <>
      <CalendarGrid
        events={calendarEvents}
        onEventClick={handleEventClick}
        onEventMove={handleEventMove}
        onEventResize={handleEventResize}
        onDateClick={handleDateClick}
      />
      
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
