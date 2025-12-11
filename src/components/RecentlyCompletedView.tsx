import { Project, Campaign, Task } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Folder, Target, CheckSquare, CheckCircle } from '@phosphor-icons/react'
import { Checkbox } from './ui/checkbox'
import { getCampaignsForProject } from '@/lib/helpers'
import { projectsService } from '@/services/projects.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface RecentlyCompletedViewProps {
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  tasks: Task[]
  onNavigateToProject: (projectId: string) => void
}

export default function RecentlyCompletedView({
  projects,
  setProjects,
  campaigns,
  tasks,
  onNavigateToProject,
}: RecentlyCompletedViewProps) {
  // Filter for completed projects (but not archived)
  const completedProjects = [...projects]
    .filter(p => p.completed && !p.archived)
    .sort((a, b) => a.order - b.order)

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
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={32} className="text-green-600" weight="duotone" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recently Completed Projects</h2>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Projects marked as completed. Uncheck to restore to active status.
          </p>
        </div>

        {completedProjects.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <CheckCircle size={64} className="text-muted-foreground mb-4" weight="duotone" />
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No completed projects</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center">
                Projects marked as completed will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {completedProjects.map(project => {
              const stats = getProjectStats(project.id)
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] opacity-75"
                  onClick={() => onNavigateToProject(project.id)}
                >
                  <CardHeader className="pb-3 md:pb-4">
                    <div className="flex items-start justify-between gap-2 md:gap-3">
                      <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleToggleComplete(project.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 flex-shrink-0"
                        />
                        <Folder size={24} className="text-green-600 flex-shrink-0 md:w-7 md:h-7" weight="duotone" />
                      </div>
                    </div>
                    <CardTitle className="text-base md:text-xl mt-2 break-words line-through text-muted-foreground">
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
    </div>
  )
}
