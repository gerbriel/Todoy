export type LabelColor = 'red' | 'orange' | 'green' | 'purple' | 'blue' | 'teal'

export interface Label {
  id: string
  name: string
  color: LabelColor
}

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
}
