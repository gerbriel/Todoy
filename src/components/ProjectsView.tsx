import { Project, Campaign, Task, Organization, List } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Folder, Target, CheckSquare, Archive, PencilSimple, Copy, Trash, Plus } from '@phosphor-icons/react'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { getCampaignsForProject } from '@/lib/helpers'
import { projectsService } from '@/services/projects.service'
import { campaignsService } from '@/services/campaigns.service'
import { listsService } from '@/services/lists.service'
import { tasksService } from '@/services/tasks.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import ConfirmDialog from './ConfirmDialog'
import ProjectEditDialog from './ProjectEditDialog'
import DuplicateDialog from './DuplicateDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

interface ProjectsViewProps {
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  organization: Organization | null
  onNavigateToProject: (projectId: string) => void
}

export default function ProjectsView({
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  tasks,
  setTasks,
  lists,
  setLists,
  organization,
  onNavigateToProject,
}: ProjectsViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null)
  const [clickedProjectId, setClickedProjectId] = useState<string | null>(null)
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null)
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null)

  const handleCardClick = (projectId: string) => {
    // If we're already tracking a click timeout, clear it (this is a double-click)
    if (clickTimeout) {
      clearTimeout(clickTimeout)
      setClickTimeout(null)
      setClickedProjectId(null)
      return
    }

    // Set a timeout for single click
    const timeout = setTimeout(() => {
      onNavigateToProject(projectId)
      setClickTimeout(null)
      setClickedProjectId(null)
    }, 250) // 250ms delay to detect double-click

    setClickTimeout(timeout)
    setClickedProjectId(projectId)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout)
      }
    }
  }, [clickTimeout])
  
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order)

  const handleToggleComplete = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    
    try {
      // Optimistically update local state for instant UI feedback
      const newCompletedState = !project.completed
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, completed: newCompletedState } : p
      ))
      
      await projectsService.update(projectId, { completed: newCompletedState })
      toast.success(project.completed ? 'Project marked as active' : 'Project completed!')
      // Real-time subscription will sync the state
    } catch (error) {
      console.error('Error toggling project completion:', error)
      // Revert optimistic update on error
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, completed: project.completed } : p
      ))
      toast.error('Failed to update project')
    }
  }

  const handleArchive = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      console.log('Archiving project:', projectId)
      const result = await projectsService.update(projectId, { archived: true })
      console.log('Archive result:', JSON.stringify(result, null, 2))
      console.log('Archived flag value:', result.archived)
      
      // Archive all campaigns for this project
      const projectCampaigns = campaigns.filter(c => c.projectId === projectId && !c.archived)
      if (projectCampaigns.length > 0) {
        const campaignArchivePromises = projectCampaigns.map(campaign => 
          campaignsService.update(campaign.id, { archived: true })
        )
        await Promise.all(campaignArchivePromises)
        console.log(`Archived ${projectCampaigns.length} campaigns`)
      }
      
      // Optimistically remove from view immediately for better UX
      setProjects(prev => prev.filter(p => p.id !== projectId))
      
      toast.success('Project archived')
      // Real-time subscription will sync the state
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error('Failed to archive project')
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProjectId) return
    
    try {
      await projectsService.delete(selectedProjectId)
      setProjects(prev => prev.filter(p => p.id !== selectedProjectId))
      toast.success('Project deleted')
      setShowDeleteConfirm(false)
      setSelectedProjectId(null)
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleDuplicateProject = async (targetProjectId: string, targetCampaignId?: string, targetListId?: string, newName?: string) => {
    if (!selectedProjectId) return
    
    try {
      const project = projects.find(p => p.id === selectedProjectId)
      const projectName = newName || `${project?.title} (Copy)`
      const duplicatedProject = await projectsService.duplicate(selectedProjectId, projectName)
      
      // Load campaigns for the newly duplicated project
      const newCampaigns = await campaignsService.getByProject(duplicatedProject.id)
      
      // Load lists for all new campaigns
      const listsPromises = newCampaigns.map(campaign => 
        listsService.getByCampaign(campaign.id)
      )
      const listsArrays = await Promise.all(listsPromises)
      const newLists = listsArrays.flat()
      
      // Load tasks for all new campaigns
      const tasksPromises = newCampaigns.map(campaign => 
        tasksService.getByCampaign(campaign.id)
      )
      const tasksArrays = await Promise.all(tasksPromises)
      const newTasks = tasksArrays.flat()
      
      // Manually add the duplicated project, campaigns, lists, and tasks
      setProjects(prev => [...prev, duplicatedProject])
      setCampaigns(prev => [...prev, ...newCampaigns])
      setLists(prev => [...prev, ...newLists])
      setTasks(prev => [...prev, ...newTasks])
      
      console.log(`Loaded ${newCampaigns.length} campaigns, ${newLists.length} lists, and ${newTasks.length} tasks for duplicated project`)
      
      toast.success('Project duplicated successfully')
      setShowDuplicateDialog(false)
      setSelectedProjectId(null)
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast.error('Failed to duplicate project')
    }
  }

  const handleStartEditing = (projectId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProjectId(projectId)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = async (projectId: string) => {
    if (!editingTitle.trim()) {
      toast.error('Project title cannot be empty')
      return
    }

    try {
      await projectsService.update(projectId, { title: editingTitle })
      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, title: editingTitle } : p
      ))
      setEditingProjectId(null)
      toast.success('Project renamed')
    } catch (error) {
      console.error('Error renaming project:', error)
      toast.error('Failed to rename project')
    }
  }

  const handleCancelEdit = () => {
    setEditingProjectId(null)
    setEditingTitle('')
  }

  const handleDragStart = (projectId: string) => {
    setDraggedProjectId(projectId)
  }

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault()
    if (draggedProjectId && draggedProjectId !== projectId) {
      setDragOverProjectId(projectId)
    }
  }

  const handleDragLeave = () => {
    setDragOverProjectId(null)
  }

  const handleDrop = async (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault()
    
    if (!draggedProjectId || draggedProjectId === targetProjectId) {
      setDraggedProjectId(null)
      setDragOverProjectId(null)
      return
    }

    try {
      const activeProjects = sortedProjects.filter(p => !p.archived && !p.completed)
      const draggedIndex = activeProjects.findIndex(p => p.id === draggedProjectId)
      const targetIndex = activeProjects.findIndex(p => p.id === targetProjectId)

      if (draggedIndex === -1 || targetIndex === -1) return

      // Reorder the projects array
      const reorderedProjects = [...activeProjects]
      const [draggedProject] = reorderedProjects.splice(draggedIndex, 1)
      reorderedProjects.splice(targetIndex, 0, draggedProject)

      // Update order property for all affected projects
      const updatedProjects = reorderedProjects.map((project, index) => ({
        ...project,
        order: index
      }))

      // Optimistically update UI
      setProjects(prev => {
        const otherProjects = prev.filter(p => p.archived || p.completed)
        return [...updatedProjects, ...otherProjects]
      })

      // Update in database
      await Promise.all(
        updatedProjects.map(project =>
          projectsService.update(project.id, { order: project.order })
        )
      )

      toast.success('Projects reordered')
    } catch (error) {
      console.error('Error reordering projects:', error)
      toast.error('Failed to reorder projects')
    } finally {
      setDraggedProjectId(null)
      setDragOverProjectId(null)
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) {
      toast.error('Please enter a project title')
      return
    }

    try {
      const newProject = await projectsService.create({
        title: newProjectTitle.trim(),
        description: '',
        order: projects.length,
        orgId: organization?.id || '',
      })
      // Optimistically update local state
      setProjects(prev => [...prev, newProject])
      toast.success('Project created')
      setShowCreateDialog(false)
      setNewProjectTitle('')
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    }
  }

  const getProjectStats = (projectId: string) => {
    const projectCampaigns = getCampaignsForProject(campaigns, projectId)
    const projectTasks = tasks.filter(task => 
      projectCampaigns.some(campaign => campaign.id === task.campaignId)
    )
    return {
      campaignCount: projectCampaigns.length,
      taskCount: projectTasks.length,
    }
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">All Projects</h2>
          <p className="text-sm md:text-base text-muted-foreground">
            Select a project to view its campaigns and tasks
          </p>
        </div>

        {sortedProjects.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <Folder size={64} className="text-muted-foreground mb-4" weight="duotone" />
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No projects yet</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center">
                Create your first project from the sidebar to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sortedProjects.filter(p => !p.archived && !p.completed).map(project => {
              const stats = getProjectStats(project.id)
              return (
                <Card
                  key={project.id}
                  draggable
                  onDragStart={() => handleDragStart(project.id)}
                  onDragOver={(e) => handleDragOver(e, project.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, project.id)}
                  onDragEnd={() => {
                    setDraggedProjectId(null)
                    setDragOverProjectId(null)
                  }}
                  className={cn(
                    "hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative cursor-move",
                    project.completed && "opacity-60",
                    draggedProjectId === project.id && "opacity-50",
                    dragOverProjectId === project.id && "border-2 border-accent"
                  )}
                >
                  {/* Action buttons - Top right corner */}
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProjectId(project.id)
                        setShowEditDialog(true)
                      }}
                      title="Edit project"
                    >
                      <PencilSimple size={16} weight="bold" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProjectId(project.id)
                        setShowDuplicateDialog(true)
                      }}
                      title="Duplicate project"
                    >
                      <Copy size={16} weight="bold" />
                    </Button>
                    {!project.archived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-orange-600"
                        onClick={(e) => handleArchive(project.id, e)}
                        title="Archive project"
                      >
                        <Archive size={16} weight="bold" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedProjectId(project.id)
                        setShowDeleteConfirm(true)
                      }}
                      title="Delete project"
                    >
                      <Trash size={16} weight="bold" />
                    </Button>
                  </div>
                  
                  <CardHeader className="pb-3 md:pb-4">
                    <div className="flex items-start justify-between gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={project.completed || false}
                          onCheckedChange={() => handleToggleComplete(project.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 flex-shrink-0"
                        />
                        <Folder size={24} className="text-primary flex-shrink-0 md:w-7 md:h-7" weight="duotone" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleArchive(project.id, e)}
                        className="h-8 w-8 md:h-9 md:w-9 p-0 flex-shrink-0 touch-manipulation md:hidden"
                      >
                        <Archive size={16} className="md:w-[18px] md:h-[18px]" weight="bold" />
                      </Button>
                    </div>
                    {editingProjectId === project.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(project.id)
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-2 text-base md:text-xl font-semibold"
                        autoFocus
                      />
                    ) : (
                      <CardTitle 
                        className={cn(
                          "text-base md:text-xl mt-2 break-words cursor-text",
                          project.completed && "line-through text-muted-foreground"
                        )}
                        onDoubleClick={(e) => handleStartEditing(project.id, project.title, e)}
                      >
                        {project.title}
                      </CardTitle>
                    )}
                    {project.description && (
                      <CardDescription className="line-clamp-2 text-xs md:text-sm mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent 
                    className="pt-0 cursor-pointer" 
                    onClick={() => handleCardClick(project.id)}
                  >
                    <div className="flex items-center gap-3 md:gap-6 text-xs md:text-sm flex-wrap">
                      <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                        <Target size={16} className="md:w-4 md:h-4 flex-shrink-0" weight="duotone" />
                        <span className="whitespace-nowrap">{stats.campaignCount} campaign{stats.campaignCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-muted-foreground">
                        <CheckSquare size={16} className="md:w-4 md:h-4 flex-shrink-0" weight="duotone" />
                        <span className="whitespace-nowrap">{stats.taskCount} task{stats.taskCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {/* Add New Project Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-dashed border-2 hover:border-accent"
              onClick={() => setShowCreateDialog(true)}
            >
              <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
                <Plus size={48} className="md:w-16 md:h-16 text-muted-foreground mb-4" weight="bold" />
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">New Project</h3>
                <p className="text-sm md:text-base text-muted-foreground text-center">
                  Create a new project
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open)
          if (!open) setSelectedProjectId(null)
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will also delete all campaigns and tasks associated with this project."
        confirmText="Delete"
        variant="danger"
      />

      {selectedProjectId && (
        <ProjectEditDialog
          project={projects.find(p => p.id === selectedProjectId)!}
          projects={projects}
          setProjects={setProjects}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      <DuplicateDialog
        open={showDuplicateDialog}
        onOpenChange={(open) => {
          setShowDuplicateDialog(open)
          if (!open) setSelectedProjectId(null)
        }}
        type="project"
        itemName={selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.title || '' : ''}
        onDuplicate={handleDuplicateProject}
        projects={projects}
        campaigns={campaigns}
        lists={[]}
      />

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project to organize your campaigns and tasks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Project Title</Label>
              <Input
                id="project-title"
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                placeholder="Enter project name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
