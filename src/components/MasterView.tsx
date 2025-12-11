import { useState } from 'react'
import { Project, Campaign, Task, List, Label } from '@/lib/types'
import { ScrollArea } from './ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Target, Folder, CheckSquare, Tag, CalendarBlank, ChartBar, ArrowRight, PencilSimple } from '@phosphor-icons/react'
import { formatDate, getLabelColor } from '@/lib/helpers'
import TaskDetailDialog from './TaskDetailDialog'
import ProjectEditDialog from './ProjectEditDialog'
import CampaignEditDialog from './CampaignEditDialog'

interface MasterViewProps {
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  lists: List[]
  labels: Label[]
  setLabels: (updater: (labels: Label[]) => Label[]) => void
  onNavigateToProject?: (projectId: string) => void
  onNavigateToCampaign?: (campaignId: string) => void
  orgId: string
}

export default function MasterView({
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  tasks,
  setTasks,
  lists,
  labels,
  setLabels,
  onNavigateToProject,
  onNavigateToCampaign,
  orgId,
}: MasterViewProps) {
  const [searchText, setSearchText] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)

  const selectedTask = tasks.find(t => t.id === selectedTaskId)
  const editingProject = projects.find(p => p.id === editingProjectId)
  const editingCampaign = campaigns.find(c => c.id === editingCampaignId)

  // Statistics
  const totalProjects = projects.length
  const totalCampaigns = campaigns.length
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t =>
    t.subtasks && t.subtasks.length > 0 && t.subtasks.every(st => st.completed)
  ).length

  // Filter data based on search
  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchText.toLowerCase()) ||
    p.description.toLowerCase().includes(searchText.toLowerCase())
  )

  const filteredCampaigns = campaigns.filter(c =>
    c.title.toLowerCase().includes(searchText.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchText.toLowerCase())
  )

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchText.toLowerCase()) ||
    t.description.toLowerCase().includes(searchText.toLowerCase())
  )

  return (
    <>
      <div className="h-full flex flex-col bg-background">
        <div className="border-b bg-card">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Master View</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete overview of all projects, campaigns, and tasks
                </p>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Folder size={16} weight="duotone" />
                  <span className="text-xs font-medium">Projects</span>
                </div>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Target size={16} weight="duotone" />
                  <span className="text-xs font-medium">Campaigns</span>
                </div>
                <p className="text-2xl font-bold">{totalCampaigns}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CheckSquare size={16} weight="duotone" />
                  <span className="text-xs font-medium">Tasks</span>
                </div>
                <p className="text-2xl font-bold">{totalTasks}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <ChartBar size={16} weight="duotone" />
                  <span className="text-xs font-medium">Completion</span>
                </div>
                <p className="text-2xl font-bold">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Search */}
            <div>
              <Input
                type="search"
                placeholder="Search projects, campaigns, tasks..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="projects" className="space-y-4">
              <TabsList>
                <TabsTrigger value="projects" className="gap-2">
                  <Folder size={16} weight="duotone" />
                  Projects ({filteredProjects.length})
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="gap-2">
                  <Target size={16} weight="duotone" />
                  Campaigns ({filteredCampaigns.length})
                </TabsTrigger>
                <TabsTrigger value="tasks" className="gap-2">
                  <CheckSquare size={16} weight="duotone" />
                  Tasks ({filteredTasks.length})
                </TabsTrigger>
                <TabsTrigger value="labels" className="gap-2">
                  <Tag size={16} weight="duotone" />
                  Labels ({labels.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="projects" className="space-y-4">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Campaigns</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No projects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProjects.map(project => {
                          const projectCampaigns = campaigns.filter(c => c.projectId === project.id)
                          return (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium">{project.title}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {project.description || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{projectCampaigns.length}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(project.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingProjectId(project.id)}
                                  >
                                    <PencilSimple size={16} weight="bold" />
                                  </Button>
                                  {onNavigateToProject && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onNavigateToProject(project.id)}
                                    >
                                      <ArrowRight size={16} weight="bold" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="campaigns" className="space-y-4">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign Name</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Tasks</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCampaigns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No campaigns found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCampaigns.map(campaign => {
                          const campaignProject = projects.find(p => p.id === campaign.projectId)
                          const campaignTasks = tasks.filter(t => t.campaignId === campaign.id)
                          return (
                            <TableRow key={campaign.id}>
                              <TableCell className="font-medium">{campaign.title}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {campaignProject?.title || '-'}
                              </TableCell>
                              <TableCell>
                                {campaign.campaignType && (
                                  <Badge variant="outline" className="capitalize">
                                    {campaign.campaignType.replace('-', ' ')}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {campaign.campaignStage && (
                                  <Badge variant="secondary" className="capitalize">
                                    {campaign.campaignStage.replace('-', ' ')}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge>{campaignTasks.length}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(campaign.createdAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingCampaignId(campaign.id)}
                                  >
                                    <PencilSimple size={16} weight="bold" />
                                  </Button>
                                  {onNavigateToCampaign && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onNavigateToCampaign(campaign.id)}
                                    >
                                      <ArrowRight size={16} weight="bold" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="space-y-4">
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task Title</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>List</TableHead>
                        <TableHead>Labels</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Comments</TableHead>
                        <TableHead>Attachments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No tasks found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTasks.map(task => {
                          const taskCampaign = campaigns.find(c => c.id === task.campaignId)
                          const taskList = lists.find(l => l.id === task.listId)
                          const taskLabels = labels.filter(l => task.labelIds?.includes(l.id))
                          return (
                            <TableRow
                              key={task.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => setSelectedTaskId(task.id)}
                            >
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {taskCampaign?.title || '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {taskList?.title || '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {taskLabels.map(label => (
                                    <Badge
                                      key={label.id}
                                      variant="secondary"
                                      className="text-xs"
                                      style={{ backgroundColor: getLabelColor(label.color) }}
                                    >
                                      {label.name}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {task.dueDate ? (
                                  <div className="flex items-center gap-1">
                                    <CalendarBlank size={14} weight="duotone" />
                                    {formatDate(task.dueDate)}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                {task.comments && task.comments.length > 0 && (
                                  <Badge variant="outline">{task.comments.length}</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {task.attachments && task.attachments.length > 0 && (
                                  <Badge variant="outline">{task.attachments.length}</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="labels" className="space-y-4">
                <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {labels.map(label => {
                    const labelTasks = tasks.filter(t => t.labelIds?.includes(label.id))
                    return (
                      <div
                        key={label.id}
                        className="border rounded-lg p-4 space-y-2"
                        style={{ borderLeftWidth: '4px', borderLeftColor: getLabelColor(label.color) }}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{label.name}</h3>
                          <Badge
                            variant="secondary"
                            style={{ backgroundColor: getLabelColor(label.color) }}
                          >
                            {label.color}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {labelTasks.length} {labelTasks.length === 1 ? 'task' : 'tasks'}
                        </p>
                      </div>
                    )
                  })}
                  {labels.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-8">
                      No labels found
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          tasks={tasks}
          setTasks={setTasks}
          labels={labels}
          setLabels={setLabels}
          lists={lists}
          campaigns={campaigns}
          projects={projects}
          open={!!selectedTaskId}
          onOpenChange={(open) => {
            if (!open) setSelectedTaskId(null)
          }}
          orgId={orgId}
        />
      )}

      {editingProject && (
        <ProjectEditDialog
          project={editingProject}
          projects={projects}
          setProjects={setProjects}
          open={!!editingProjectId}
          onOpenChange={(open) => {
            if (!open) setEditingProjectId(null)
          }}
        />
      )}

      {editingCampaign && (
        <CampaignEditDialog
          campaign={editingCampaign}
          campaigns={campaigns}
          setCampaigns={setCampaigns}
          projects={projects}
          lists={lists}
          open={!!editingCampaignId}
          onOpenChange={(open) => {
            if (!open) setEditingCampaignId(null)
          }}
        />
      )}
    </>
  )
}
