import { useState } from 'react'
import { Project, Campaign, ViewMode, FilterState, Task, List } from '@/lib/types'
import { NavigationView } from '@/App'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from './ui/button'
import { Kanban, CalendarBlank, CaretRight, CaretLeft, ArrowLeft, MagnifyingGlass, PencilSimple, SignOut, User, Trash, Archive, Tag, Briefcase, Sun, Moon, Monitor, Sparkle, Copy, Bell } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import GlobalSearch from './GlobalSearch'
import CampaignEditDialog from './CampaignEditDialog'
import ConfirmDialog from './ConfirmDialog'
import DuplicateDialog from './DuplicateDialog'
import { campaignsService } from '@/services/campaigns.service'
import { listsService } from '@/services/lists.service'
import { tasksService } from '@/services/tasks.service'
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
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
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
  lists,
  setLists,
  setTasks,
}: HeaderProps & { onNavigateToCampaign: (campaignId: string) => void }) {
  const [showSearch, setShowSearch] = useState(false)
  const [showEditCampaign, setShowEditCampaign] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicateCampaign, setShowDuplicateCampaign] = useState(false)
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()

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

  const handleArchiveCampaign = async () => {
    if (!activeCampaign) return

    try {
      await campaignsService.update(activeCampaign.id, { archived: true })
      // Optimistically remove from view immediately for better UX
      setCampaigns(prev => prev.filter(c => c.id !== activeCampaign.id))
      toast.success('Campaign archived')
      // Navigate to project if it exists, otherwise to all projects
      if (activeProject) {
        onNavigateToProject(activeProject.id)
      } else {
        onNavigateToAllProjects()
      }
    } catch (error) {
      console.error('Error archiving campaign:', error)
      toast.error('Failed to archive campaign')
    }
  }

  const handleDuplicateCampaign = async (newName: string, targetProjectId?: string) => {
    if (!activeCampaign) return

    try {
      const duplicated = await campaignsService.duplicate(activeCampaign.id, newName, targetProjectId)
      setCampaigns(prev => [...prev, duplicated])
      
      // Refetch lists and tasks for the new campaign to populate UI immediately
      const newLists = await listsService.getByCampaign(duplicated.id)
      const newTasks = await tasksService.getByCampaign(duplicated.id)
      
      setLists(prev => [...prev, ...newLists])
      setTasks(prev => [...prev, ...newTasks])
      
      toast.success('Campaign duplicated')
      setShowDuplicateCampaign(false)
    } catch (error) {
      console.error('Error duplicating campaign:', error)
      toast.error('Failed to duplicate campaign')
    }
  }

  return (
    <>
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
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
            
            {/* Hide project/campaign names - commented out to remove from desktop */}
            {/* <div className="hidden md:block">
              {navigationView === 'all-projects' && (
                <h2 className="text-xl font-semibold text-foreground">All Projects</h2>
              )}
              {navigationView === 'all-campaigns' && (
                <h2 className="text-xl font-semibold text-foreground">All Campaigns</h2>
              )}
              {navigationView === 'all-tasks' && (
                <h2 className="text-xl font-semibold text-foreground">All Tasks</h2>
              )}
              {navigationView === 'recently-completed' && (
                <h2 className="text-xl font-semibold text-foreground">Recently Completed Projects</h2>
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
            </div> */}
          </div>
          
          <div className="flex items-center gap-2 flex-1 max-w-2xl">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(true)}
              className="w-full justify-start"
            >
              <MagnifyingGlass size={16} weight="bold" />
              <span className="ml-2">Search</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notifications - Hidden on mobile, moved to user dropdown */}
            {user && (
              <div className="hidden md:block">
                <NotificationsPanel 
                  userId={user.id}
                  onNavigate={handleNavigateFromNotification}
                />
              </div>
            )}

            {/* View mode toggles for Master View, All views, and Recently Completed */}
            {(navigationView === 'master' || navigationView === 'all-projects' || navigationView === 'all-campaigns' || navigationView === 'all-tasks' || navigationView === 'recently-completed') && (
              <>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="w-10 h-10 p-0"
                  title="Kanban"
                >
                  <Kanban size={20} weight="bold" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="w-10 h-10 p-0"
                  title="Calendar"
                >
                  <CalendarBlank size={20} weight="bold" />
                </Button>
              </>
            )}

            {/* Campaign action buttons - Hidden on mobile */}
            {navigationView === 'campaign' && activeCampaign && (
              <>
                {!activeCampaign.archived && (
                  <div className="hidden md:flex gap-2">
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
                      onClick={() => setShowDuplicateCampaign(true)}
                      className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    >
                      <Copy size={16} weight="bold" />
                      Duplicate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleArchiveCampaign}
                      className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                    >
                      <Archive size={16} weight="bold" />
                      Archive
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
                  </div>
                )}
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="w-10 h-10 p-0"
                  title="Kanban"
                >
                  <Kanban size={20} weight="bold" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="w-10 h-10 p-0"
                  title="Calendar"
                >
                  <CalendarBlank size={20} weight="bold" />
                </Button>
              </>
            )}

            {navigationView === 'project' && activeProject && (
              <>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="w-10 h-10 p-0"
                  title="Kanban"
                >
                  <Kanban size={20} weight="bold" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="w-10 h-10 p-0"
                  title="Calendar"
                >
                  <CalendarBlank size={20} weight="bold" />
                </Button>
              </>
            )}

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User size={20} weight="duotone" />
                    <span className="hidden md:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {/* Notifications - Show on mobile only */}
                  <div className="md:hidden">
                    <DropdownMenuItem asChild>
                      <div className="w-full">
                        <NotificationsPanel 
                          userId={user.id}
                          onNavigate={handleNavigateFromNotification}
                        />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </div>
                  
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
                  
                  {/* Theme Switcher */}
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Theme</p>
                  </div>
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun size={16} className="mr-2" />
                    Light
                    {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon size={16} className="mr-2" />
                    Dark
                    {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor size={16} className="mr-2" />
                    System
                    {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('beggars-cant-be-choosers')}>
                    <Sparkle size={16} className="mr-2" />
                    <span className="text-xs">Beggars Can't Be Choosers</span>
                    {theme === 'beggars-cant-be-choosers' && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                  
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
          lists={lists}
          setLists={setLists}
          setTasks={setTasks}
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

      {activeCampaign && (
        <DuplicateDialog
          open={showDuplicateCampaign}
          onOpenChange={setShowDuplicateCampaign}
          type="campaign"
          itemName={activeCampaign.title}
          projects={projects}
          campaigns={campaigns}
          lists={lists}
          onDuplicate={handleDuplicateCampaign}
        />
      )}
    </>
  )
}
