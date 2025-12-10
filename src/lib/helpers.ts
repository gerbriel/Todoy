import { Card, Board, Label, FilterState, CampaignType, CampaignStage } from './types'

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

export function getChildBoards(boards: Board[], parentId: string): Board[] {
  return boards.filter(b => b.parentId === parentId).sort((a, b) => a.order - b.order)
}

export function getRootProjects(boards: Board[]): Board[] {
  return boards.filter(b => !b.parentId && b.type === 'project').sort((a, b) => a.order - b.order)
}

export function getStandaloneBoards(boards: Board[]): Board[] {
  return boards.filter(b => !b.parentId && b.type === 'board').sort((a, b) => a.order - b.order)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function filterCards(
  cards: Card[],
  boards: Board[],
  labels: Label[],
  filters: FilterState
): Card[] {
  return cards.filter(card => {
    if (filters.boardIds.length > 0 && !filters.boardIds.includes(card.boardId)) {
      return false
    }
    
    if (filters.campaignTypes && filters.campaignTypes.length > 0) {
      const cardBoard = boards.find(b => b.id === card.boardId)
      if (!cardBoard || cardBoard.type !== 'campaign') return false
      if (!cardBoard.campaignType || !filters.campaignTypes.includes(cardBoard.campaignType)) {
        return false
      }
    }
    
    if (filters.campaignStages && filters.campaignStages.length > 0) {
      const cardBoard = boards.find(b => b.id === card.boardId)
      if (!cardBoard || cardBoard.type !== 'campaign') return false
      if (!cardBoard.campaignStage || !filters.campaignStages.includes(cardBoard.campaignStage)) {
        return false
      }
    }
    
    if (filters.labelIds.length > 0) {
      const hasMatchingLabel = filters.labelIds.some(labelId => 
        card.labelIds.includes(labelId)
      )
      if (!hasMatchingLabel) return false
    }
    
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase()
      const matchesTitle = card.title.toLowerCase().includes(searchLower)
      const matchesDescription = card.description.toLowerCase().includes(searchLower)
      if (!matchesTitle && !matchesDescription) return false
    }
    
    if (filters.dateRange) {
      if (!card.dueDate) return false
      const cardDate = new Date(card.dueDate)
      const startDate = new Date(filters.dateRange.start)
      const endDate = new Date(filters.dateRange.end)
      if (cardDate < startDate || cardDate > endDate) return false
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
  const cardDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const diffTime = cardDate.getTime() - today.getTime()
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

export function groupCardsByDate(cards: Card[]): Record<string, Card[]> {
  const grouped: Record<string, Card[]> = {}
  
  cards.forEach(card => {
    if (card.dueDate) {
      const dateKey = card.dueDate.split('T')[0]
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(card)
    }
  })
  
  return grouped
}
