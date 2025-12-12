import { Project, Campaign, Task } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Folder, Target, CheckSquare, Archive, PencilSimple, Copy, Trash } from '@phosphor-icons/react'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { getCampaignsForProject } from '@/lib/helpers'
import { projectsService } from '@/services/projects.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface ProjectsViewProps {
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  tasks: Task[]
  onNavigateToProject: (projectId: string) => void
}

export default function ProjectsView({
  projects,
  setProjects,
  campaigns,
  tasks,
  onNavigateToProject,
}: ProjectsViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  
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
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] relative",
                    project.completed && "opacity-60"
                  )}
                  onClick={() => onNavigateToProject(project.id)}
                >
                  {/* Action buttons - Top right corner */}
                  {!project.archived && (
                    <div className="absolute top-3 right-3 flex gap-1 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigateToProject(project.id)
                        }}
                        title="Edit project"
                      >
                        <PencilSimple size={16} weight="bold" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-orange-600"
                        onClick={(e) => handleArchive(project.id, e)}
                        title="Archive project"
                      >
                        <Archive size={16} weight="bold" />
                      </Button>
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
                  )}
                  
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
                    <CardTitle className={cn(
                      "text-base md:text-xl mt-2 break-words",
                      project.completed && "line-through text-muted-foreground"
                    )}>
                      {project.title}
                    </CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2 text-xs md:text-sm mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
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
    </div>
  )
}
