import { Project, Campaign, Task } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Folder, Target, CheckSquare } from '@phosphor-icons/react'
import { getCampaignsForProject } from '@/lib/helpers'

interface ProjectsViewProps {
  projects: Project[]
  campaigns: Campaign[]
  tasks: Task[]
  onNavigateToProject: (projectId: string) => void
}

export default function ProjectsView({
  projects,
  campaigns,
  tasks,
  onNavigateToProject,
}: ProjectsViewProps) {
  const sortedProjects = [...projects].sort((a, b) => a.order - b.order)

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
            {sortedProjects.map(project => {
              const stats = getProjectStats(project.id)
              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => onNavigateToProject(project.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Folder size={32} className="text-primary mb-2" weight="duotone" />
                    </div>
                    <CardTitle className="text-xl">{project.title}</CardTitle>
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
