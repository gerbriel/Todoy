import { Campaign, Task, Project } from '@/lib/types'
import { CalendarEvent } from './types'
import { startOfDay } from 'date-fns'

/**
 * Convert tasks to calendar events
 */
export function tasksToCalendarEvents(tasks: Task[]): CalendarEvent[] {
  return tasks
    .filter(task => task.dueDate)
    .map(task => {
      const dueDate = startOfDay(new Date(task.dueDate!))
      // Tasks are single day events for now
      
      return {
        id: `task-${task.id}`,
        title: task.title,
        startDate: dueDate,
        endDate: dueDate,
        color: task.completed ? '#10b981' : '#3b82f6',
        type: 'task' as const,
        metadata: {
          taskId: task.id,
          campaignId: task.campaignId,
          description: task.description,
          completed: task.completed,
          assignedTo: task.assignedTo
        }
      }
    })
}

/**
 * Convert campaigns to calendar events
 */
export function campaignsToCalendarEvents(campaigns: Campaign[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  
  campaigns.forEach(campaign => {
    // Planning phase
    if (campaign.planningStartDate && campaign.launchDate) {
      events.push({
        id: `campaign-planning-${campaign.id}`,
        title: `${campaign.title} (Planning)`,
        startDate: startOfDay(new Date(campaign.planningStartDate)),
        endDate: startOfDay(new Date(campaign.launchDate)),
        color: '#3b82f6',
        type: 'campaign' as const,
        metadata: {
          campaignId: campaign.id,
          description: `Planning phase for ${campaign.title}`
        }
      })
    }
    
    // Active phase
    if (campaign.launchDate && campaign.endDate) {
      events.push({
        id: `campaign-active-${campaign.id}`,
        title: `${campaign.title} (Active)`,
        startDate: startOfDay(new Date(campaign.launchDate)),
        endDate: startOfDay(new Date(campaign.endDate)),
        color: '#10b981',
        type: 'campaign' as const,
        metadata: {
          campaignId: campaign.id,
          description: `Active phase for ${campaign.title}`
        }
      })
    }
    
    // Follow-up phase
    if (campaign.endDate && campaign.followUpDate) {
      events.push({
        id: `campaign-followup-${campaign.id}`,
        title: `${campaign.title} (Follow-up)`,
        startDate: startOfDay(new Date(campaign.endDate)),
        endDate: startOfDay(new Date(campaign.followUpDate)),
        color: '#8b5cf6',
        type: 'campaign' as const,
        metadata: {
          campaignId: campaign.id,
          description: `Follow-up phase for ${campaign.title}`
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
    // Active phase
    if (project.startDate && (project.targetEndDate || project.actualEndDate)) {
      const endDate = project.actualEndDate || project.targetEndDate!
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
 */
export function convertToCalendarEvents(
  tasks: Task[],
  campaigns: Campaign[],
  projects: Project[]
): CalendarEvent[] {
  return [
    ...tasksToCalendarEvents(tasks),
    ...campaignsToCalendarEvents(campaigns),
    ...projectsToCalendarEvents(projects)
  ]
}
