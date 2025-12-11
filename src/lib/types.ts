export type LabelColor = 'red' | 'orange' | 'green' | 'purple' | 'blue' | 'teal'

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer'

export type ProjectVisibility = 'private' | 'team' | 'organization'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  description?: string
  createdAt: string
  ownerId: string
}

export interface OrgMember {
  id: string
  userId: string
  orgId: string
  role: UserRole
  joinedAt: string
  // User info joined from profiles
  userName?: string
  userEmail?: string
}

export interface OrgInvite {
  id: string
  orgId: string
  email: string
  role: UserRole
  invitedBy: string
  invitedAt: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: string
}

export interface JoinRequest {
  id: string
  userId: string
  orgId: string
  message?: string
  requestedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface Notification {
  id: string
  userId: string
  type: 'comment' | 'mention' | 'task_assigned' | 'task_completed' | 'project_shared' | 'campaign_updated'
  title: string
  message: string
  linkTo?: string
  linkType?: 'project' | 'campaign' | 'task'
  linkId?: string
  read: boolean
  createdAt: string
  createdBy?: string
}

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
  completed?: boolean
}

export interface StageTemplate {
  id: string
  name: string
  color: string
  order: number
  createdBy?: string
  orgId?: string
}

export interface Subtask {
  id: string
  title: string
  completed: boolean
  order: number
  createdAt: string
}

export interface Comment {
  id: string
  content: string
  author: string
  authorId?: string
  mentions?: string[]
  createdAt: string
  updatedAt?: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  type: 'file' | 'link'
  size?: number
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
  updatedAt?: string
  completed?: boolean
  currentStage?: string
  assignedTo?: string[]  // Array of user IDs
  subtasks?: Subtask[]
  stageDates?: StageDate[]
  comments?: Comment[]
  attachments?: Attachment[]
  customFields?: Record<string, string>
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
  completed?: boolean
  archived?: boolean
  assignedTo?: string[]  // Array of user IDs
  createdBy?: string
  orgId?: string
}

export interface Project {
  id: string
  title: string
  description: string
  order: number
  createdAt: string
  stageDates?: StageDate[]
  completed?: boolean
  archived?: boolean
  assignedTo?: string[]  // Array of user IDs
  ownerId?: string
  orgId?: string
  visibility?: ProjectVisibility
  sharedWith?: string[]
  collaborators?: Array<{ userId: string; role: UserRole }>
}

export type ViewMode = 'kanban' | 'calendar'

export interface FilterState {
  campaignIds: string[]
  labelIds: string[]
  listIds: string[]
  stageNames: string[]
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
