import { Project, Campaign, Task } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Folder, Target, CheckSquare, Square, ArrowCounterClockwise, Trash, ArrowLeft } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { getCampaignsForProject } from '@/lib/helpers'
import { projectsService } from '@/services/projects.service'
import { campaignsService } from '@/services/campaigns.service'
import { tasksService } from '@/services/tasks.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface ArchiveViewProps {
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  onNavigateToProject: (projectId: string) => void
  onNavigateToCampaign: (campaignId: string) => void
  onBack?: () => void
  orgId: string
}

export default function ArchiveView({
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  tasks,
  setTasks,
  onNavigateToProject,
  onNavigateToCampaign,
  onBack,
  orgId,
}: ArchiveViewProps) {
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([])
  const [archivedCampaigns, setArchivedCampaigns] = useState<Campaign[]>([])
  const [archivedCampaignTasks, setArchivedCampaignTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  // Load archived items when the view mounts and set up subscriptions
  useEffect(() => {
    if (!orgId) return

    const loadArchivedItems = async () => {
      try {
        setLoading(true)

        const [archivedProjs, archivedCamps] = await Promise.all([
          projectsService.getAllArchived(orgId),
          campaignsService.getAllArchived(orgId),
        ])
        
        setArchivedProjects(archivedProjs)
        setArchivedCampaigns(archivedCamps)
        
        console.log('Archived projects:', archivedProjs.length)
        console.log('Archived campaigns:', archivedCamps.length)
        
        // Load all tasks for archived campaigns
        if (archivedCamps.length > 0) {
          const tasksPromises = archivedCamps.map(campaign => 
            tasksService.getByCampaign(campaign.id)
          )
          const tasksArrays = await Promise.all(tasksPromises)
          const allArchivedTasks = tasksArrays.flat()
          console.log('Archived campaign tasks loaded:', allArchivedTasks.length)
          setArchivedCampaignTasks(allArchivedTasks)
        } else {
          setArchivedCampaignTasks([])
        }
      } catch (error) {
        console.error('Error loading archived items:', error)
        toast.error('Failed to load archived items')
      } finally {
        setLoading(false)
      }
    }

    loadArchivedItems()

    // Subscribe to project and campaign changes to reload archived items
    const handleProjectChange = () => {
      console.log('Project changed, reloading archived items')
      loadArchivedItems()
    }
    
    const handleCampaignChange = () => {
      console.log('Campaign changed, reloading archived items')
      loadArchivedItems()
    }

    const unsubProjects = projectsService.subscribe(orgId, () => handleProjectChange())
    const unsubCampaigns = campaignsService.subscribe(orgId, () => handleCampaignChange())

    return () => {
      unsubProjects()
      unsubCampaigns()
    }
  }, [orgId])

  const sortedProjects = [...archivedProjects].sort((a, b) => a.order - b.order)

  const handleRestore = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      // Restore the project
      const restoredProject = await projectsService.update(projectId, { archived: false })
      
      // Get all archived campaigns for this project
      const projectArchivedCampaigns = archivedCampaigns.filter(c => c.projectId === projectId)
      
      // Restore all campaigns in this project
      const campaignRestorePromises = projectArchivedCampaigns.map(campaign => 
        campaignsService.update(campaign.id, { archived: false })
      )
      
      if (campaignRestorePromises.length > 0) {
        const restoredCampaignsData = await Promise.all(campaignRestorePromises)
        
        // Remove from archived campaigns list
        setArchivedCampaigns(prev => prev.filter(c => c.projectId !== projectId))
        
        // Add restored campaigns to main state
        setCampaigns(prev => [...prev, ...restoredCampaignsData])
        
        toast.success(`Project and ${projectArchivedCampaigns.length} campaign(s) restored`)
      } else {
        toast.success('Project restored')
      }
      
      // Remove from archived list
      setArchivedProjects(prev => prev.filter(p => p.id !== projectId))
      
      // Add to main projects state immediately with explicit archived: false
      if (restoredProject) {
        setProjects(prev => [...prev, { ...restoredProject, archived: false }])
      }
    } catch (error) {
      console.error('Error restoring project:', error)
      toast.error('Failed to restore project')
    }
  }

  const handleRestoreCampaign = async (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const restoredCampaign = await campaignsService.update(campaignId, { archived: false })
      
      // Remove from archived list
      setArchivedCampaigns(prev => prev.filter(c => c.id !== campaignId))
      
      // Add to main campaigns state immediately with explicit archived: false
      if (restoredCampaign) {
        setCampaigns(prev => [...prev, { ...restoredCampaign, archived: false }])
      }
      
      toast.success('Campaign restored')
    } catch (error) {
      console.error('Error restoring campaign:', error)
      toast.error('Failed to restore campaign')
    }
  }

  const handleDeleteCampaign = async (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to permanently delete this campaign? This action cannot be undone.')) {
      try {
        await campaignsService.delete(campaignId)
        // Remove from archived list
        setArchivedCampaigns(prev => prev.filter(c => c.id !== campaignId))
        toast.success('Campaign deleted permanently')
      } catch (error) {
        console.error('Error deleting campaign:', error)
        toast.error('Failed to delete campaign')
      }
    }
  }

  const handleRestoreTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await tasksService.update(taskId, { completed: false })
      // Optimistically update local state
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: false } : t))
      toast.success('Task restored')
    } catch (error) {
      console.error('Error restoring task:', error)
      toast.error('Failed to restore task')
    }
  }

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      try {
        await tasksService.delete(taskId)
        // Optimistically remove from local state
        setTasks(prev => prev.filter(t => t.id !== taskId))
        toast.success('Task deleted permanently')
      } catch (error) {
        console.error('Error deleting task:', error)
        toast.error('Failed to delete task')
      }
    }
  }

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      try {
        await projectsService.delete(projectId)
        // Remove from archived list
        setArchivedProjects(prev => prev.filter(p => p.id !== projectId))
        toast.success('Project deleted permanently')
      } catch (error) {
        console.error('Error deleting project:', error)
        toast.error('Failed to delete project')
      }
    }
  }

  const getProjectStats = (projectId: string) => {
    const projectCampaigns = getCampaignsForProject(archivedCampaigns, projectId)
    const projectTasks = archivedCampaignTasks.filter(task => 
      projectCampaigns.some(campaign => campaign.id === task.campaignId)
    )
    console.log(`Stats for project ${projectId}:`, {
      campaigns: projectCampaigns.length,
      tasks: projectTasks.length,
      totalArchivedCampaigns: archivedCampaigns.length,
      totalArchivedTasks: archivedCampaignTasks.length
    })
    return {
      campaignCount: projectCampaigns.length,
      taskCount: projectTasks.length,
    }
  }

  // Sort archived campaign tasks by updated date
  const sortedArchivedTasks = [...archivedCampaignTasks].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  )

  if (loading) {
    return (
      <div className="h-full overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Archived Projects</h2>
            <p className="text-muted-foreground">Loading archived items...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
          )}
          <h2 className="text-3xl font-bold text-foreground mb-2">Archived Projects</h2>
          <p className="text-muted-foreground">
            Projects you've archived. You can restore or permanently delete them.
          </p>
        </div>

        {sortedProjects.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Folder size={64} className="text-muted-foreground mb-4" weight="duotone" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No archived projects</h3>
              <p className="text-muted-foreground text-center">
                Projects you archive will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.map(project => {
              const stats = getProjectStats(project.id)
              return (
                <Card
                  key={project.id}
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all duration-200",
                    "opacity-60 border-dashed"
                  )}
                  onClick={() => onNavigateToProject(project.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <Folder size={32} className="text-muted-foreground" weight="duotone" />
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleRestore(project.id, e)}
                          className="h-8 w-8 p-0"
                          title="Restore project"
                        >
                          <ArrowCounterClockwise size={16} weight="bold" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(project.id, e)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete permanently"
                        >
                          <Trash size={16} weight="bold" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className={cn(
                      "text-xl",
                      project.completed && "line-through text-muted-foreground"
                    )}>
                      {project.title}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target size={16} weight="duotone" />
                        <span>{stats.campaignCount} campaign{stats.campaignCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CheckSquare size={16} weight="duotone" />
                        <span>{stats.taskCount} task{stats.taskCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Archived Campaigns Section */}
        <div className="mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Archived Campaigns</h2>
            <p className="text-muted-foreground">
              Campaigns you've archived. You can restore or permanently delete them.
            </p>
          </div>

          {archivedCampaigns.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target size={64} className="text-muted-foreground mb-4" weight="duotone" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No archived campaigns</h3>
                <p className="text-muted-foreground text-center">
                  Campaigns you archive will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedCampaigns.map(campaign => {
                const campaignTasks = tasks.filter(t => t.campaignId === campaign.id)
                const project = projects.find(p => p.id === campaign.projectId)
                
                return (
                  <Card
                    key={campaign.id}
                    className={cn(
                      "cursor-pointer hover:shadow-lg transition-all duration-200",
                      "opacity-60 border-dashed"
                    )}
                    onClick={() => onNavigateToCampaign(campaign.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <Target size={32} className="text-muted-foreground" weight="duotone" />
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleRestoreCampaign(campaign.id, e)}
                            className="h-8 w-8 p-0"
                            title="Restore campaign"
                          >
                            <ArrowCounterClockwise size={16} weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteCampaign(campaign.id, e)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete permanently"
                          >
                            <Trash size={16} weight="bold" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className="text-xl">
                        {campaign.title}
                      </CardTitle>
                      {project && (
                        <p className="text-sm text-muted-foreground">
                          {project.title}
                        </p>
                      )}
                      {campaign.description && (
                        <CardDescription className="line-clamp-2">
                          {campaign.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckSquare size={16} weight="duotone" />
                        <span>{campaignTasks.length} task{campaignTasks.length !== 1 ? 's' : ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Archived Campaign Tasks Section */}
        <div className="mt-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Archived Tasks</h2>
            <p className="text-muted-foreground">
              Tasks from archived campaigns. You can restore them by restoring their parent campaign.
            </p>
          </div>

          {sortedArchivedTasks.length === 0 ? (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckSquare size={64} className="text-muted-foreground mb-4" weight="duotone" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No archived tasks</h3>
                <p className="text-muted-foreground text-center">
                  Tasks from archived campaigns will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedArchivedTasks.map(task => {
                const campaign = archivedCampaigns.find(c => c.id === task.campaignId)
                const project = campaign ? archivedProjects.find(p => p.id === campaign.projectId) : undefined
                
                return (
                  <Card
                    key={task.id}
                    className={cn(
                      "cursor-pointer hover:shadow-lg transition-all duration-200",
                      "opacity-60 border-dashed"
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        {task.completed ? (
                          <CheckSquare size={32} className="text-muted-foreground" weight="duotone" />
                        ) : (
                          <Square size={32} className="text-muted-foreground" weight="duotone" />
                        )}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleRestoreTask(task.id, e)}
                            className="h-8 w-8 p-0"
                            title="Restore task"
                          >
                            <ArrowCounterClockwise size={16} weight="bold" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete permanently"
                          >
                            <Trash size={16} weight="bold" />
                          </Button>
                        </div>
                      </div>
                      <CardTitle className={cn(
                        "text-xl",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </CardTitle>
                      {(project || campaign) && (
                        <p className="text-sm text-muted-foreground">
                          {project?.title}
                          {project && campaign && ' → '}
                          {campaign?.title}
                        </p>
                      )}
                      {task.description && (
                        <CardDescription className="line-clamp-2">
                          {task.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    {task.dueDate && (
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
