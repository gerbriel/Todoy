import { Task, Campaign } from './types'
import { differenceInDays, addDays } from 'date-fns'

/**
 * Calculate the offset (in days) between a task's date and the campaign's original start date
 * @param taskDate - The task's dueDate or startDate
 * @param campaignStartDate - The campaign's original start date
 * @returns Number of days offset (can be negative if task is before campaign start)
 */
export function calculateTaskOffset(taskDate: string, campaignStartDate: string): number {
  const task = new Date(taskDate)
  const campaignStart = new Date(campaignStartDate)
  return differenceInDays(task, campaignStart)
}

/**
 * Shift a single task's dates relative to a campaign's new start date
 * @param task - The task to shift
 * @param oldCampaignStartDate - The campaign's original start date
 * @param newCampaignStartDate - The campaign's new start date
 * @param newCampaignEndDate - The campaign's new end date (optional, for clamping)
 * @param clampToCampaign - Whether to clamp tasks to stay within campaign bounds
 * @returns Updated task with shifted dates, or null if invalid
 */
export function shiftTaskDates(
  task: Task,
  oldCampaignStartDate: string,
  newCampaignStartDate: string,
  newCampaignEndDate?: string,
  clampToCampaign: boolean = false
): Task | null {
  // Skip tasks without dates
  if (!task.dueDate) {
    return null
  }

  // Calculate offset from original campaign start
  const dueDateOffset = calculateTaskOffset(task.dueDate, oldCampaignStartDate)
  const startDateOffset = task.startDate 
    ? calculateTaskOffset(task.startDate, oldCampaignStartDate)
    : undefined

  // Calculate new dates
  const newCampaignStart = new Date(newCampaignStartDate)
  const newDueDate = addDays(newCampaignStart, dueDateOffset)
  const newStartDate = startDateOffset !== undefined 
    ? addDays(newCampaignStart, startDateOffset)
    : undefined

  // Optional: Clamp dates to campaign bounds
  if (clampToCampaign && newCampaignEndDate) {
    const campaignEnd = new Date(newCampaignEndDate)
    const campaignStart = new Date(newCampaignStartDate)
    
    // If task due date would be after campaign end, clamp to campaign end
    if (newDueDate > campaignEnd) {
      return {
        ...task,
        dueDate: campaignEnd.toISOString(),
        startDate: newStartDate 
          ? (newStartDate < campaignStart ? campaignStart.toISOString() : newStartDate.toISOString())
          : undefined
      }
    }
    
    // If task start date would be before campaign start, clamp to campaign start
    if (newStartDate && newStartDate < campaignStart) {
      return {
        ...task,
        dueDate: newDueDate.toISOString(),
        startDate: campaignStart.toISOString()
      }
    }
  }

  return {
    ...task,
    dueDate: newDueDate.toISOString(),
    startDate: newStartDate ? newStartDate.toISOString() : undefined
  }
}

/**
 * Shift all tasks in a campaign when the campaign's dates change
 * @param tasks - Array of all tasks
 * @param campaignId - ID of the campaign being moved
 * @param oldCampaignStartDate - The campaign's original start date
 * @param newCampaignStartDate - The campaign's new start date
 * @param newCampaignEndDate - The campaign's new end date (optional, for clamping)
 * @param clampToCampaign - Whether to clamp tasks to stay within campaign bounds
 * @returns Updated tasks array with shifted dates for affected tasks
 */
export function shiftCampaignTasks(
  tasks: Task[],
  campaignId: string,
  oldCampaignStartDate: string,
  newCampaignStartDate: string,
  newCampaignEndDate?: string,
  clampToCampaign: boolean = false
): Task[] {
  // If dates haven't changed, return original tasks
  if (oldCampaignStartDate === newCampaignStartDate) {
    return tasks
  }

  return tasks.map(task => {
    // Only shift tasks belonging to this campaign
    if (task.campaignId !== campaignId) {
      return task
    }

    // Skip tasks without dates
    if (!task.dueDate) {
      return task
    }

    // Shift the task's dates
    const shiftedTask = shiftTaskDates(
      task,
      oldCampaignStartDate,
      newCampaignStartDate,
      newCampaignEndDate,
      clampToCampaign
    )

    return shiftedTask || task
  })
}

/**
 * Calculate statistics about how tasks will shift
 * Useful for showing a preview or confirmation to the user
 * @param tasks - Array of tasks to analyze
 * @param campaignId - ID of the campaign
 * @param oldCampaignStartDate - Original campaign start date
 * @param newCampaignStartDate - New campaign start date
 * @returns Statistics object
 */
export function calculateShiftStats(
  tasks: Task[],
  campaignId: string,
  oldCampaignStartDate: string,
  newCampaignStartDate: string
) {
  const campaignTasks = tasks.filter(t => t.campaignId === campaignId && t.dueDate)
  const daysDifference = differenceInDays(
    new Date(newCampaignStartDate),
    new Date(oldCampaignStartDate)
  )

  return {
    tasksAffected: campaignTasks.length,
    daysDifference,
    direction: daysDifference > 0 ? 'forward' : daysDifference < 0 ? 'backward' : 'none',
    taskIds: campaignTasks.map(t => t.id)
  }
}

/**
 * Validate that all tasks in a campaign have dates set
 * @param tasks - Array of tasks to validate
 * @param campaignId - ID of the campaign
 * @returns Object with validation results
 */
export function validateCampaignTaskDates(
  tasks: Task[],
  campaignId: string
): { valid: boolean; tasksWithoutDates: Task[]; totalTasks: number } {
  const campaignTasks = tasks.filter(t => t.campaignId === campaignId)
  const tasksWithoutDates = campaignTasks.filter(t => !t.dueDate)

  return {
    valid: tasksWithoutDates.length === 0,
    tasksWithoutDates,
    totalTasks: campaignTasks.length
  }
}

/**
 * PROJECT CASCADE SHIFT FUNCTIONS
 * These functions handle shifting campaigns and tasks when a project is moved
 */

/**
 * Calculate the offset (in days) between a campaign's date and the project's original start date
 * @param campaignDate - The campaign's startDate or endDate
 * @param projectStartDate - The project's original start date
 * @returns Number of days offset (can be negative if campaign is before project start)
 */
export function calculateCampaignOffset(campaignDate: string, projectStartDate: string): number {
  const campaign = new Date(campaignDate)
  const projectStart = new Date(projectStartDate)
  return differenceInDays(campaign, projectStart)
}

/**
 * Shift a single campaign's dates relative to a project's new start date
 * @param campaign - The campaign to shift
 * @param oldProjectStartDate - The project's original start date
 * @param newProjectStartDate - The project's new start date
 * @param newProjectEndDate - The project's new end date (optional, for clamping)
 * @param clampToProject - Whether to clamp campaigns to stay within project bounds
 * @returns Updated campaign with shifted dates, or null if invalid
 */
export function shiftCampaignDates(
  campaign: Campaign,
  oldProjectStartDate: string,
  newProjectStartDate: string,
  newProjectEndDate?: string,
  clampToProject: boolean = false
): Campaign | null {
  // Skip campaigns without dates
  if (!campaign.startDate || !campaign.endDate) {
    return null
  }

  // Calculate offset from original project start
  const startDateOffset = calculateCampaignOffset(campaign.startDate, oldProjectStartDate)
  const endDateOffset = calculateCampaignOffset(campaign.endDate, oldProjectStartDate)

  // Calculate new dates
  const newProjectStart = new Date(newProjectStartDate)
  const newStartDate = addDays(newProjectStart, startDateOffset)
  const newEndDate = addDays(newProjectStart, endDateOffset)

  // Optional: Clamp dates to project bounds
  if (clampToProject && newProjectEndDate) {
    const projectEnd = new Date(newProjectEndDate)
    const projectStart = new Date(newProjectStartDate)
    
    // If campaign end date would be after project end, clamp to project end
    if (newEndDate > projectEnd) {
      return {
        ...campaign,
        startDate: (newStartDate < projectStart ? projectStart : newStartDate).toISOString(),
        endDate: projectEnd.toISOString()
      }
    }
    
    // If campaign start date would be before project start, clamp to project start
    if (newStartDate < projectStart) {
      return {
        ...campaign,
        startDate: projectStart.toISOString(),
        endDate: (newEndDate > projectEnd ? projectEnd : newEndDate).toISOString()
      }
    }
  }

  return {
    ...campaign,
    startDate: newStartDate.toISOString(),
    endDate: newEndDate.toISOString()
  }
}

/**
 * Shift all campaigns and their tasks in a project when the project's dates change
 * @param campaigns - Array of all campaigns
 * @param tasks - Array of all tasks
 * @param projectId - ID of the project being moved
 * @param oldProjectStartDate - The project's original start date
 * @param newProjectStartDate - The project's new start date
 * @param newProjectEndDate - The project's new end date (optional, for clamping)
 * @param clampToProject - Whether to clamp campaigns/tasks to stay within project bounds
 * @returns Object with updated campaigns and tasks arrays
 */
export function shiftProjectCampaignsAndTasks(
  campaigns: Campaign[],
  tasks: Task[],
  projectId: string,
  oldProjectStartDate: string,
  newProjectStartDate: string,
  newProjectEndDate?: string,
  clampToProject: boolean = false
): { campaigns: Campaign[]; tasks: Task[] } {
  // If dates haven't changed, return original arrays
  if (oldProjectStartDate === newProjectStartDate) {
    return { campaigns, tasks }
  }

  // Shift all campaigns in the project
  const updatedCampaigns = campaigns.map(campaign => {
    // Only shift campaigns belonging to this project
    if (campaign.projectId !== projectId) {
      return campaign
    }

    // Skip campaigns without dates
    if (!campaign.startDate || !campaign.endDate) {
      return campaign
    }

    // Shift the campaign's dates
    const shiftedCampaign = shiftCampaignDates(
      campaign,
      oldProjectStartDate,
      newProjectStartDate,
      newProjectEndDate,
      clampToProject
    )

    return shiftedCampaign || campaign
  })

  // Get the project's campaigns and their new dates
  const projectCampaigns = updatedCampaigns.filter(c => c.projectId === projectId)
  
  // Shift all tasks in those campaigns
  let updatedTasks = tasks
  for (const campaign of projectCampaigns) {
    const oldCampaign = campaigns.find(c => c.id === campaign.id)
    if (oldCampaign && oldCampaign.startDate && campaign.startDate) {
      updatedTasks = shiftCampaignTasks(
        updatedTasks,
        campaign.id,
        oldCampaign.startDate,
        campaign.startDate,
        campaign.endDate,
        clampToProject
      )
    }
  }

  return { campaigns: updatedCampaigns, tasks: updatedTasks }
}

/**
 * Calculate statistics about how campaigns and tasks will shift when a project is moved
 * @param campaigns - Array of campaigns to analyze
 * @param tasks - Array of tasks to analyze
 * @param projectId - ID of the project
 * @param oldProjectStartDate - Original project start date
 * @param newProjectStartDate - New project start date
 * @returns Statistics object
 */
export function calculateProjectShiftStats(
  campaigns: Campaign[],
  tasks: Task[],
  projectId: string,
  oldProjectStartDate: string,
  newProjectStartDate: string
) {
  const projectCampaigns = campaigns.filter(c => c.projectId === projectId && c.startDate)
  const campaignIds = projectCampaigns.map(c => c.id)
  const projectTasks = tasks.filter(t => campaignIds.includes(t.campaignId || '') && t.dueDate)
  
  const daysDifference = differenceInDays(
    new Date(newProjectStartDate),
    new Date(oldProjectStartDate)
  )

  return {
    campaignsAffected: projectCampaigns.length,
    tasksAffected: projectTasks.length,
    daysDifference,
    direction: daysDifference > 0 ? 'forward' : daysDifference < 0 ? 'backward' : 'none',
    campaignIds: projectCampaigns.map(c => c.id),
    taskIds: projectTasks.map(t => t.id)
  }
}
