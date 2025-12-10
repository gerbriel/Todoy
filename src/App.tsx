import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Board, List, Card, Label, ViewMode, FilterState } from './lib/types'
import { Toaster } from './components/ui/sonner'
import Sidebar from './components/Sidebar'
import KanbanView from './components/KanbanView'
import CalendarView from './components/CalendarView'
import Header from './components/Header'
import FilterPanel from './components/FilterPanel'

function App() {
  const [boards, setBoards] = useKV<Board[]>('boards', [])
  const [lists, setLists] = useKV<List[]>('lists', [])
  const [cards, setCards] = useKV<Card[]>('cards', [])
  const [labels, setLabels] = useKV<Label[]>('labels', [])
  
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    boardIds: [],
    labelIds: [],
    searchText: '',
    showAllBoards: false,
  })

  const activeBoard = boards?.find(b => b.id === activeBoardId)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        boards={boards || []}
        setBoards={setBoards}
        activeBoardId={activeBoardId}
        setActiveBoardId={setActiveBoardId}
        filters={filters}
        setFilters={setFilters}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeBoard={activeBoard}
          boards={boards || []}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showFilterPanel={showFilterPanel}
          setShowFilterPanel={setShowFilterPanel}
          filters={filters}
          setFilters={setFilters}
        />
        
        <main className="flex-1 overflow-hidden relative">
          {viewMode === 'kanban' ? (
            <KanbanView
              boards={boards || []}
              lists={lists || []}
              setLists={setLists}
              cards={cards || []}
              setCards={setCards}
              labels={labels || []}
              setLabels={setLabels}
              activeBoardId={activeBoardId}
              filters={filters}
            />
          ) : (
            <CalendarView
              boards={boards || []}
              cards={cards || []}
              setCards={setCards}
              labels={labels || []}
              setLabels={setLabels}
              lists={lists || []}
              activeBoardId={activeBoardId}
              filters={filters}
            />
          )}
          
          {showFilterPanel && (
            <FilterPanel
              boards={boards || []}
              labels={labels || []}
              filters={filters}
              setFilters={setFilters}
              onClose={() => setShowFilterPanel(false)}
            />
          )}
        </main>
      </div>
      
      <Toaster />
    </div>
  )
}

export default App