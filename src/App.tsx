import { useState, useEffect } from 'react'
import { Project, Campaign, List, Task, Label, ViewMode, FilterState, StageTemplate, OrgMember, OrgInvite } from './lib/types'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'
import { useAuth } from './contexts/AuthContext'
import LoginView from './components/LoginView'
import Sidebar from './components/Sidebar'
import KanbanView from './components/KanbanView'
import CalendarView from './components/CalendarView'
import Header from './components/Header'
import FilterPanel from './components/FilterPanel'
import ProjectsView from './components/ProjectsView'
import ArchiveView from './components/ArchiveView'
import RecentlyCompletedView from './components/RecentlyCompletedView'
import ProjectView from './components/ProjectView'
import CampaignsView from './components/CampaignsView'
import TasksView from './components/TasksView'
import MasterView from './components/MasterView'
import OrganizationView from './components/OrganizationView'
import LabelsView from './components/LabelsView'
import { projectsService } from './services/projects.service'
import { campaignsService } from './services/campaigns.service'
import { tasksService } from './services/tasks.service'
import { listsService } from './services/lists.service'
import { labelsService } from './services/labels.service'
import { orgMembersService } from './services/orgMembers.service'
import { orgInvitesService } from './services/orgInvites.service'
import { stageTemplatesService } from './services/stageTemplates.service'

export type NavigationView = 'all-projects' | 'all-campaigns' | 'all-tasks' | 'project' | 'campaign' | 'master' | 'archive' | 'organization' | 'labels' | 'recently-completed'

function App() {
  const { isAuthenticated } = useAuth()
  
  // Show login if not authenticated
  if (!isAuthenticated) {
    return <LoginView />
  }
  
  return <MainApp />
}

function MainApp() {
  const { user, organization, setOrganization, users } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [stageTemplates, setStageTemplates] = useState<StageTemplate[]>([])
  const [orgMembers, setOrgMembers] = useState<OrgMember[]>([])
  const [orgInvites, setOrgInvites] = useState<OrgInvite[]>([])
  const [archivedProject, setArchivedProject] = useState<Project | null>(null)
  const [archivedCampaign, setArchivedCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Load data from Supabase when organization changes
  useEffect(() => {
    if (!organization?.id) {
      setLoading(false)
      return
    }

    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load all data in parallel
        const [projectsData, labelsData, tasksData, orgMembersData, orgInvitesData, stageTemplatesData] = await Promise.all([
          projectsService.getAllIncludingCompleted(organization.id),
          labelsService.getByOrg(organization.id),
          tasksService.getByOrg(organization.id),
          orgMembersService.getByOrg(organization.id),
          orgInvitesService.getByOrg(organization.id),
          stageTemplatesService.getAll(organization.id),
        ])

        setProjects(projectsData)
        setLabels(labelsData)
        setTasks(tasksData)
        setOrgMembers(orgMembersData)
        setOrgInvites(orgInvitesData)
        setStageTemplates(stageTemplatesData)

        // Load campaigns for all projects
        if (projectsData.length > 0) {
          const campaignsPromises = projectsData.map(p => 
            campaignsService.getByProject(p.id)
          )
          const campaignsArrays = await Promise.all(campaignsPromises)
          const allCampaigns = campaignsArrays.flat()
          setCampaigns(allCampaigns)

          // Load lists for all campaigns
          if (allCampaigns.length > 0) {
            const listsPromises = allCampaigns.map(c => 
              listsService.getByCampaign(c.id)
            )
            const listsArrays = await Promise.all(listsPromises)
            const allLists = listsArrays.flat()
            setLists(allLists)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Set up real-time subscriptions
    const unsubProjects = projectsService.subscribe(organization.id, setProjects)
    const unsubCampaigns = campaignsService.subscribe(organization.id, setCampaigns)
    const unsubLists = listsService.subscribeAll(organization.id, setLists)
    const unsubLabels = labelsService.subscribe(organization.id, setLabels)
    const unsubTasks = tasksService.subscribe(organization.id, setTasks)
    const unsubMembers = orgMembersService.subscribe(organization.id, setOrgMembers)
    const unsubInvites = orgInvitesService.subscribe(organization.id, setOrgInvites)
    const unsubStageTemplates = stageTemplatesService.subscribeToChanges(organization.id, () => {
      stageTemplatesService.getAll(organization.id).then(setStageTemplates)
    })

    return () => {
      unsubProjects()
      unsubCampaigns()
      unsubLists()
      unsubLabels()
      unsubTasks()
      unsubMembers()
      unsubInvites()
      unsubStageTemplates()
    }
  }, [organization?.id])
  
  const [navigationView, setNavigationView] = useState<NavigationView>('all-projects')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    campaignIds: [],
    labelIds: [],
    listIds: [],
    stageNames: [],
    searchText: '',
    showAllCampaigns: false,
  })

  const activeProject = projects?.find(p => p.id === activeProjectId) || archivedProject
  const activeCampaign = campaigns?.find(c => c.id === activeCampaignId) || archivedCampaign
  const campaignProject = activeCampaign?.projectId 
    ? projects?.find(p => p.id === activeCampaign.projectId)
    : undefined

  const handleNavigateToProject = async (projectId: string) => {
    setActiveProjectId(projectId)
    setActiveCampaignId(null)
    
    // If project is not in the main projects state, it might be archived - fetch it and its campaigns
    if (!projects?.find(p => p.id === projectId)) {
      try {
        const [project, projectCampaigns] = await Promise.all([
          projectsService.getById(projectId),
          campaignsService.getByProject(projectId),
        ])
        if (project) {
          setArchivedProject(project)
        }
        // Temporarily add archived project's campaigns to the campaigns state
        if (projectCampaigns.length > 0) {
          setCampaigns(prev => {
            // Remove any existing campaigns for this project, then add new ones
            const filtered = prev.filter(c => c.projectId !== projectId)
            return [...filtered, ...projectCampaigns]
          })
        }
        // Only set navigation view after data is loaded
        setNavigationView('project')
      } catch (error) {
        console.error('Error fetching archived project:', error)
        toast.error('Failed to load project')
      }
    } else {
      setArchivedProject(null)
      setNavigationView('project')
    }
  }

  const handleNavigateToCampaign = async (campaignId: string) => {
    setActiveCampaignId(campaignId)
    
    // If campaign is not in the main campaigns state, it might be archived - fetch it and its lists/tasks
    if (!campaigns?.find(c => c.id === campaignId)) {
      try {
        const [campaign, campaignLists, campaignTasks] = await Promise.all([
          campaignsService.getById(campaignId),
          listsService.getByCampaign(campaignId),
          tasksService.getByCampaign(campaignId),
        ])
        if (campaign) {
          setArchivedCampaign(campaign)
        }
        // Temporarily add archived campaign's lists and tasks to state
        if (campaignLists.length > 0) {
          setLists(prev => {
            const filtered = prev.filter(l => l.campaignId !== campaignId)
            return [...filtered, ...campaignLists]
          })
        }
        if (campaignTasks.length > 0) {
          setTasks(prev => {
            const filtered = prev.filter(t => t.campaignId !== campaignId)
            return [...filtered, ...campaignTasks]
          })
        }
        // Only set navigation view after data is loaded
        setNavigationView('campaign')
      } catch (error) {
        console.error('Error fetching archived campaign:', error)
        toast.error('Failed to load campaign')
      }
    } else {
      setArchivedCampaign(null)
      setNavigationView('campaign')
    }
  }

  const handleNavigateToAllProjects = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('all-projects')
  }

  const handleNavigateToAllCampaigns = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('all-campaigns')
  }

  const handleNavigateToAllTasks = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('all-tasks')
  }

  const handleNavigateToMaster = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('master')
  }

  const handleNavigateToArchive = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('archive')
  }

  const handleNavigateToRecentlyCompleted = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('recently-completed')
  }

  const handleNavigateToOrganization = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('organization')
  }

  const handleNavigateToLabels = () => {
    setActiveProjectId(null)
    setActiveCampaignId(null)
    setNavigationView('labels')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        projects={projects || []}
        setProjects={setProjects}
        campaigns={campaigns || []}
        setCampaigns={setCampaigns}
        lists={lists || []}
        stageTemplates={stageTemplates || []}
        tasks={tasks || []}
        activeProjectId={activeProjectId}
        activeCampaignId={activeCampaignId}
        navigationView={navigationView}
        organization={organization}
        onNavigateToAllProjects={handleNavigateToAllProjects}
        onNavigateToAllCampaigns={handleNavigateToAllCampaigns}
        onNavigateToAllTasks={handleNavigateToAllTasks}
        onNavigateToMaster={handleNavigateToMaster}
        onNavigateToArchive={handleNavigateToArchive}
        onNavigateToRecentlyCompleted={handleNavigateToRecentlyCompleted}
        onNavigateToOrganization={handleNavigateToOrganization}
        onNavigateToLabels={handleNavigateToLabels}
        onNavigateToProject={handleNavigateToProject}
        onNavigateToCampaign={handleNavigateToCampaign}
        filters={filters}
        setFilters={setFilters}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          navigationView={navigationView}
          activeProject={navigationView === 'campaign' ? campaignProject : (activeProject || undefined)}
          activeCampaign={activeCampaign || undefined}
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
          onNavigateToCampaign={handleNavigateToCampaign}
          onNavigateToArchive={handleNavigateToArchive}
          onNavigateToLabels={handleNavigateToLabels}
          onNavigateToOrganization={handleNavigateToOrganization}
          projects={projects || []}
          setProjects={setProjects}
          tasks={tasks || []}
          lists={lists || []}
        />
        
        <main className="flex-1 overflow-hidden relative">
          {navigationView === 'all-projects' && (
            <ProjectsView
              projects={projects || []}
              setProjects={setProjects}
              campaigns={campaigns || []}
              tasks={tasks || []}
              onNavigateToProject={handleNavigateToProject}
            />
          )}
          
          {navigationView === 'all-campaigns' && (
            <CampaignsView
              campaigns={campaigns || []}
              projects={projects || []}
              tasks={tasks || []}
              onNavigateToCampaign={handleNavigateToCampaign}
            />
          )}
          
          {navigationView === 'all-tasks' && (
            <TasksView
              tasks={tasks || []}
              campaigns={campaigns || []}
              projects={projects || []}
              lists={lists || []}
              labels={labels || []}
              setTasks={setTasks}
              setLabels={setLabels}
              onNavigateToCampaign={handleNavigateToCampaign}
              orgId={organization?.id || ''}
            />
          )}

          {navigationView === 'master' && (
            <MasterView
              projects={projects || []}
              setProjects={setProjects}
              campaigns={campaigns || []}
              setCampaigns={setCampaigns}
              tasks={tasks || []}
              setTasks={setTasks}
              lists={lists || []}
              labels={labels || []}
              setLabels={setLabels}
              onNavigateToProject={handleNavigateToProject}
              onNavigateToCampaign={handleNavigateToCampaign}
              orgId={organization?.id || ''}
            />
          )}

          {navigationView === 'archive' && (
            <ArchiveView
              projects={projects || []}
              setProjects={setProjects}
              campaigns={campaigns || []}
              setCampaigns={setCampaigns}
              tasks={tasks || []}
              onNavigateToProject={handleNavigateToProject}
              onNavigateToCampaign={handleNavigateToCampaign}
              orgId={organization?.id || ''}
            />
          )}

          {navigationView === 'recently-completed' && (
            <RecentlyCompletedView
              projects={projects || []}
              setProjects={setProjects}
              campaigns={campaigns || []}
              tasks={tasks || []}
              onNavigateToProject={handleNavigateToProject}
            />
          )}
          
          {navigationView === 'organization' && (
            <OrganizationView
              organization={organization}
              members={orgMembers || []}
              users={users || []}
              invites={orgInvites || []}
              projects={projects || []}
              campaigns={campaigns || []}
              tasks={tasks || []}
              setOrganization={setOrganization}
              setMembers={setOrgMembers}
              setInvites={setOrgInvites}
              currentUserId={user?.id || ''}
              onNavigateToProject={handleNavigateToProject}
              onNavigateToCampaign={handleNavigateToCampaign}
            />
          )}
          
          {navigationView === 'labels' && (
            <LabelsView
              labels={labels || []}
              setLabels={setLabels}
              orgId={organization?.id || ''}
            />
          )}
          
          {navigationView === 'project' && activeProjectId && activeProject && (
            <ProjectView
              project={activeProject}
              projects={projects || []}
              setProjects={setProjects}
              campaigns={campaigns || []}
              setCampaigns={setCampaigns}
              tasks={tasks || []}
              setTasks={setTasks}
              lists={lists || []}
              setLists={setLists}
              organization={organization}
              onNavigateToCampaign={handleNavigateToCampaign}
              onNavigateBack={handleNavigateToAllProjects}
            />
          )}
          
          {navigationView === 'campaign' && activeCampaignId && activeCampaign && (
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
                  projects={projects || []}
                  activeCampaignId={activeCampaignId}
                  filters={filters}
                  orgId={organization?.id || ''}
                  setCampaigns={setCampaigns}
                  onNavigateBack={activeProject ? () => handleNavigateToProject(activeProject.id) : handleNavigateToAllProjects}
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
                  projects={projects || []}
                  users={users || []}
                  viewLevel="campaign"
                  onCampaignClick={handleNavigateToCampaign}
                  onProjectClick={handleNavigateToProject}
                  orgId={organization?.id || ''}
                  setCampaigns={setCampaigns}
                  onNavigateBack={activeProject ? () => handleNavigateToProject(activeProject.id) : handleNavigateToAllProjects}
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