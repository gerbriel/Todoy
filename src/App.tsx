import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Project, Campaign, List, Task, Label, ViewMode, FilterState } from './lib/types'
import { Toaster } from './components/ui/sonner'
import Sidebar from './components/Sidebar'
import KanbanView from './components/KanbanView'
import CalendarView from './components/CalendarView'
import Header from './components/Header'
import FilterPanel from './components/FilterPanel'
import ProjectsView from './components/ProjectsView'
import ProjectView from './components/ProjectView'

export type NavigationView = 'all-projects' | 'project' | 'campaign'

function App() {
  const [projects, setProjects] = useKV<Project[]>('projects', [])
  const [campaigns, setCampaigns] = useKV<Campaign[]>('campaigns', [])
  const [lists, setLists] = useKV<List[]>('lists', [])
  const [tasks, setTasks] = useKV<Task[]>('tasks', [])
  const [labels, setLabels] = useKV<Label[]>('labels', [])
  
  const [navigationView, setNavigationView] = useState<NavigationView>('all-projects')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    campaignIds: [],
    labelIds: [],
    searchText: '',
    showAllCampaigns: false,
  })

  const activeProject = projects?.find(p => p.id === activeProjectId)
  const activeCampaign = campaigns?.find(c => c.id === activeCampaignId)
  const campaignProject = activeCampaign?.projectId 
    ? projects?.find(p => p.id === activeCampaign.projectId)
    : undefined

  const handleNavigateToProject = (projectId: string) => {
    setActiveProjectId(projectId)
    setActiveCampaignId(null)
    setNavigationView('project')
  }

  const handleNavigateToCampaign = (campaignId: string) => {
    setActiveCampaignId(campaignId)
    setNavigationView('campaign')
  }

  const handleNavigateToAllProjects = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('all-projects')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        projects={projects || []}
        setProjects={setProjects}
        campaigns={campaigns || []}
        setCampaigns={setCampaigns}
        activeProjectId={activeProjectId}
        activeCampaignId={activeCampaignId}
        navigationView={navigationView}
        onNavigateToAllProjects={handleNavigateToAllProjects}
        onNavigateToProject={handleNavigateToProject}
        onNavigateToCampaign={handleNavigateToCampaign}
        filters={filters}
        setFilters={setFilters}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          navigationView={navigationView}
          activeProject={navigationView === 'campaign' ? campaignProject : activeProject}
          activeCampaign={activeCampaign}
          campaigns={campaigns || []}
          setCampaigns={setCampaigns}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showFilterPanel={showFilterPanel}
          setShowFilterPanel={setShowFilterPanel}
          filters={filters}
          setFilters={setFilters}
          onNavigateToAllProjects={handleNavigateToAllProjects}
          onNavigateToProject={handleNavigateToProject}
        />
        
        <main className="flex-1 overflow-hidden relative">
          {navigationView === 'all-projects' && (
            <ProjectsView
              projects={projects || []}
              campaigns={campaigns || []}
              tasks={tasks || []}
              onNavigateToProject={handleNavigateToProject}
            />
          )}
          
          {navigationView === 'project' && activeProjectId && (
            <ProjectView
              project={activeProject!}
              campaigns={campaigns || []}
              setCampaigns={setCampaigns}
              tasks={tasks || []}
              onNavigateToCampaign={handleNavigateToCampaign}
            />
          )}
          
          {navigationView === 'campaign' && activeCampaignId && (
            <>
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
            </>
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