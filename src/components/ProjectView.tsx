import { useState } from 'react'
import { Project, Campaign, Task, Organization, List } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Target, CheckSquare, Calendar, Plus, PencilSimple, Trash, ArrowCounterClockwise, Archive, Copy } from '@phosphor-icons/react'
import { getCampaignsForProject, getCampaignStageLabel } from '@/lib/helpers'
import { campaignsService } from '@/services/campaigns.service'
import { projectsService } from '@/services/projects.service'
import { listsService } from '@/services/lists.service'
import { tasksService } from '@/services/tasks.service'
import { Badge } from './ui/badge'
import { format } from 'date-fns'
import { Button } from './ui/button'
import { toast } from 'sonner'
import ProjectEditDialog from './ProjectEditDialog'
import ConfirmDialog from './ConfirmDialog'
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
import { Alert, AlertDescription } from './ui/alert'

interface ProjectViewProps {
  project: Project
  projects: Project[]
  setProjects: (updater: (projects: Project[]) => Project[]) => void
  campaigns: Campaign[]
  setCampaigns: (updater: (campaigns: Campaign[]) => Campaign[]) => void
  tasks: Task[]
  setTasks: (updater: (tasks: Task[]) => Task[]) => void
  lists: List[]
  setLists: (updater: (lists: List[]) => List[]) => void
  organization: Organization | null
  onNavigateToCampaign: (campaignId: string) => void
  onNavigateBack: () => void
}

export default function ProjectView({
  project,
  projects,
  setProjects,
  campaigns,
  setCampaigns,
  tasks,
  setTasks,
  lists,
  setLists,
  organization,
  onNavigateToCampaign,
  onNavigateBack,
}: ProjectViewProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newCampaignTitle, setNewCampaignTitle] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  
  const projectCampaigns = getCampaignsForProject(campaigns, project.id)
  const sortedCampaigns = [...projectCampaigns].sort((a, b) => a.order - b.order)

  const handleRestoreProject = async () => {
    try {
      // Restore the project
      await projectsService.update(project.id, { archived: false })
      
      // Get all archived campaigns for this project
      const archivedCampaigns = projectCampaigns.filter(c => c.archived)
      
      // Restore all campaigns in this project (which will make their lists and tasks accessible again)
      const campaignRestorePromises = archivedCampaigns.map(campaign => 
        campaignsService.update(campaign.id, { archived: false })
      )
      
      if (campaignRestorePromises.length > 0) {
        await Promise.all(campaignRestorePromises)
        toast.success(
          `Project restored with ${archivedCampaigns.length} campaign(s)`
        )
      } else {
        toast.success('Project restored')
      }
      
      // Navigate back - the real-time subscription will update the lists
      onNavigateBack()
    } catch (error) {
      console.error('Error restoring project:', error)
      toast.error('Failed to restore project')
    }
  }

  const handleDeleteProject = async () => {
    try {
      await projectsService.delete(project.id)
      toast.success('Project deleted')
      // Navigate back - the real-time subscription will update the lists
      onNavigateBack()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleArchiveProject = async () => {
    try {
      await projectsService.update(project.id, { archived: true })
      toast.success('Project archived')
      // Navigate back - the real-time subscription will update the lists
      onNavigateBack()
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error('Failed to archive project')
    }
  }

  const handleDuplicate = async (targetProjectId: string, targetCampaignId?: string, targetListId?: string, newName?: string) => {
    try {
      const projectName = newName || `${project.title} (Copy)`
      const duplicatedProject = await projectsService.duplicate(project.id, projectName)
      // Optimistically add to local state
      setProjects(prev => [...prev, duplicatedProject])
      toast.success('Project duplicated successfully')
      setShowDuplicateDialog(false)
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast.error('Failed to duplicate project')
    }
  }

  const handleCreateCampaign = async () => {
    if (!newCampaignTitle.trim()) {
      toast.error('Please enter a campaign title')
      return
    }

    try {
      const newCampaign = await campaignsService.create({
        title: newCampaignTitle.trim(),
        description: '',
        order: campaigns.length,
        projectId: project.id,
        campaignType: 'other',
        campaignStage: 'planning',
        orgId: organization?.id || '',
      })
      // Optimistically update local state
      setCampaigns(prev => [...prev, newCampaign])
      toast.success('Campaign created')
      setShowCreateDialog(false)
      setNewCampaignTitle('')
      onNavigateToCampaign(newCampaign.id)
    } catch (error) {
      console.error('Error creating campaign:', error)
      toast.error('Failed to create campaign')
    }
  }

  const getCampaignStats = (campaignId: string) => {
    const campaignTasks = tasks.filter(task => task.campaignId === campaignId)
    return {
      taskCount: campaignTasks.length,
    }
  }

  const getStageColor = (stage?: string) => {
    switch (stage) {
      case 'planning':
        return 'bg-label-blue text-white'
      case 'in-progress':
        return 'bg-label-orange text-white'
      case 'launched':
        return 'bg-label-purple text-white'
      case 'completed':
        return 'bg-label-green text-white'
      case 'follow-up':
        return 'bg-label-teal text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="h-full overflow-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {project.archived && (
          <Alert className="mb-4 md:mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <Archive className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
              <span className="text-orange-900 dark:text-orange-100 text-sm md:text-base">
                This project is archived. Restore it to make it active again.
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRestoreProject}
                className="border-orange-600 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900 w-full md:w-auto md:ml-4"
              >
                <ArrowCounterClockwise size={16} className="mr-2" weight="bold" />
                Restore Project
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6 md:mb-8 space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 break-words">{project.title}</h2>
            {project.description && (
              <p className="text-sm md:text-base text-muted-foreground break-words">{project.description}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {!project.archived && (
              <>
                <Button variant="outline" onClick={() => setShowEditDialog(true)} className="w-full sm:w-auto text-sm md:text-base">
                  <PencilSimple size={16} weight="bold" className="mr-2" />
                  Edit Project
                </Button>
                <Button variant="outline" onClick={handleArchiveProject} className="w-full sm:w-auto text-sm md:text-base text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950">
                  <Archive size={16} weight="bold" className="mr-2" />
                  Archive
                </Button>
                <Button variant="outline" onClick={() => setShowDuplicateDialog(true)} className="w-full sm:w-auto text-sm md:text-base text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">
                  <Copy size={16} weight="bold" className="mr-2" />
                  Duplicate
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="w-full sm:w-auto text-sm md:text-base text-destructive hover:bg-destructive/10">
                  <Trash size={16} weight="bold" className="mr-2" />
                  Delete
                </Button>
                <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto text-sm md:text-base">
                  <Plus size={16} weight="bold" className="mr-2" />
                  New Campaign
                </Button>
              </>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={handleDeleteProject}
          title="Delete Project?"
          description={
            projectCampaigns.length > 0
              ? `Are you sure you want to delete "${project.title}" and its ${projectCampaigns.length} campaign${projectCampaigns.length === 1 ? '' : 's'} with ${tasks.filter(t => t.campaignId && projectCampaigns.some(c => c.id === t.campaignId)).length} task${tasks.filter(t => t.campaignId && projectCampaigns.some(c => c.id === t.campaignId)).length === 1 ? '' : 's'}? This action cannot be undone.`
              : `Are you sure you want to delete "${project.title}"? This action cannot be undone.`
          }
          confirmText="Delete Project"
        />

        {sortedCampaigns.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 md:py-16">
              <Target size={48} className="md:w-16 md:h-16 text-muted-foreground mb-4" weight="duotone" />
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No campaigns yet</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center mb-4">
                Create your first campaign for this project
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
                <Plus size={16} weight="bold" className="mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sortedCampaigns.map(campaign => {
              const stats = getCampaignStats(campaign.id)
              return (
                <Card
                  key={campaign.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => onNavigateToCampaign(campaign.id)}
                >
                  <CardHeader className="pb-3 md:pb-4">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <Target size={28} className="md:w-8 md:h-8 text-accent flex-shrink-0" weight="duotone" />
                      {campaign.campaignStage && (
                        <Badge className={`${getStageColor(campaign.campaignStage)} text-xs md:text-sm flex-shrink-0`}>
                          {getCampaignStageLabel(campaign.campaignStage)}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base md:text-xl break-words">{campaign.title}</CardTitle>
                    {campaign.description && (
                      <CardDescription className="line-clamp-2 text-xs md:text-sm">
                        {campaign.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 md:space-y-3">
                      {campaign.launchDate && (
                        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                          <Calendar size={14} className="md:w-4 md:h-4 flex-shrink-0" weight="duotone" />
                          <span className="truncate">Launch: {format(new Date(campaign.launchDate), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
                        <CheckSquare size={14} className="md:w-4 md:h-4 flex-shrink-0" weight="duotone" />
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Create a new campaign for {project.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Campaign Title</Label>
              <Input
                id="campaign-title"
                value={newCampaignTitle}
                onChange={(e) => setNewCampaignTitle(e.target.value)}
                placeholder="Enter campaign name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCampaign()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProjectEditDialog
        project={project}
        projects={projects}
        setProjects={setProjects}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <DuplicateDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        type="project"
        itemName={project.title}
        onDuplicate={handleDuplicate}
        projects={projects}
        campaigns={campaigns}
        lists={lists}
      />
    </div>
  )
}
