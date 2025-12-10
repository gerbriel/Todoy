import { Project, Campaign, Task } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Folder, Target, CheckSquare, ArrowCounterClockwise, Trash } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { getCampaignsForProject } from '@/lib/helpers'
import { cn } from '@/lib/utils'

interface ArchiveViewProps {
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  tasks: Task[]
  onNavigateToProject: (projectId: string) => void
}

export default function ArchiveView({
  projects,
  setProjects,
  campaigns,
  tasks,
  onNavigateToProject,
}: ArchiveViewProps) {
  const archivedProjects = [...projects]
    .filter(p => p.archived)
    .sort((a, b) => a.order - b.order)

  const handleRestore = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setProjects((currentProjects) =>
      currentProjects.map((p) =>
        p.id === projectId ? { ...p, archived: false } : p
      )
    )
  }

  const handleDelete = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to permanently delete this project? This action cannot be undone.')) {
      setProjects((currentProjects) =>
        currentProjects.filter((p) => p.id !== projectId)
      )
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Archived Projects</h2>
          <p className="text-muted-foreground">
            Projects you've archived. You can restore or permanently delete them.
          </p>
        </div>

        {archivedProjects.length === 0 ? (
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
            {archivedProjects.map(project => {
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
      </div>
    </div>
  )
}
