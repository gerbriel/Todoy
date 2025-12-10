export type LabelColor = 'red' | 'orange' | 'green' | 'purple' | 'blue' | 'teal'

export interface Label {
  id: string
  name: string
  color: LabelColor
}

export type CampaignType = 'webinar' | 'tradeshow' | 'paid-social' | 'content' | 'email' | 'event' | 'other'

export type CampaignStage = 'planning' | 'in-progress' | 'launched' | 'completed' | 'follow-up'

export interface Card {
  id: string
  title: string
  description: string
  listId: string
  boardId: string
  labelIds: string[]
  dueDate?: string
  order: number
  createdAt: string
  budget?: number
  actualSpend?: number
  goals?: string
}

export interface List {
  id: string
  title: string
  boardId: string
  order: number
  cardIds: string[]
}

export interface Board {
  id: string
  title: string
  description: string
  order: number
  createdAt: string
  parentId?: string
  type: 'project' | 'campaign' | 'board'
  campaignType?: CampaignType
  campaignStage?: CampaignStage
  budget?: number
  actualSpend?: number
  goals?: string
  planningStartDate?: string
  launchDate?: string
  endDate?: string
  followUpDate?: string
}

export type ViewMode = 'kanban' | 'calendar'

export interface FilterState {
  boardIds: string[]
  labelIds: string[]
  searchText: string
  dateRange?: {
    start: string
    end: string
  }
  showAllBoards: boolean
  campaignTypes?: CampaignType[]
  campaignStages?: CampaignStage[]
  projectId?: string
}
