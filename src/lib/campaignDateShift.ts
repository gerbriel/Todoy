import { Task } from './types'
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
