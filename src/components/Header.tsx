import { useState } from 'react'
import { Project, Campaign, ViewMode, FilterState, Task, List } from '@/lib/types'
import { NavigationView } from '@/App'
import { Button } from './ui/button'
import { Kanban, CalendarBlank, CaretRight, MagnifyingGlass } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import GlobalSearch from './GlobalSearch'

interface HeaderProps {
  navigationView: NavigationView
  activeProject?: Project
  activeCampaign?: Campaign
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  showFilterPanel: boolean
  setShowFilterPanel: (show: boolean) => void
  filters: FilterState
  setFilters: (filters: FilterState) => void
  onNavigateToAllProjects: () => void
  onNavigateToProject: (projectId: string) => void
  projects: Project[]
  tasks: Task[]
}

export default function Header({
  navigationView,
  activeProject,
  activeCampaign,
  viewMode,
  setViewMode,
  onNavigateToProject,
  onNavigateToCampaign,
  projects,
  campaigns,
  tasks,
}: HeaderProps & { onNavigateToCampaign: (campaignId: string) => void }) {
  const [showSearch, setShowSearch] = useState(false)

  return (
    <>
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {navigationView === 'all-projects' && (
              <h2 className="text-xl font-semibold text-foreground">All Projects</h2>
            )}
            {navigationView === 'all-campaigns' && (
              <h2 className="text-xl font-semibold text-foreground">All Campaigns</h2>
            )}
            {navigationView === 'all-tasks' && (
              <h2 className="text-xl font-semibold text-foreground">All Tasks</h2>
            )}
            {navigationView === 'project' && activeProject && (
              <h2 className="text-xl font-semibold text-foreground">{activeProject.title}</h2>
            )}
            {navigationView === 'campaign' && (
              <>
                {activeProject && (
                  <>
                    <span className="text-muted-foreground">{activeProject.title}</span>
                    <CaretRight size={16} className="text-muted-foreground" weight="bold" />
                  </>
                )}
                <h2 className="text-xl font-semibold text-foreground">
                  {activeCampaign?.title || 'Campaign'}
                </h2>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(true)}
            >
              <MagnifyingGlass size={16} weight="bold" />
              Search
            </Button>

            {navigationView === 'campaign' && (
              <>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                >
                  <Kanban size={16} weight="bold" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                >
                  <CalendarBlank size={16} weight="bold" />
                  Calendar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
          </DialogHeader>
          <GlobalSearch
            projects={projects}
            campaigns={campaigns}
            tasks={tasks}
            onNavigateToProject={onNavigateToProject}
            onNavigateToCampaign={onNavigateToCampaign}
            onClose={() => setShowSearch(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
