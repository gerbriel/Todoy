import { Task, Campaign, Project, Label, FilterState, CampaignType, CampaignStage } from './types'

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function getCampaignTypeLabel(type: CampaignType): string {
  const labels: Record<CampaignType, string> = {
    'webinar': 'Webinar',
    'tradeshow': 'Trade Show',
    'paid-social': 'Paid Social',
    'content': 'Content Marketing',
    'email': 'Email Campaign',
    'event': 'Event',
    'other': 'Other'
  }
  return labels[type]
}

export function getCampaignStageLabel(stage: CampaignStage): string {
  const labels: Record<CampaignStage, string> = {
    'planning': 'Planning',
    'in-progress': 'In Progress',
    'launched': 'Launched',
    'completed': 'Completed',
    'follow-up': 'Follow-up'
  }
  return labels[stage]
}

export function getCampaignStageColor(stage: CampaignStage): string {
  const colors: Record<CampaignStage, string> = {
    'planning': 'bg-blue-100 text-blue-700 border-blue-200',
    'in-progress': 'bg-orange-100 text-orange-700 border-orange-200',
    'launched': 'bg-purple-100 text-purple-700 border-purple-200',
    'completed': 'bg-green-100 text-green-700 border-green-200',
    'follow-up': 'bg-teal-100 text-teal-700 border-teal-200'
  }
  return colors[stage]
}

export function getCampaignsForProject(campaigns: Campaign[], projectId: string): Campaign[] {
  return campaigns.filter(c => c.projectId === projectId).sort((a, b) => a.order - b.order)
}

export function getProjects(projects: Project[]): Project[] {
  return projects.sort((a, b) => a.order - b.order)
}

export function getStandaloneCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter(c => !c.projectId).sort((a, b) => a.order - b.order)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function filterTasks(
  tasks: Task[],
  campaigns: Campaign[],
  labels: Label[],
  filters: FilterState
): Task[] {
  return tasks.filter(task => {
    if (filters.campaignIds.length > 0 && !filters.campaignIds.includes(task.campaignId)) {
      return false
    }
    
    if (filters.campaignTypes && filters.campaignTypes.length > 0) {
      const taskCampaign = campaigns.find(c => c.id === task.campaignId)
      if (!taskCampaign) return false
      if (!taskCampaign.campaignType || !filters.campaignTypes.includes(taskCampaign.campaignType)) {
        return false
      }
    }
    
    if (filters.campaignStages && filters.campaignStages.length > 0) {
      const taskCampaign = campaigns.find(c => c.id === task.campaignId)
      if (!taskCampaign) return false
      if (!taskCampaign.campaignStage || !filters.campaignStages.includes(taskCampaign.campaignStage)) {
        return false
      }
    }
    
    if (filters.labelIds.length > 0) {
      const hasMatchingLabel = filters.labelIds.some(labelId => 
        task.labelIds.includes(labelId)
      )
      if (!hasMatchingLabel) return false
    }
    
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const matchesTitle = task.title.toLowerCase().includes(searchLower)
      const matchesDescription = task.description.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesDescription) return false
    }
    
    if (filters.dateRange) {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      if (taskDate < startDate || taskDate > endDate) return false
    }
    
    return true
  })
}

export function getLabelColor(color: string): string {
  const colorMap: Record<string, string> = {
    red: 'bg-label-red',
    orange: 'bg-label-orange',
    green: 'bg-label-green',
    purple: 'bg-label-purple',
    blue: 'bg-label-blue',
    teal: 'bg-label-teal',
  }
  return colorMap[color] || 'bg-muted'
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = taskDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0 && diffDays < 7) return `In ${diffDays} days`
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function isOverdue(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return date < today
}

export function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
  const grouped: Record<string, Task[]> = {}
  
  tasks.forEach(task => {
    if (task.dueDate) {
      const dateKey = task.dueDate.split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(task)
    }
  })
  
  return grouped
}
