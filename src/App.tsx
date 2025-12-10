import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Project, Campaign, List, Task, Label, ViewMode, FilterState } from './lib/types'
import { Toaster } from './components/ui/sonner'
import Sidebar from './components/Sidebar'
import KanbanView from './components/KanbanView'
import CalendarView from './components/CalendarView'
import Header from './components/Header'
import FilterPanel from './components/FilterPanel'

function App() {
  const [projects, setProjects] = useKV<Project[]>('projects', [])
  const [campaigns, setCampaigns] = useKV<Campaign[]>('campaigns', [])
  const [lists, setLists] = useKV<List[]>('lists', [])
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [labels, setLabels] = useKV<Label[]>('labels', [])
  
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    campaignIds: [],
    labelIds: [],
    searchText: '',
    showAllCampaigns: false,
  })

  const activeCampaign = campaigns?.find(c => c.id === activeCampaignId)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        projects={projects || []}
        setProjects={setProjects}
        campaigns={campaigns || []}
        setCampaigns={setCampaigns}
        activeCampaignId={activeCampaignId}
        setActiveCampaignId={setActiveCampaignId}
        filters={filters}
        setFilters={setFilters}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeCampaign={activeCampaign}
          campaigns={campaigns || []}
          setCampaigns={setCampaigns}
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
              campaigns={campaigns || []}
              lists={lists || []}
              setLists={setLists}
              tasks={tasks || []}
              setTasks={setTasks}
              labels={labels || []}
              setLabels={setLabels}
              activeCampaignId={activeCampaignId}
              filters={filters}
            />
          ) : (
            <CalendarView
              campaigns={campaigns || []}
              tasks={tasks || []}
              setTasks={setTasks}
              labels={labels || []}
              setLabels={setLabels}
              lists={lists || []}
              activeCampaignId={activeCampaignId}
              filters={filters}
            />
          )}
          
          {showFilterPanel && (
            <FilterPanel
              campaigns={campaigns || []}
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