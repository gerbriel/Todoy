import { useState } from 'react'
import { Project, Campaign, ViewMode, FilterState, Task, List } from '@/lib/types'
import { NavigationView } from '@/App'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/button'
import { Kanban, CalendarBlank, CaretRight, CaretLeft, MagnifyingGlass, PencilSimple, SignOut, User, Trash, Archive, Tag, Briefcase } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import GlobalSearch from './GlobalSearch'
import CampaignEditDialog from './CampaignEditDialog'
import ConfirmDialog from './ConfirmDialog'
import { campaignsService } from '@/services/campaigns.service'
import { toast } from 'sonner'
import NotificationsPanel from './NotificationsPanel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

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
  onNavigateToArchive?: () => void
  onNavigateToLabels?: () => void
  onNavigateToOrganization?: () => void
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
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
  onNavigateToAllProjects,
  onNavigateToArchive,
  onNavigateToLabels,
  onNavigateToOrganization,
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  tasks,
}: HeaderProps & { onNavigateToCampaign: (campaignId: string) => void }) {
  const [showSearch, setShowSearch] = useState(false)
  const [showEditCampaign, setShowEditCampaign] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { user, logout } = useAuth()

  const handleNavigateFromNotification = (type: 'project' | 'campaign' | 'task', id: string) => {
    if (type === 'project') {
      onNavigateToProject(id)
    } else if (type === 'campaign') {
      onNavigateToCampaign(id)
    }
    // Task navigation would require additional logic
  }

  const handleDeleteCampaign = async () => {
    if (!activeCampaign) return

    try {
      await campaignsService.delete(activeCampaign.id)
      // Optimistically update local state
      setCampaigns(prev => prev.filter(c => c.id !== activeCampaign.id))
      toast.success('Campaign deleted')
      // Navigate to project if it exists, otherwise to all projects
      if (activeProject) {
        onNavigateToProject(activeProject.id)
      } else {
        onNavigateToAllProjects()
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }

  return (
    <>
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Back button for project and campaign views */}
            {(navigationView === 'project' || navigationView === 'campaign') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (navigationView === 'campaign' && activeProject) {
                    onNavigateToProject(activeProject.id)
                  } else {
                    onNavigateToAllProjects()
                  }
                }}
                className="mr-2"
              >
                <CaretLeft size={20} weight="bold" />
              </Button>
            )}
            
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

            {user && (
              <NotificationsPanel 
                userId={user.id}
                onNavigate={handleNavigateFromNotification}
              />
            )}

            {navigationView === 'campaign' && activeCampaign && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditCampaign(true)}
                >
                  <PencilSimple size={16} weight="bold" />
                  Edit Campaign
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash size={16} weight="bold" />
                  Delete
                </Button>
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

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User size={16} weight="duotone" />
                    {user.name}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  {onNavigateToLabels && (
                    <DropdownMenuItem onClick={onNavigateToLabels}>
                      <Tag size={16} className="mr-2" />
                      Labels
                    </DropdownMenuItem>
                  )}
                  {onNavigateToArchive && (
                    <DropdownMenuItem onClick={onNavigateToArchive}>
                      <Archive size={16} className="mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {onNavigateToOrganization && (
                    <DropdownMenuItem onClick={onNavigateToOrganization}>
                      <Briefcase size={16} className="mr-2" />
                      Organization
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <SignOut size={16} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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

      {activeCampaign && (
        <CampaignEditDialog
          campaign={activeCampaign}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          projects={projects}
          open={showEditCampaign}
          onOpenChange={setShowEditCampaign}
        />
      )}

      {activeCampaign && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDeleteCampaign}
          title="Delete Campaign?"
          description={
            tasks.filter(t => t.campaignId === activeCampaign.id).length > 0
              ? `Are you sure you want to delete "${activeCampaign.title}" and its ${tasks.filter(t => t.campaignId === activeCampaign.id).length} task${tasks.filter(t => t.campaignId === activeCampaign.id).length === 1 ? '' : 's'}? This action cannot be undone.`
              : `Are you sure you want to delete "${activeCampaign.title}"? This action cannot be undone.`
          }
          confirmText="Delete Campaign"
        />
      )}
    </>
  )
}
