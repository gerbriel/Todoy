// Calendar event types
export interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  color: string
  type: 'task' | 'campaign' | 'project' | 'stage'
  metadata: {
    taskId?: string
    campaignId?: string
    campaignName?: string
    projectId?: string
    stageId?: string
    description?: string
    completed?: boolean
    assignedTo?: string[]
  }
}

export interface DragState {
  eventId: string | null
  isDragging: boolean
  isResizing: boolean
  resizeHandle: 'start' | 'end' | null
  startDate: Date | null
  endDate: Date | null
  originalStartDate: Date | null
  originalEndDate: Date | null
}

export interface DateCellPosition {
  row: number
  col: number
  date: Date
}
