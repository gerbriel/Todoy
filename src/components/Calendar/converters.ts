import { Campaign, Task, Project } from '@/lib/types'
import { CalendarEvent } from './types'
import { startOfDay } from 'date-fns'

/**
 * Convert tasks to calendar events
 */
export function tasksToCalendarEvents(tasks: Task[], campaigns: Campaign[] = []): CalendarEvent[] {
  const tasksWithDates = tasks.filter(t => t.dueDate)
  
  const events = tasksWithDates.map(task => {
      // Use startDate if available, otherwise use dueDate for both start and end
      const startDate = task.startDate 
        ? startOfDay(new Date(task.startDate))
        : startOfDay(new Date(task.dueDate!))
      const endDate = startOfDay(new Date(task.dueDate!))
      
      // Find campaign name for this task
      const campaign = campaigns.find(c => c.id === task.campaignId)
      const campaignName = campaign ? ` (${campaign.title})` : ''
      
      return {
        id: `task-${task.id}`,
        title: task.title + campaignName,
        startDate,
        endDate,
        color: task.completed ? '#10b981' : '#3b82f6',
        type: 'task' as const,
        metadata: {
          taskId: task.id,
          campaignId: task.campaignId,
          campaignName: campaign?.title,
          description: task.description,
          completed: task.completed,
          assignedTo: task.assignedTo
        }
      }
    })
  
  return events
}

/**
 * Convert campaigns to calendar events
 */
export function campaignsToCalendarEvents(campaigns: Campaign[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  
  campaigns.forEach(campaign => {
    // Main campaign event (startDate to endDate)
    if (campaign.startDate && campaign.endDate) {
      events.push({
        id: `campaign-${campaign.id}`,
        title: campaign.title,
        startDate: startOfDay(new Date(campaign.startDate)),
        endDate: startOfDay(new Date(campaign.endDate)),
        color: '#10b981',
        type: 'campaign' as const,
        metadata: {
          campaignId: campaign.id,
          description: campaign.description
        }
      })
    }
    
    // Stage dates
    campaign.stageDates?.forEach(stage => {
      events.push({
        id: `stage-${stage.id}`,
        title: `${campaign.title}: ${stage.stageName}`,
        startDate: startOfDay(new Date(stage.startDate)),
        endDate: startOfDay(new Date(stage.endDate)),
        color: stage.color || '#6366f1',
        type: 'stage' as const,
        metadata: {
          stageId: stage.id,
          campaignId: campaign.id,
          description: stage.stageName
        }
      })
    })
  })
  
  return events
}

/**
 * Convert projects to calendar events
 */
export function projectsToCalendarEvents(projects: Project[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  
  projects.forEach(project => {
    // Project event (startDate to endDate or actualEndDate)
    if (project.startDate && (project.endDate || project.actualEndDate)) {
      const endDate = project.actualEndDate || project.endDate!
      events.push({
        id: `project-${project.id}`,
        title: project.actualEndDate ? `${project.title} (Completed)` : `${project.title}`,
        startDate: startOfDay(new Date(project.startDate)),
        endDate: startOfDay(new Date(endDate)),
        color: project.actualEndDate ? '#10b981' : '#8b5cf6',
        type: 'project' as const,
        metadata: {
          projectId: project.id,
          description: project.description,
          completed: !!project.actualEndDate
        }
      })
    }
    
    // Stage dates
    project.stageDates?.forEach(stage => {
      events.push({
        id: `project-stage-${stage.id}`,
        title: `${project.title}: ${stage.stageName}`,
        startDate: startOfDay(new Date(stage.startDate)),
        endDate: startOfDay(new Date(stage.endDate)),
        color: stage.color || '#6366f1',
        type: 'stage' as const,
        metadata: {
          stageId: stage.id,
          projectId: project.id,
          description: stage.stageName
        }
      })
    })
  })
  
  return events
}

/**
 * Convert all data to calendar events
 * Order: Projects first (at top), then Campaigns, then Tasks (at bottom)
 */
export function convertToCalendarEvents(
  tasks: Task[],
  campaigns: Campaign[],
  projects: Project[]
): CalendarEvent[] {
  return [
    ...projectsToCalendarEvents(projects),
    ...campaignsToCalendarEvents(campaigns),
    ...tasksToCalendarEvents(tasks, campaigns)
  ]
}
