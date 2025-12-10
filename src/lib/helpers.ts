import { Card, Board, Label, FilterState } from './types'

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
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
