import { Project, Campaign, Task } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Folder, Target, CheckSquare, Archive } from '@phosphor-icons/react'
import { Checkbox } from './ui/checkbox'
import { Button } from './ui/button'
import { getCampaignsForProject } from '@/lib/helpers'
import { projectsService } from '@/services/projects.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order)

  const handleToggleComplete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    
    try {
      await projectsService.update(projectId, { completed: !project.completed })
    } catch (error) {
      console.error('Error toggling project completion:', error)
      toast.error('Failed to update project')
    }
  }

  const handleArchive = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await projectsService.update(projectId, { archived: true })
      toast.success('Project archived')
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error('Failed to archive project')
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
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">All Projects</h2>
          <p className="text-muted-foreground">
            Select a project to view its campaigns and tasks
          </p>
        </div>

        {sortedProjects.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Folder size={64} className="text-muted-foreground mb-4" weight="duotone" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground text-center">
                Create your first project from the sidebar to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProjects.filter(p => !p.archived).map(project => {
              const stats = getProjectStats(project.id)
              return (
                <Card
                  key={project.id}
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]",
                    project.completed && "opacity-60"
                  )}
                  onClick={() => onNavigateToProject(project.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={project.completed || false}
                          onCheckedChange={(e) => handleToggleComplete(project.id, e as any)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Folder size={32} className="text-primary" weight="duotone" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleArchive(project.id, e)}
                        className="h-8 w-8 p-0"
                      >
                        <Archive size={16} weight="bold" />
                      </Button>
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
      </div>
    </div>
  )
}
