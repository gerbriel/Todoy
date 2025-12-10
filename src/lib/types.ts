export type LabelColor = 'red' | 'orange' | 'green' | 'purple' | 'blue' | 'teal'

export interface Label {
  id: string
  name: string
  color: LabelColor
}

export type CampaignType = 'webinar' | 'tradeshow' | 'paid-social' | 'content' | 'email' | 'event' | 'other'

export type CampaignStage = 'planning' | 'in-progress' | 'launched' | 'completed' | 'follow-up'

export interface StageDate {
  id: string
  stageName: string
  startDate: string
  endDate: string
  color?: string
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  order: number
  createdAt: string
}

export interface Task {
  id: string
  title: string
  description: string
  listId: string
  campaignId: string
  labelIds: string[]
  dueDate?: string
  order: number
  createdAt: string
  subtasks?: Subtask[]
  stageDates?: StageDate[]
}

export interface List {
  id: string
  title: string
  campaignId: string
  order: number
  taskIds: string[]
}

export interface Campaign {
  id: string
  title: string
  description: string
  order: number
  createdAt: string
  projectId?: string
  campaignType?: CampaignType
  campaignStage?: CampaignStage
  budget?: number
  actualSpend?: number
  goals?: string
  planningStartDate?: string
  launchDate?: string
  endDate?: string
  followUpDate?: string
  stageDates?: StageDate[]
}

export interface Project {
  id: string
  title: string
  description: string
  order: number
  createdAt: string
  stageDates?: StageDate[]
}

export type ViewMode = 'kanban' | 'calendar'

export interface FilterState {
  campaignIds: string[]
  labelIds: string[]
  searchText: string
  dateRange?: {
    start: string
    end: string
  }
  showAllCampaigns: boolean
  campaignTypes?: CampaignType[]
  campaignStages?: CampaignStage[]
  projectId?: string
}
