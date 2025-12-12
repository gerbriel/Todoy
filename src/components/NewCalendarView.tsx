import { useState } from 'react'
import { Campaign, Task, Project, Label, List, FilterState, User } from '@/lib/types'
import { CalendarGrid } from './Calendar/CalendarGrid'
import { CalendarEvent } from './Calendar/types'
import { convertToCalendarEvents } from './Calendar/converters'
import { differenceInDays, addDays } from 'date-fns'
import { toast } from 'sonner'
import { tasksService } from '@/services/tasks.service'
import TaskDetailDialog from './TaskDetailDialog'

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
  users = [],
  viewLevel = 'campaign',
  onCampaignClick,
  onProjectClick,
  orgId,
  setCampaigns,
  onNavigateBack,
}: NewCalendarViewProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
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
    
    // If it's a campaign, navigate to campaign
    if (event.type === 'campaign' && event.metadata.campaignId && onCampaignClick) {
      onCampaignClick(event.metadata.campaignId)
    }
    
    // If it's a project, navigate to project
    if (event.type === 'project' && event.metadata.projectId && onProjectClick) {
      onProjectClick(event.metadata.projectId)
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
    if (!event) return
    
    try {
      // Handle task resizes (just update due date)
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
      
      // TODO: Handle campaign and project resizes
      
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
    </>
  )
}
